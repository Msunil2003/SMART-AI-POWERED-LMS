const errorMiddleware = (err, req, res, next) => {
  console.error("🔥 ERROR STACK TRACE:");
  console.error(err.stack); // Logs the full stack trace to your terminal

  const status = err.status || 500;
  const message = err.message || "Something went wrong, Please check again";

  res.status(status).json({
    success: false,
    status,
    message
  });
};

export default errorMiddleware;
