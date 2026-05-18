import Redis from "ioredis";
import dotenv from "dotenv";
// Redundant dotenv.config() removed (handled in app.ts)

// In-memory fallback if Redis connection fails or for local dev
class RedisMock {
    private store = new Map<string, string>();
    private timers = new Map<string, NodeJS.Timeout>();

    async get(key: string) {
        return this.store.get(key) || null;
    }

    async setex(key: string, ttl: number, value: string) {
        this.store.set(key, value);
        
        const existing = this.timers.get(key);
        if (existing) {
            clearTimeout(existing);
        }

        const timer = setTimeout(() => {
            this.store.delete(key);
            this.timers.delete(key);
        }, ttl * 1000);

        if (typeof timer.unref === "function") {
            timer.unref();
        }
        this.timers.set(key, timer);
    }

    async del(key: string) {
        this.store.delete(key);
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }

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
    });

    instance.on("ready", () => {
        isMock = false;
    });

    instance.on("error", (err: any) => {
        if (!isMock) {
            console.warn(`⚠️  Redis: Connection error (${err.message}). Switching to standard in-memory local cache fallback.`);
            isMock = true;
            try {
                instance.disconnect();
            } catch (e) {}
        }
    });
} else {
    isMock = true;
}

// Proxy object with detailed logging
const persistentProxy = {
    get: async (key: string) => {
        if (isMock) return fallbackStore.get(key);
        try {
            return await instance.get(key);
        } catch (err: any) {
            isMock = true;
            return fallbackStore.get(key);
        }
    },
    setex: async (key: string, ttl: number, value: string) => {
        if (isMock) return fallbackStore.setex(key, ttl, value);
        try {
            return await instance.setex(key, ttl, value);
        } catch (err: any) {
            isMock = true;
            return fallbackStore.setex(key, ttl, value);
        }
    },
    del: async (key: string) => {
        if (isMock) return fallbackStore.del(key);
        try {
            return await instance.del(key);
        } catch (err: any) {
            isMock = true;
            return fallbackStore.del(key);
        }
    },
    keys: async (pattern: string) => {
        if (isMock) {
            // Very basic mock for keys
            const results: string[] = [];
            // Accessing private store for the sake of the proxy
            const store = (fallbackStore as any).store;
            for (const key of store.keys()) {
                if (key.includes(pattern.replace('*', ''))) results.push(key);
            }
            return results;
        }
        try {
            return await instance.keys(pattern);
        } catch (err: any) {
            console.error(`[REDIS REAL] KEYS FAILED: ${err.message}`);
            return [];
        }
    },
    flushall: async () => {
        if (isMock) {
            (fallbackStore as any).store.clear();
            (fallbackStore as any).timers.clear();
            return;
        }
        try {
            return await instance.flushall();
        } catch (err: any) {
            console.error(`[REDIS REAL] FLUSHALL FAILED: ${err.message}`);
        }
    },
    on: (event: string, callback: any) => {
        if (instance) instance.on(event, callback);
    }
};

export default persistentProxy;