import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Pagination } from '@app/core/models/api-response.model';
import { User, UserSearchViewModel } from '../models/user.model';
import { BASE_API } from '@app/core/tokens/api.tokens';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly api = inject(BASE_API);
  get(
    searchViewModel: UserSearchViewModel | null,
    orderBy: string,
    isAscending: boolean,
    pageIndex: number,
    pageSize: number = 50,
  ): Observable<ApiResponse<Pagination<User>>> {
    let params = new HttpParams()
      .set('OrderBy', orderBy)
      .set('IsAscending', isAscending.toString())
      .set('PageIndex', pageIndex.toString())
      .set('PageSize', pageSize.toString());

    if (searchViewModel) {
      Object.keys(searchViewModel).forEach((key) => {
        const value = searchViewModel[key as keyof typeof searchViewModel];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.api.get<Pagination<User>>('Users/get', { params });
  }

  getById(id: string | number): Observable<ApiResponse<User>> {
    return this.api.get<User>(`Users/${id}`);
  }

  getMainInfo(): Observable<ApiResponse<User>> {
    return this.api.get<User>('Users/GetMainInfo');
  }

  post(model: Partial<User>): Observable<ApiResponse<unknown>> {
    return this.api.post<unknown>('Users/Post', model);
  }

  put(id: string | number, model: Partial<User>): Observable<ApiResponse<boolean>> {
    return this.api.put<boolean>(`Users/${id}`, model);
  }

  delete(id: string): Observable<ApiResponse<unknown>> {
    return this.api.delete<unknown>(`Users/${id}`);
  }

  changeStatus(id: string | number, model: Pick<User, 'IsActive'>): Observable<ApiResponse<User>> {
    return this.api.put<User>(`Users/${id}/SetActive`, model);
  }

  resetPassword(id: string | number, model: { NewPassword: string }): Observable<ApiResponse<unknown>> {
    return this.api.put<unknown>(`Users/${id}/ResetPassword`, model);
  }
}
