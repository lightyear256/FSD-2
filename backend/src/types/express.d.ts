declare namespace Express {
  export interface UserPayload {
    id: string;
  }

  export interface Request {
    user?: UserPayload;
  }
}