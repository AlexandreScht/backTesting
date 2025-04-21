export class ServerException extends Error {
  public status: number;
  public message: string;

  constructor(status: number = 500, message: string | string[] = 'An error occurred') {
    const finalMessage = Array.isArray(message) ? message.join(' | ') : message;
    super(finalMessage);
    this.status = status;
    this.message = finalMessage;
  }
}

export class NotFoundError extends ServerException {
  constructor(message: string | string[] = 'Resource not found') {
    super(404, message);
  }
}

export class InvalidArgumentError extends ServerException {
  constructor(message: string | string[] = 'Invalid arguments') {
    super(422, message);
  }
}

export class InvalidRoleAccessError extends ServerException {
  constructor(message: string[] | string = 'Access denied. You don’t have permission to access this resource') {
    super(605, message);
  }
}

export class InvalidCredentialsError extends ServerException {
  constructor(message: string | string[] = 'Invalid credentials') {
    super(401, message);
  }
}

export class InvalidSessionError extends ServerException {
  constructor(message: string | string[] = 'Invalid session') {
    super(403, message);
  }
}

export class ExpiredSessionError extends ServerException {
  constructor(message: string | string[] = 'Session expired') {
    super(999, message);
  }
}

export class InvalidAccessError extends ServerException {
  constructor(message: string | string[] = 'Access denied') {
    super(403, message);
  }
}

export class ServicesError extends ServerException {
  constructor(message: string[] | string = 'The service encountered an unexpected error. Please try again later.') {
    super(505, message);
  }
}
