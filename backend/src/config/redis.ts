import Redis from "ioredis";

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

let redis: any;

if (process.env.NODE_ENV === "development") {
    console.log("Using in-memory store for OTPs (Bypassing Redis allowlist issues)");
    redis = new RedisMock();
} else {
    redis = new Redis(process.env.REDIS_URL as string);
    redis.on("connect", () => console.log("Redis connected"));
    redis.on("error", (err: any) => console.error("Redis error:", err));
}

export default redis;