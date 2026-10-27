import { inject, Injectable } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';

export class PageOptions {
  orderBy: string = 'ID';
  isAscending: boolean = false;
  currentPage?: number;
  pageSize?: number;
}

export class SaveFilterationViewModel {
  pageRoute: string | undefined;
  searchForm: UntypedFormGroup | undefined;
  orderBy?: string = 'ID';
  isAscending?: boolean = false;
  pageSize?: number = 50;
  currentPage?: number = 1;
}

@Injectable({
  providedIn: 'root',
})
export class UrlFilterSyncService {
  private router = inject(Router);

  loadFromUrl(params: any, searchForm: UntypedFormGroup, pageSort?: PageOptions) {
    const getControl = (form: any, key: string) => {
      if (form.get) return form.get(key);
      if (form.controls && form.controls[key]) return form.controls[key];
      return undefined;
    };

    const findControl = (form: any, key: string) => {
      let control = getControl(form, key);
      if (control) return control;

      if (form.controls) {
        const lowerKey = key.toLowerCase();
        for (const formKey in form.controls) {
          if (formKey.toLowerCase() == lowerKey) {
            return getControl(form, formKey);
          }
        }
      }

      return undefined;
    };

    if (Object.keys(params).length > 0) {
      for (const key in params) {
        const lowerKey = key.toLowerCase();
        const paramValue = params[key];

        if (lowerKey == 'orderby' || lowerKey == 'isascending' || lowerKey == 'currentpage' || lowerKey == 'pagesize' || lowerKey == 'key') {
          if (pageSort) {
            if (lowerKey == 'orderby') pageSort.orderBy = paramValue;
            if (lowerKey == 'isascending') pageSort.isAscending = paramValue == 'true' || paramValue == true;
            if (lowerKey == 'currentpage') pageSort.currentPage = +paramValue;
            if (lowerKey == 'pagesize') pageSort.pageSize = +paramValue;
          }
          continue;
        }

        const control = findControl(searchForm, key);
        if (!control) continue;

        let valueToSet: any = paramValue;

        if (lowerKey.endsWith('id')) {
          valueToSet = paramValue.toString();
        } else if (typeof paramValue == 'string' && paramValue.length == 6 && /^\d{6}$/.test(paramValue)) {
          valueToSet = paramValue;
        } else if (typeof paramValue == 'string' && paramValue.length > 10 && /^\d+$/.test(paramValue)) {
          valueToSet = paramValue;
        } else if (!isNaN(paramValue) && paramValue !== '' && (!paramValue.toString().startsWith('0') || paramValue == '0')) {
          valueToSet = +paramValue;
        } else {
          valueToSet = paramValue.toString();
        }

        control.setValue(valueToSet, { emitEvent: true });
      }
    } else {
      if (searchForm.controls) {
        for (const key in searchForm.controls) {
          const control = getControl(searchForm, key);
          if (control) {
            control.setValue(null);
          }
        }
      }
    }
  }

  saveToUrl(model: SaveFilterationViewModel) {
    const params: Record<string, unknown> = {};

    const getControlValue = (form: any, key: string) => {
      if (form.get) {
        const control = form.get(key);
        return control ? control.value : undefined;
      }
      if (form.controls && form.controls[key]) {
        return form.controls[key].value;
      }
      return undefined;
    };

    const getControlKeys = (form: any): string[] => {
      if (form.controls) {
        return Object.keys(form.controls);
      }
      return [];
    };

    if (model.searchForm) {
      const controlKeys = getControlKeys(model.searchForm);

      for (const key of controlKeys) {
        const value = getControlValue(model.searchForm, key);

        if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
          continue;
        }

        if (typeof value == 'boolean' || typeof value == 'number' || typeof value == 'string') {
          params[key] = value;
        } else {
          params[key] = value.toString();
        }
      }
    }

    if (model.orderBy) {
      params['orderBy'] = model.orderBy;
    }
    if (model.isAscending !== undefined) {
      params['isAscending'] = model.isAscending;
    }
    if (model.currentPage !== undefined) {
      params['currentPage'] = model.currentPage;
    }
    if (model.pageSize !== undefined) {
      params['pageSize'] = model.pageSize;
    }

    params['key'] = (Math.random() * 1000).toString();

    this.router.navigate([model.pageRoute], { queryParams: params });
  }
}
