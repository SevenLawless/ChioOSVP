class AppError extends Error {
    constructor(message, statusCode = 400, errors = []) {
      super(message);
  
      this.name = "AppError";
      this.statusCode = statusCode;
      this.errors = errors;
      this.isOperational = true;
    }
  }
  
  module.exports = AppError;