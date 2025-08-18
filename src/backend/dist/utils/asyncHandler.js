"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
/**
 * Wraps an asynchronous Express route handler to catch errors and pass them to the next middleware.
 * This prevents unhandled promise rejections from crashing the server.
 *
 * @param fn The asynchronous request handler function.
 * @returns An Express RequestHandler that handles promises.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
