import { Request, Response, NextFunction, RequestHandler } from 'express';

// Define a type for an async request handler
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an asynchronous Express route handler to catch errors and pass them to the next middleware.
 * This prevents unhandled promise rejections from crashing the server.
 *
 * @param fn The asynchronous request handler function.
 * @returns An Express RequestHandler that handles promises.
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};