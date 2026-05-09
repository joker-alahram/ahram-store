export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_BLOCKED_USER'
  | 'PERMISSION_DENIED'
  | 'PRODUCT_NOT_SELLABLE'
  | 'INVENTORY_INSUFFICIENT'
  | 'ORDER_NOT_FOUND'
  | 'ORDER_ALREADY_FINALIZED'
  | 'CONCURRENCY_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'SESSION_INVALID'
  | 'RESOURCE_NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown[];
}

export interface ApiErrorResponse {
  error: ApiError;
  request_id?: string;
  correlation_id?: string;
}
