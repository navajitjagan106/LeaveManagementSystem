import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
}

const options: any = {
    // Standard reconnection strategy
    retryStrategy: (times: number) => {
        return Math.min(times * 50, 2000);
    }
};

// Enable TLS for rediss:// URLs (external connections)
if (redisUrl.startsWith("rediss://")) {
    options.tls = { rejectUnauthorized: false };
}

const redis = new Redis(redisUrl, options);

redis.on("connect", () => {
    console.log("Redis socket connected");
});

redis.on("ready", () => {
    console.log("Redis ready and authenticated");
});

redis.on("error", (err: any) => {
    console.error("Redis error:", err);
});

export default redis;