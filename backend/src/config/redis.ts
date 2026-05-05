import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

// In-memory fallback if Redis connection fails or for local dev
class RedisMock {
    private store = new Map<string, string>();
    async get(key: string) { return this.store.get(key) || null; }
    async setex(key: string, _ttl: number, value: string) { this.store.set(key, value); }
    async del(key: string) { this.store.delete(key); }
    on(event: string, callback: () => void) {
        if (event === "connect") setTimeout(callback, 100);
    }
}

const redisUrl = process.env.REDIS_URL;
let instance: any;
let isMock = false;
const fallbackStore = new RedisMock();

if (redisUrl) {
    const options: any = {
        retryStrategy: (times: number) => {
            if (isMock) return null; 
            return Math.min(times * 50, 2000);
        }
    };
    if (redisUrl.startsWith("rediss://")) {
        options.tls = { rejectUnauthorized: false };
    }

    instance = new Redis(redisUrl, options);
    
    instance.on("connect", () => {
        console.log("Redis socket connected");
    });

    instance.on("ready", () => {
        console.log("Redis ready and authenticated");
        isMock = false;
    });

    instance.on("error", (err: any) => {
        if (!isMock) {
            console.error("Redis connection error:", err.message);
            // If it's an allowlist error, we MUST use mock locally
            if (err.message.includes("allowlist")) {
                console.warn("⚠️ Switching to in-memory store (Allowlist Error)");
                isMock = true;
                instance.disconnect();
            }
        }
    });
} else {
    isMock = true;
}

// Proxy object with detailed logging
const persistentProxy = {
    get: async (key: string) => {
        const storeType = isMock ? "MOCK" : "REAL";
        console.log(`[REDIS ${storeType}] GET ${key}`);
        if (isMock) return fallbackStore.get(key);
        try {
            return await instance.get(key);
        } catch (err: any) {
            console.error(`[REDIS REAL] GET FAILED, falling back: ${err.message}`);
            isMock = true;
            return fallbackStore.get(key);
        }
    },
    setex: async (key: string, ttl: number, value: string) => {
        const storeType = isMock ? "MOCK" : "REAL";
        console.log(`[REDIS ${storeType}] SETEX ${key} (ttl: ${ttl})`);
        if (isMock) return fallbackStore.setex(key, ttl, value);
        try {
            return await instance.setex(key, ttl, value);
        } catch (err: any) {
            console.error(`[REDIS REAL] SETEX FAILED, falling back: ${err.message}`);
            isMock = true;
            return fallbackStore.setex(key, ttl, value);
        }
    },
    del: async (key: string) => {
        const storeType = isMock ? "MOCK" : "REAL";
        console.log(`[REDIS ${storeType}] DEL ${key}`);
        if (isMock) return fallbackStore.del(key);
        try {
            return await instance.del(key);
        } catch (err: any) {
            console.error(`[REDIS REAL] DEL FAILED, falling back: ${err.message}`);
            isMock = true;
            return fallbackStore.del(key);
        }
    },
    on: (event: string, callback: any) => {
        if (instance) instance.on(event, callback);
    }
};

export default persistentProxy;