import { Component, DestroyRef, inject, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@app/core/services/auth.service';
import { LanguageService } from '@app/core/services/language.service';
import { ToastComponent } from '@app/shared/components/toast/toast.component';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';
import { LanguageSwitcherComponent } from '@app/shared/components/language-switcher/language-switcher.component';
import { UserService } from '@app/features/users/services/user.service';
import { Roles } from '@app/shared/enums/roles';

interface SidebarMenuItem {
  label: string;
  icon: string;
  activeIcon: string;
  route: string;
  roles: string[];
}

interface SidebarMenuSection {
  label: string;
  itemIds: string[];
}

const SIDEBAR_OPEN_STORAGE_KEY = 'kit-project-sidebar-open';
const SIDEBAR_DESKTOP_MIN_WIDTH = 1024;

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, ToastComponent, SpinnerComponent, LanguageSwitcherComponent],

  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);
  private resizeListener?: () => void;

  readonly loading = signal(true);
  readonly sidebarOpen = signal(this.initialSidebarOpen());

  private readonly _sidebarScrollLock = effect(() => {
    const open = this.sidebarOpen();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < SIDEBAR_DESKTOP_MIN_WIDTH;
    if (isMobile && open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else if (isMobile) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  });
  readonly currentUser = computed(() => this.authService.currentUser());
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return 'Name' in user ? user.Name : `${user.FirstName ?? ''} ${user.LastName ?? ''}`.trim() || user.Username;
  });
  readonly currentDepartmentName = computed(() => {
    const user = this.currentUser();
    return user && 'DepartmentName' in user ? user.DepartmentName : null;
  });
  readonly userInitials = computed(() => {
    const raw = this.currentUserName().trim();
    if (!raw) return 'U';
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return raw.length >= 2 ? raw.slice(0, 2).toUpperCase() : raw.charAt(0).toUpperCase();
  });

  readonly userRoleLabel = computed(() => {
    return this.currentUser()?.Role === Roles.Admin ? 'USERS.ROLES.ADMIN' : 'USERS.ROLES.USER';
  });

  readonly isRtl = this.languageService.isRtl;
  readonly dirAttr = this.languageService.dirAttr;

  /**
   * The canonical item registry: each route is defined once.
   * Sections below only reference these IDs to control grouping and order.
   */
  readonly menuItems: Record<string, SidebarMenuItem> = {
    users: {
      label: 'NAVIGATION.USERS',
      icon: 'sidebar-users',
      activeIcon: 'sidebar-users-active',
      route: '/users',
      roles: [Roles.Admin.toString()],
    },
  };

  readonly menuSections: SidebarMenuSection[] = [
    {
      label: 'NAVIGATION.SECTION_SETTINGS',
      itemIds: ['users'],
    },
  ];

  readonly visibleMenuSections = computed(() => {
    const role = String(this.currentUser()?.Role ?? '');
    return this.menuSections
      .map((section) => ({
        label: section.label,
        items: section.itemIds.map((itemId) => this.menuItems[itemId]).filter((item) => item.roles.length === 0 || item.roles.includes(role)),
      }))
      .filter((section) => section.items.length > 0);
  });

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.resizeListener = () => {
        const isMobileNow = window.innerWidth < SIDEBAR_DESKTOP_MIN_WIDTH;
        if (isMobileNow) {
          if (this.sidebarOpen()) this.sidebarOpen.set(false);
          return;
        }
        this.sidebarOpen.set(this.readSidebarPreference());
      };
      window.addEventListener('resize', this.resizeListener);
    }

    this.loadMainInfo();
  }

  private loadMainInfo(): void {
    this.loading.set(true);
    this.userService
      .getMainInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          const data = response.Data;
          if (response.IsSuccess && data) this.authService.updateUser(data);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  toggleSidebar(): void {
    const next = !this.sidebarOpen();
    const persist = typeof window === 'undefined' || window.innerWidth >= SIDEBAR_DESKTOP_MIN_WIDTH;
    this.setSidebarOpen(next, persist);
  }

  onMenuItemClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth < SIDEBAR_DESKTOP_MIN_WIDTH) {
      this.sidebarOpen.set(false);
    }
  }

  private initialSidebarOpen(): boolean {
    if (typeof window === 'undefined') return true;
    if (window.innerWidth < SIDEBAR_DESKTOP_MIN_WIDTH) return false;
    return this.readSidebarPreference();
  }

  private readSidebarPreference(): boolean {
    try {
      window.localStorage.removeItem('kit-project-sidebar-expanded-default');
      return window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  private setSidebarOpen(open: boolean, persist = true): void {
    this.sidebarOpen.set(open);
    if (!persist || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(open));
    } catch {
      // Keep sidebar interaction available when browser storage is disabled.
    }
  }

  logout(): void {
    this.authService.clearAuth();
    this.router.navigate(['/login']);
  }
}
