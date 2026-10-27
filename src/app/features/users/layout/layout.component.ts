import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-users-layout',
  imports: [RouterOutlet, TranslateModule],

  templateUrl: './layout.component.html',
})
export class UsersLayoutComponent {
  private readonly router = inject(Router);

  showCreateForm(): void {
    this.router.navigate(['/users/create']);
  }
}
