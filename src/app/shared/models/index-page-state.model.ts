import { FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { Column } from '../types/columns';

export class IndexPageState {
  readonly searchForm = signal<FormGroup | undefined>(undefined);
  readonly isSearching = signal(true);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly orderBy = signal('Id');
  readonly isAscending = signal(false);
  readonly columns = signal<Column[]>([]);
  readonly options = signal({
    id: Date.now(),
    PageSize: 50,
    PageIndex: 1,
    TotalCount: 0,
    TotalPages: 0,
  });
}
