import { NextResponse } from 'next/server';

/**
 * Environment-aware error response utility
 */
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: Error | ApiError,
  fallbackMessage: string = 'Internal server error'
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log error internally
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  let statusCode = 500;
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
  }

  // Determine response message
  let responseMessage = fallbackMessage;
  if (isDevelopment) {
    responseMessage = error.message;
  } else if (error instanceof ApiError && error.isOperational) {
    responseMessage = error.message;
  }

  return NextResponse.json(
    { error: responseMessage },
    { status: statusCode }
  );
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: any): NextResponse {
  console.error('Database error:', error);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    return NextResponse.json(
      { error: isDevelopment ? error.message : 'Database service temporarily unavailable' },
      { status: 503 }
    );
  }
  
  if (error.name === 'ValidationError') {
    return NextResponse.json(
      { error: isDevelopment ? error.message : 'Invalid data provided' },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { error: isDevelopment ? error.message : 'Database operation failed' },
    { status: 500 }
  );
}

/**
 * Authentication error handler
 */
export function handleAuthError(error: any): NextResponse {
  console.error('Authentication error:', error);
  
  return NextResponse.json(
    { error: 'Authentication failed' },
    { status: 401 }
  );
}