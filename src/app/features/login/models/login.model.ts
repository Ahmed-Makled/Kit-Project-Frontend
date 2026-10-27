export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface LoginResponse {
  UserId: string;
  AccessToken: string;
  Name: string;
  Role: number;
}
