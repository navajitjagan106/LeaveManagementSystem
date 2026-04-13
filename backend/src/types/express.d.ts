declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      role: string;
      name: string;
      iat?: number;
      exp?: number;
    };
  }
}

export {};