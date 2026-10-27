import { FormGroup } from '@angular/forms';
import { signal } from '@angular/core';

export class CreatePageState {
  form: FormGroup = new FormGroup({});
  readonly isPageLoaded = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isEdit = signal<boolean>(false);
}
