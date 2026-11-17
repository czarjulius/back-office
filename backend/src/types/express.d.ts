declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string | null;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export {};
