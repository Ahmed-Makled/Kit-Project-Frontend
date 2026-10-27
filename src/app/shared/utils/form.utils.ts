import { UntypedFormGroup } from '@angular/forms';

export class FormUtils {
  static getInvalidControls(searchForm: UntypedFormGroup): string[] {
    const invalidControls: string[] = [];
    for (const key in searchForm.controls) {
      const control = searchForm.get(key);
      if (control && control.invalid) {
        invalidControls.push(key);
      }
    }
    return invalidControls;
  }
}
