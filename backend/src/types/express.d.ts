declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      role_id: number;
      name: string;
      email: string;
      manager_id?: number | null;
      department?: string | null;
      iat?: number;
      exp?: number;
    };
  }
}

export {};