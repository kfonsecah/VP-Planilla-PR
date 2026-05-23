import { Request, Response, NextFunction } from 'express';
import hpp from 'hpp';

/**
 * Middleware to safely normalize req.query in Express 5.
 * Express 5 defines req.query as a getter. Mutating it directly throws an error.
 * This middleware shadows the getter with a new configurable property.
 */
export const normalizeQuery = (req: Request, res: Response, next: NextFunction) => {
  // Create a shallow copy of the query object
  const newQuery = { ...req.query };
  
  // Shadow the prototype getter with an own property
  Object.defineProperty(req, 'query', {
    value: newQuery,
    configurable: true,
    enumerable: true,
    writable: true
  });
  
  next();
};

/**
 * HTTP Parameter Pollution prevention middleware.
 * Whitelists specific query parameters that are legitimately expected to be arrays.
 */
export const preventParameterPollution = hpp({
  whitelist: [
    'employeeId',
    'employee_id',
    'status',
    'type',
    'role',
    'action',
    'entity'
  ]
});

/**
 * Combined security middleware for query parameters.
 * MUST run after express.urlencoded and express.json, but before routing.
 */
export const querySecurityMiddleware = [
  normalizeQuery,
  preventParameterPollution
];
