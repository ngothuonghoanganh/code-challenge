import type { ExceptionCode } from "../constants";

export const EXCEPTION_HTTP_STATUS: Record<ExceptionCode, number> = {
  VALIDATION_ERROR: 400,
  INVALID_JSON: 400,
  INVALID_PARAMETER: 400,
  RESOURCE_NOT_FOUND: 404,
  ROUTE_NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const EXCEPTION_MESSAGES: Record<ExceptionCode, string> = {
  VALIDATION_ERROR: "Request validation failed",
  INVALID_JSON: "Request body must contain valid JSON",
  INVALID_PARAMETER: "Request parameter is invalid",
  RESOURCE_NOT_FOUND: "Resource not found",
  ROUTE_NOT_FOUND: "Route not found",
  INTERNAL_SERVER_ERROR: "An unexpected error occurred",
};

export function getExceptionHttpStatus(code: ExceptionCode): number {
  return EXCEPTION_HTTP_STATUS[code];
}

export function getExceptionMessage(code: ExceptionCode): string {
  return EXCEPTION_MESSAGES[code];
}

export class AppError extends Error {
  readonly statusCode: number;

  constructor(
    readonly code: ExceptionCode,
    message = getExceptionMessage(code),
    readonly details?: unknown,
  ) {
    super(message);
    this.statusCode = getExceptionHttpStatus(code);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(code: ExceptionCode, message = getExceptionMessage(code)) {
    super(code, message);
    this.name = "NotFoundError";
  }
}
