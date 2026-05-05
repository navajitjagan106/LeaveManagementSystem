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
let redis: any;

if (process.env.NODE_ENV === "development" || !redisUrl) {
    console.log(
        !redisUrl 
            ? "REDIS_URL not found. Using in-memory store for OTPs." 
            : "Development mode: Using in-memory store for OTPs."
    );
    redis = new RedisMock();
} else {
    // For Render/Managed Redis, rediss:// usually needs TLS config
    const options: any = {};
    if (redisUrl.startsWith("rediss://")) {
        options.tls = { rejectUnauthorized: false };
    }

    redis = new Redis(redisUrl, options);
    redis.on("connect", () => console.log("Redis connected"));
    redis.on("error", (err: any) => {
        console.error("Redis error:", err);
        // If it's a connection error, we might want to fallback to mock to keep the app running
        if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
            console.warn("Falling back to in-memory store due to Redis connection failure.");
            redis = new RedisMock();
        }
    });
}

export default redis;