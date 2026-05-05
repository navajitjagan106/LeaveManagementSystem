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

if (redisUrl) {
    const options: any = {};
    if (redisUrl.startsWith("rediss://")) {
        options.tls = { rejectUnauthorized: false };
    }

    instance = new Redis(redisUrl, options);
    instance.on("connect", () => {
        console.log("Redis connected");
        isMock = false;
    });
    instance.on("error", (err: any) => {
        console.error("Redis error:", err);
        if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.message.includes("allowlist")) {
            if (!isMock) {
                console.warn("Falling back to in-memory store due to Redis connection failure.");
                isMock = true;
            }
        }
    });
} else {
    console.log("No REDIS_URL found. Using in-memory store for OTPs.");
    instance = new RedisMock();
    isMock = true;
}

// Export a proxy that routes calls to either the real Redis instance or the Mock
const redisProxy = {
    get: async (key: string) => {
        if (isMock) return new RedisMock().get(key); // Simplified: always use a fresh mock or persistent one
        try {
            return await instance.get(key);
        } catch {
            return new RedisMock().get(key);
        }
    },
    setex: async (key: string, ttl: number, value: string) => {
        if (isMock) return new RedisMock().setex(key, ttl, value);
        try {
            return await instance.setex(key, ttl, value);
        } catch {
            return new RedisMock().setex(key, ttl, value);
        }
    },
    del: async (key: string) => {
        if (isMock) return new RedisMock().del(key);
        try {
            return await instance.del(key);
        } catch {
            return new RedisMock().del(key);
        }
    },
    on: (event: string, callback: any) => instance.on(event, callback)
};

// To make the mock truly persistent if we fallback
const fallbackStore = new RedisMock();
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
    on: (event: string, callback: any) => instance.on(event, callback)
};

export default persistentProxy;