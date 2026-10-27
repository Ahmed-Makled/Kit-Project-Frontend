import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { noWhitespaceValidator } from '@app/shared/validators/no-whitespace.validator';
import { InputComponent } from '@app/shared/components/input/input.component';
import { AuthService } from '@app/core/services/auth.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslateModule, InputComponent],
  templateUrl: './login.component.html',

  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly loginService = inject(LoginService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly inputIcons = {
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  };

  readonly loginForm = this.fb.nonNullable.group({
    Username: ['', [Validators.required, noWhitespaceValidator()]],
    Password: ['', [Validators.required, noWhitespaceValidator(), Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loading()) return;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.loginService
      .login(this.loginForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.IsSuccess && response.Data?.AccessToken) {
            this.authService.setAuth(response.Data, response.Data.AccessToken);
            void this.router.navigateByUrl('/');
          } else {
            this.error.set(response.Error?.Description || response.Error?.Message || response.Message || 'SHARED.ERRORS.GENERIC');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.Error?.Description || err.error?.Error?.Message || err.error?.Message || 'SHARED.ERRORS.GENERIC');
        },
      });
  }
}
