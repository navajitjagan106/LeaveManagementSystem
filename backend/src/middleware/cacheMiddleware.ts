import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../utils/cacheUtils';

/**
 * Cache middleware for Express.
 * @param ttlSeconds Time to live in seconds.
 * @param type 'global' (same for all) or 'user' (unique per user) or 'role' (unique per role).
 */
export const apiCache = (ttlSeconds: number, type: 'global' | 'user' | 'role' = 'global') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const userId = (req as any).user?.id;
        const roleId = (req as any).user?.role_id;

        let key = '';
        if (type === 'user' && userId) {
            key = `user:${userId}:${req.originalUrl}`;
        } else if (type === 'role' && roleId) {
            key = `role:${roleId}:${req.originalUrl}`;
        } else {
            key = `global:${req.originalUrl}`;
        }

        const cachedData = await getCache(key);
        if (cachedData) {
            return res.json(cachedData);
        }


        // Override res.json to capture the response and cache it
        const originalJson = res.json;
        res.json = function (data: any) {
            // Only cache successful responses (optional: check status code)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                setCache(key, data, ttlSeconds);
            }
            return originalJson.call(this, data);
        };

        next();
    };
};
