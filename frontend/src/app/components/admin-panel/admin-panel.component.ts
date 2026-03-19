import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatorService } from '../../services/translator.service';
import { RecipeService } from '../../services/recipe.service';
import { UserService } from '../../services/user.service';
import { Recipe } from '../../models/recipe.model';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {SessionService} from '../../services/session.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  currentModal: string | null = null;
  activeTab: 'recipes' | 'reviews' | 'users' = 'recipes';
  tabAnimation: string = 'slideleft';
  popularRecipes: Recipe[] = [];

  isAdmin: boolean = false;

  users: any[] = [];
  adminUsers: any[] = [];
  suspendedUsers: any[] = [];
  pendingRecipes: any[] = [];
  contentReports: any[] = [];
  categories: any[] = [];

  isTimeRangeDropdownOpen: boolean = false;
  selectedTimeRange: string = 'admin_last_7_days';

  usersPage: number = 0;
  hasMoreUsers: boolean = true;
  isLoadingUsers: boolean = false;

  adminUsersPage: number = 0;
  hasMoreAdminUsers: boolean = true;
  isLoadingAdminUsers: boolean = false;

  suspendedUsersPage: number = 0;
  hasMoreSuspendedUsers: boolean = true;
  isLoadingSuspendedUsers: boolean = false;

  logos: Map<string, string> = new Map();

  constructor(
    private titleService: Title,
    public translatorService: TranslatorService,
    private recipeService: RecipeService,
    private sessionService: SessionService,
    private router: Router,
    private userService: UserService,
    private themeService: ThemeService
  ) {
  }

  updateTitle() {
    this.titleService.setTitle(this.translatorService.translate('title_admin'));
  }

  ngOnInit() {
    this.updateTitle();
    this.logos = this.themeService.getLogos();

    this.translatorService.onChange(() => {
      this.updateTitle();
    });

    this.sessionService.getLoggedUser().subscribe(loggedUser => {
      this.isAdmin = loggedUser?.role.includes("ADMIN");

      if (!this.isAdmin) {
        this.router.navigate(['/error'], {
          state: {
            status: 403,
            reason: "You do not have permission to perform this action."
          }
        });
      }
    });

    this.fetchPopularRecipes();
  }

  fetchPopularRecipes() {
    this.recipeService.getFilteredRecipes({ sortBy: 'rating' }, 0, 4).subscribe({
      next: (data) => {
        this.popularRecipes = data.recipes || [];
      },
      error: (err) => {
        console.error('Error fetching popular recipes:', err);
      }
    });
  }

  t(key: string) {
    return this.translatorService.translate(key);
  }

  openModal(modalId: string) {
    this.currentModal = modalId;
    document.getElementsByTagName("html")[0].style.overflow = 'hidden';

    if (modalId === 'viewAllUsers') {
      this.fetchUsers(true);
    } else if (modalId === 'suspendedUsers') {
      this.fetchSuspendedUsers(true);
    } else if (modalId === 'manageAdmins') {
      this.fetchAdminUsers(true);
    }
  }

  fetchUsers(reset: boolean = false) {
    if (reset) {
      this.usersPage = 0;
      this.users = [];
      this.hasMoreUsers = true;
    }
    if (!this.hasMoreUsers || this.isLoadingUsers) return;

    this.isLoadingUsers = true;
    this.userService.getUsersByStatus(false, this.usersPage, 10).subscribe({
      next: (data) => {
        const fetched = data.users || [];
        if (reset) {
          this.users = fetched;
        } else {
          this.users = [...this.users, ...fetched];
        }
        this.hasMoreUsers = fetched.length === 10;
        this.isLoadingUsers = false;
        this.usersPage++;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.isLoadingUsers = false;
      }
    });
  }

  fetchAdminUsers(reset: boolean = false) {
    if (reset) {
      this.adminUsersPage = 0;
      this.adminUsers = [];
      this.hasMoreAdminUsers = true;
    }
    if (!this.hasMoreAdminUsers || this.isLoadingAdminUsers) return;

    this.isLoadingAdminUsers = true;
    this.userService.getUsersByRole('ADMIN', this.adminUsersPage, 10).subscribe({
      next: (data) => {
        const fetched = data.users || [];
        if (reset) {
          this.adminUsers = fetched;
        } else {
          this.adminUsers = [...this.adminUsers, ...fetched];
        }
        this.hasMoreAdminUsers = fetched.length === 10;
        this.isLoadingAdminUsers = false;
        this.adminUsersPage++;
      },
      error: (err) => {
        console.error('Error fetching admin users:', err);
        this.isLoadingAdminUsers = false;
      }
    });
  }

  fetchSuspendedUsers(reset: boolean = false) {
    if (reset) {
      this.suspendedUsersPage = 0;
      this.suspendedUsers = [];
      this.hasMoreSuspendedUsers = true;
    }
    if (!this.hasMoreSuspendedUsers || this.isLoadingSuspendedUsers) return;

    this.isLoadingSuspendedUsers = true;
    this.userService.getUsersByStatus(true, this.suspendedUsersPage, 10).subscribe({
      next: (data) => {
        const fetched = data.users || [];
        if (reset) {
          this.suspendedUsers = fetched;
        } else {
          this.suspendedUsers = [...this.suspendedUsers, ...fetched];
        }
        this.hasMoreSuspendedUsers = fetched.length === 10;
        this.isLoadingSuspendedUsers = false;
        this.suspendedUsersPage++;
      },
      error: (err) => {
        console.error('Error fetching suspended users:', err);
        this.isLoadingSuspendedUsers = false;
      }
    });
  }

  closeModal(event?: Event) {
    if (event) {
      const target = event.target as HTMLElement;
      const backdrop = target.closest('.visibleBackdrop');
      if (backdrop) {
        backdrop.classList.remove('visibleBackdrop');
        setTimeout(() => {
          this.currentModal = null;
          document.getElementsByTagName("html")[0].style.overflow = 'auto';
        }, 300);
        return;
      }
    }

    const backdrops = document.querySelectorAll('.visibleBackdrop');
    if (backdrops.length > 0) {
      backdrops.forEach(b => b.classList.remove('visibleBackdrop'));
      setTimeout(() => {
        this.currentModal = null;
        document.getElementsByTagName("html")[0].style.overflow = 'auto';
      }, 300);
    } else {
      this.currentModal = null;
      document.getElementsByTagName("html")[0].style.overflow = 'auto';
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal(event);
    }
  }

  switchTab(tab: 'recipes' | 'reviews' | 'users') {
    if (this.activeTab === tab) return;

    const tabsOrder = ['recipes', 'reviews', 'users'];
    const oldIndex = tabsOrder.indexOf(this.activeTab);
    const newIndex = tabsOrder.indexOf(tab);

    this.tabAnimation = newIndex > oldIndex ? 'slideleft' : 'slideright';
    this.activeTab = tab;
  }

  toggleTimeRangeDropdown() {
    this.isTimeRangeDropdownOpen = !this.isTimeRangeDropdownOpen;
  }

  selectTimeRange(range: string) {
    this.selectedTimeRange = range;
    this.isTimeRangeDropdownOpen = false;
  }

  changeUserRole(userId: string, targetRole: string) {
    this.userService.changeUserRole(userId, targetRole).subscribe({
      next: () => {
        if (this.currentModal === 'viewAllUsers') this.fetchUsers(true);
        if (this.currentModal === 'manageAdmins') this.fetchAdminUsers(true);
      },
      error: (err) => {
        console.error('Error changing user role:', err);
      }
    });
  }
  suspendUser(userId: string) {
    this.userService.changeUserStatus(userId, 'suspend').subscribe({
      next: () => {
        if (this.currentModal === 'viewAllUsers') this.fetchUsers(true);
        if (this.currentModal === 'suspendedUsers') this.fetchSuspendedUsers(true);
      },
      error: (err) => {
        console.error('Error suspending user:', err);
      }
    });
  }
  liftSuspension(userId: string) {
    this.userService.changeUserStatus(userId, 'unsuspend').subscribe({
      next: () => {
        if (this.currentModal === 'viewAllUsers') this.fetchUsers(true);
        if (this.currentModal === 'suspendedUsers') this.fetchSuspendedUsers(true);
      },
      error: (err) => {
        console.error('Error lifting suspension:', err);
      }
    });
  }

  approveRecipe(recipeId: string) {
    this.recipeService.changeRecipeStatus(recipeId, 'approve').subscribe({
      next: () => {
      },
      error: (err) => {
      }
    });
  }
  rejectRecipe(recipeId: string) {
    this.recipeService.changeRecipeStatus(recipeId, 'reject').subscribe({
      next: () => {
      },
      error: (err) => {
      }
    });
  }
  dismissReport(reportId: string) {
  }
  deleteReportedContent(reportId: string) {
  }

  addCategory(categoryName: string) {
  }
  editCategory(categoryId: string, newName: string) {
  }
  deleteCategory(categoryId: string) {
  }
}
