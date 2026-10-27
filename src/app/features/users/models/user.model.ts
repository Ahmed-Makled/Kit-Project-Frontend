import { BaseEntity } from '@app/core/models/api-response.model';

export interface UserSearchViewModel {
  Search?: string;
  Username?: string;
  IsActive?: boolean | string;
  Role?: number | string;
}

export interface User extends BaseEntity {
  FirstName: string;
  LastName: string;
  Role: number;
  Username: string;
  Password?: string;
  Email?: string | null;
  IsActive: boolean;
  CreatedAt: string;
  LastLoginAt?: string;
  DepartmentId?: string | null;
  DepartmentName?: string | null;
}
