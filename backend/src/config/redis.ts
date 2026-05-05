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
        // Stop retrying if we hit a fatal error like allowlist
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
        // Only log errors once to avoid spamming the console
        if (!isMock) {
            console.error("Redis connection error:", err.message);
            if (err.code === "ECONNREFUSED" || err.message.includes("allowlist") || err.message.includes("permission")) {
                console.warn("⚠️ Switching to in-memory store for OTPs (Local Development Fallback)");
                isMock = true;
                instance.disconnect();
            }
        }
    });
} else {
    console.log("No REDIS_URL found. Using in-memory store for OTPs.");
    isMock = true;
}

// Proxy object to route calls to either the real Redis or the fallback
const persistentProxy = {
    get: async (key: string) => {
        if (isMock) return fallbackStore.get(key);
        try {
            return await instance.get(key);
        } catch {
            isMock = true;
            return fallbackStore.get(key);
        }
    },
    setex: async (key: string, ttl: number, value: string) => {
        if (isMock) return fallbackStore.setex(key, ttl, value);
        try {
            return await instance.setex(key, ttl, value);
        } catch {
            isMock = true;
            return fallbackStore.setex(key, ttl, value);
        }
    },
    del: async (key: string) => {
        if (isMock) return fallbackStore.del(key);
        try {
            return await instance.del(key);
        } catch {
            isMock = true;
            return fallbackStore.del(key);
        }
    },
    on: (event: string, callback: any) => {
        if (instance) instance.on(event, callback);
    }
};

export default persistentProxy;