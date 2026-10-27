import { InjectionToken } from '@angular/core';
import { BaseApiService } from '../services/base-api.service';
import { HttpContextToken } from '@angular/common/http';

export const BASE_API = new InjectionToken<BaseApiService>('BASE_API');
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
