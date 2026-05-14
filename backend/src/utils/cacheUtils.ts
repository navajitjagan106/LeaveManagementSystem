import persistentProxy from "../config/redis";

export const getCache = async (key: string): Promise<any | null> => {
    const data = await persistentProxy.get(key);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data;
        }
    }
    return null;
};

export const setCache = async (key: string, data: any, ttlSeconds: number = 300) => {
    const value = typeof data === "string" ? data : JSON.stringify(data);
    await persistentProxy.setex(key, ttlSeconds, value);
};

export const invalidateCache = async (keyOrPrefix: string, isPrefix: boolean = false) => {
    if (isPrefix) {
        const keys = await persistentProxy.keys(keyOrPrefix + "*");
        if (keys && keys.length > 0) {
            await Promise.all(keys.map((k: string) => persistentProxy.del(k)));
        }
    } else {
        await persistentProxy.del(keyOrPrefix);
    }
};

export const clearCache = async () => {
    await persistentProxy.flushall();
};
