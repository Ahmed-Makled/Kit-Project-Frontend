import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Roles } from '../enums/roles';
import { LookupItem } from '../types/lookup';

@Injectable({
  providedIn: 'root',
})
export class LookupsService {
  getRoles(): Observable<LookupItem[]> {
    return of([
      { Id: '', Name: 'FILTER.ALL' },
      { Id: Roles.Admin, Name: 'USERS.ROLES.ADMIN' },
      { Id: Roles.User, Name: 'USERS.ROLES.USER' },
    ]);
  }

  getStatuses(): Observable<LookupItem[]> {
    return of([
      { Id: '', Name: 'FILTER.ALL' },
      { Id: 'true', Name: 'SHARED.STATUS.ACTIVE' },
      { Id: 'false', Name: 'SHARED.STATUS.INACTIVE' },
    ]);
  }
}
