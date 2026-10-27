export interface BaseEntity {
  Id: string;
}

export interface ApiError {
  Code?: string;
  Message?: string;
  Description?: string;
}

export interface ApiFieldError {
  PropertyName?: string;
  ErrorMessage?: string;
}

export interface ApiResponse<T> {
  IsSuccess?: boolean;
  Data?: T;
  Error?: ApiError | null;
  Message?: string;
  ErrorCode?: number;
  IsAuthorized?: boolean;
  Errors?: ApiFieldError[];
}

export interface Pagination<T> {
  PageIndex: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
  Items: T[];
}
