const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  // a malformed id like /api/messages/abc is a bad request, not a server crash
  if (err.name === "CastError") statusCode = 400;
  // helpers like the OTP module attach their own status
  if (err.status) statusCode = err.status;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
}
module.exports = { notFound, errorHandler };
