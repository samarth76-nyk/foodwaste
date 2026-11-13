/**
 * Higher-order function to eliminate boilerplate try-catch blocks in async controllers.
 * Any rejected promise is passed automatically to express next(error) middleware.
 * 
 * @param {Function} requestHandler Async controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
