import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatorService } from '../../services/translator.service';
import { RecipeService } from '../../services/recipe.service';
import { UserService } from '../../services/user.service';
import { Recipe } from '../../models/recipe.model';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { ThemeService } from '../../services/theme.service';
import { ReviewService } from '../../services/review.service';
import { EnumService, RecipeAttribute } from '../../services/enum.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
  reportedRecipes: any[] = [];
  reportedUsers: any[] = [];
  reportedReviews: any[] = [];
  attributes: RecipeAttribute[] = [];
  filteredAttributes: RecipeAttribute[] = [];
  selectedAttributeType: string = 'caution';

  newAttributeName: string = '';
  editingAttribute: RecipeAttribute | null = null;

  attributeTypes = [
    { value: 'caution', label: 'allergens' },
    { value: 'cuisineType', label: 'cuisine_type' },
    { value: 'dietLabel', label: 'diet_labels' },
    { value: 'dishType', label: 'dish_type' },
    { value: 'healthLabel', label: 'health_labels' },
    { value: 'mealType', label: 'meal_type' }
  ];

  isTimeRangeDropdownOpen: boolean = false;
  selectedTimeRange: string = 'admin_last_7_days';

  showAttributeTypeDropdown: boolean = false;
  deletingAttributeId: number | null = null;

  usersPage: number = 0;
  hasMoreUsers: boolean = true;
  isLoadingUsers: boolean = false;

  adminUsersPage: number = 0;
  hasMoreAdminUsers: boolean = true;
  isLoadingAdminUsers: boolean = false;

  suspendedUsersPage: number = 0;
  hasMoreSuspendedUsers: boolean = true;
  isLoadingSuspendedUsers: boolean = false;

  pendingRecipesPage: number = 0;
  hasMorePendingRecipes: boolean = true;
  isLoadingPendingRecipes: boolean = false;

  reportedRecipesPage: number = 0;
  hasMoreReportedRecipes: boolean = true;
  isLoadingReportedRecipes: boolean = false;

  reportedUsersPage: number = 0;
  hasMoreReportedUsers: boolean = true;
  isLoadingReportedUsers: boolean = false;

  reportedReviewsPage: number = 0;
  hasMoreReportedReviews: boolean = true;
  isLoadingReportedReviews: boolean = false;

  logos: Map<string, string> = new Map();

  constructor(
    private titleService: Title,
    public translatorService: TranslatorService,
    private recipeService: RecipeService,
    private sessionService: SessionService,
    private router: Router,
    private userService: UserService,
    private themeService: ThemeService,
    private reviewService: ReviewService,
    private enumService: EnumService
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
    } else if (modalId === 'pendingRecipes') {
      this.fetchPendingRecipes(true);
    } else if (modalId === 'contentReports') {
      this.fetchReports(true);
    } else if (modalId === 'manageCategories') {
      this.fetchAttributes();
    }
  }

  fetchAttributes() {
    this.enumService.getAllAttributes().subscribe({
      next: (data) => {
        this.attributes = data;
        this.filterAttributes();
      },
      error: (err) => console.error('Error fetching attributes:', err)
    });
  }

  filterAttributes() {
    this.filteredAttributes = this.attributes.filter(a => a.type === this.selectedAttributeType);
    console.log(`AdminPanel: Filtered ${this.filteredAttributes.length} attributes for type: ${this.selectedAttributeType}`);
  }

  onAttributeTypeChange() {
    this.filterAttributes();
    this.editingAttribute = null;
    this.newAttributeName = '';
  }

  toggleAttributeTypeDropdown() {
    this.showAttributeTypeDropdown = !this.showAttributeTypeDropdown;
  }

  selectAttributeType(type: any) {
    this.selectedAttributeType = type.value;
    this.onAttributeTypeChange();
    this.showAttributeTypeDropdown = false;
  }

  getSelectedAttributeLabel(): string {
    const found = this.attributeTypes.find(t => t.value === this.selectedAttributeType);
    return found ? found.label : '';
  }

  addAttribute() {
    if (!this.newAttributeName.trim()) return;
    const attr: RecipeAttribute = {
      name: this.newAttributeName,
      type: this.selectedAttributeType
    };
    this.enumService.addAttribute(attr).subscribe({
      next: () => {
        this.newAttributeName = '';
        this.fetchAttributes();
      },
      error: (err) => console.error('Error adding attribute:', err)
    });
  }

  startEditAttribute(attr: RecipeAttribute) {
    console.log('AdminPanel: Start editing attribute', attr);
    this.editingAttribute = { ...attr };
  }

  cancelEditAttribute() {
    this.editingAttribute = null;
  }

  saveAttribute() {
    if (!this.editingAttribute || !this.editingAttribute.name.trim()) return;
    console.log('AdminPanel: Saving attribute', this.editingAttribute);
    this.enumService.updateAttribute(this.editingAttribute.id!, this.editingAttribute).subscribe({
      next: () => {
        this.editingAttribute = null;
        this.fetchAttributes();
      },
      error: (err) => console.error('Error updating attribute:', err)
    });
  }

  deleteAttribute(id: number, event?: Event) {
    if (event) event.stopPropagation();
    if (this.deletingAttributeId !== id) {
      this.deletingAttributeId = id;
      return;
    }

    console.log('AdminPanel: Confirmed deletion of attribute with id', id);
    this.enumService.deleteAttribute(id).subscribe({
      next: () => {
        this.fetchAttributes();
        this.deletingAttributeId = null;
      },
      error: (err) => {
        console.error('Error deleting attribute:', err);
        this.deletingAttributeId = null;
      }
    });
  }

  cancelDeleteAttribute() {
    this.deletingAttributeId = null;
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

  fetchPendingRecipes(reset: boolean = false) {
    if (reset) {
      this.pendingRecipesPage = 0;
      this.pendingRecipes = [];
      this.hasMorePendingRecipes = true;
    }
    if (!this.hasMorePendingRecipes || this.isLoadingPendingRecipes) return;

    this.isLoadingPendingRecipes = true;
    this.recipeService.getPendingRecipes(this.pendingRecipesPage, 10).subscribe({
      next: (data: any) => {
        const fetched = data.recipes || [];
        if (reset) {
          this.pendingRecipes = fetched;
        } else {
          this.pendingRecipes = [...this.pendingRecipes, ...fetched];
        }
        this.hasMorePendingRecipes = fetched.length === 10;
        this.isLoadingPendingRecipes = false;
        this.pendingRecipesPage++;
      },
      error: (err: any) => {
        console.error('Error fetching pending recipes:', err);
        this.isLoadingPendingRecipes = false;
      }
    });
  }

  fetchReports(reset: boolean = false) {
    this.fetchReportedRecipes(reset);
    this.fetchReportedUsers(reset);
    this.fetchReportedReviews(reset);
  }

  fetchReportedRecipes(reset: boolean = false) {
    if (reset) {
      this.reportedRecipesPage = 0;
      this.reportedRecipes = [];
      this.hasMoreReportedRecipes = true;
    }
    if (!this.hasMoreReportedRecipes || this.isLoadingReportedRecipes) return;
    this.isLoadingReportedRecipes = true;
    this.recipeService.getReportedRecipes(this.reportedRecipesPage, 3).subscribe({
      next: (data) => {
        const fetched = data.recipes || [];
        if (reset) {
          this.reportedRecipes = fetched;
        } else {
          this.reportedRecipes = [...this.reportedRecipes, ...fetched];
        }
        this.hasMoreReportedRecipes = this.reportedRecipes.length < (data.total || 0);
        this.isLoadingReportedRecipes = false;
        this.reportedRecipesPage++;
      },
      error: (err) => {
        console.error('Error fetching reported recipes:', err);
        this.isLoadingReportedRecipes = false;
      }
    });
  }

  fetchReportedUsers(reset: boolean = false) {
    if (reset) {
      this.reportedUsersPage = 0;
      this.reportedUsers = [];
      this.hasMoreReportedUsers = true;
    }
    if (!this.hasMoreReportedUsers || this.isLoadingReportedUsers) return;
    this.isLoadingReportedUsers = true;
    this.userService.getReportedUsers(this.reportedUsersPage, 3).subscribe({
      next: (data) => {
        const fetched = data.users || [];
        if (reset) {
          this.reportedUsers = fetched;
        } else {
          this.reportedUsers = [...this.reportedUsers, ...fetched];
        }
        this.hasMoreReportedUsers = this.reportedUsers.length < (data.total || 0);
        this.isLoadingReportedUsers = false;
        this.reportedUsersPage++;
      },
      error: (err) => {
        console.error('Error fetching reported users:', err);
        this.isLoadingReportedUsers = false;
      }
    });
  }

  fetchReportedReviews(reset: boolean = false) {
    if (reset) {
      this.reportedReviewsPage = 0;
      this.reportedReviews = [];
      this.hasMoreReportedReviews = true;
    }
    if (!this.hasMoreReportedReviews || this.isLoadingReportedReviews) return;
    this.isLoadingReportedReviews = true;
    this.reviewService.getReportedReviews(this.reportedReviewsPage, 3).subscribe({
      next: (data) => {
        const fetched = data.reviews || [];
        if (reset) {
          this.reportedReviews = fetched;
        } else {
          this.reportedReviews = [...this.reportedReviews, ...fetched];
        }
        this.hasMoreReportedReviews = this.reportedReviews.length < (data.total || 0);
        this.isLoadingReportedReviews = false;
        this.reportedReviewsPage++;
      },
      error: (err) => {
        console.error('Error fetching reported reviews:', err);
        this.isLoadingReportedReviews = false;
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
          this.resetAttributeManagementState();
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
        this.resetAttributeManagementState();
        this.currentModal = null;
        document.getElementsByTagName("html")[0].style.overflow = 'auto';
      }, 300);
    } else {
      this.resetAttributeManagementState();
      this.currentModal = null;
      document.getElementsByTagName("html")[0].style.overflow = 'auto';
    }
  }

  resetAttributeManagementState() {
    this.editingAttribute = null;
    this.newAttributeName = '';
    this.showAttributeTypeDropdown = false;
    this.selectedAttributeType = 'caution';
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
        if (this.currentModal === 'pendingRecipes') this.fetchPendingRecipes(true);
      },
      error: (err) => {
        console.error('Error approving recipe:', err);
      }
    });
  }
  rejectRecipe(recipeId: string) {
    this.recipeService.changeRecipeStatus(recipeId, 'reject').subscribe({
      next: () => {
        if (this.currentModal === 'pendingRecipes') this.fetchPendingRecipes(true);
      },
      error: (err) => {
        console.error('Error rejecting recipe:', err);
      }
    });
  }

  dismissRecipeReport(recipeId: string | number) {
    this.recipeService.dismissReport(recipeId).subscribe({
      next: () => this.fetchReportedRecipes(true),
      error: (err) => console.error('Error dismissing recipe report:', err)
    });
  }

  dismissUserReport(username: string) {
    this.userService.dismissReport(username).subscribe({
      next: () => this.fetchReportedUsers(true),
      error: (err) => console.error('Error dismissing user report:', err)
    });
  }

  dismissReviewReport(reviewId: string | number) {
    this.reviewService.dismissReport(reviewId).subscribe({
      next: () => this.fetchReportedReviews(true),
      error: (err) => console.error('Error dismissing review report:', err)
    });
  }

  deleteReview(reviewId: string) {
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => this.fetchReportedReviews(true),
      error: (err) => console.error('Error deleting review:', err)
    });
  }
}

