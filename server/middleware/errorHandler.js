/**
 * Global error handler middleware.
 * Ensures the system fails closed and never leaks raw internal stack traces.
 */
export function errorHandler(err, req, res, next) {
  console.error('Server error caught in errorHandler:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "We couldn't complete the safety check. Please try again.";

  res.status(statusCode).json({
    allowed: false,
    flagged: false,
    error: true,
    message: message,
    statusCode
  });
}
