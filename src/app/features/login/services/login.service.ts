import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/login.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '@app/core/models/api-response.model';
import { SKIP_ERROR_TOAST } from '@app/core/tokens/api.tokens';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/Auth/Login`, credentials, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true),
    });
  }
}
