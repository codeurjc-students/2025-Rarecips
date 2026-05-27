import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { AdminService, SystemStatus } from '../../services/admin.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit, OnDestroy {
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

  systemStatus: SystemStatus = {
    server: 'admin_loading',
    database: 'admin_loading',
    mail: 'admin_loading',
    websockets: 'admin_down'
  };

  stats: any = {
    totalUsers: 0,
    totalRecipes: 0,
    totalReviews: 0,
    totalIngredients: 0,
    usersGrowth: 0,
    recipesGrowth: 0,
    reviewsGrowth: 0,
    ingredientsGrowth: 0,
    userGrowthChart: [],
    recipeGrowthChart: [],
    reviewGrowthChart: []
  };

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

  private statusInterval: any;

  constructor(
    private titleService: Title,
    public translatorService: TranslatorService,
    private recipeService: RecipeService,
    private sessionService: SessionService,
    private router: Router,
    private userService: UserService,
    private themeService: ThemeService,
    private reviewService: ReviewService,
    private enumService: EnumService,
    private adminService: AdminService,
    private http: HttpClient
  ) {
  }

  updateTitle() {
    this.titleService.setTitle(this.translatorService.translate('title_admin'));
  }

  ngOnInit() {
    this.updateTitle();
    this.logos = this.themeService.getLogos();

    this.fetchSystemStatus();
    this.fetchPopularRecipes();
    this.updateCharts();

    this.statusInterval = setInterval(() => {
      this.fetchSystemStatus();
    }, 15000);

    this.translatorService.onChange(() => {
      this.updateTitle();
    });

    this.sessionService.getLoggedUser().subscribe({
      next: (loggedUser: any) => {
        this.isAdmin = loggedUser && loggedUser.role === 'ADMIN';
        if (!this.isAdmin) {
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.isAdmin = false;
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  fetchStats() {
    console.log('DEBUG: Fetching admin stats with range:', this.selectedTimeRange);
    this.adminService.getStats(this.selectedTimeRange).subscribe({
      next: (data) => {
        console.log('Admin Stats received:', data);
        this.stats = data;
      },
      error: (err) => console.error('Error fetching admin stats:', err)
    });
  }

  updateCharts() {
    this.fetchStats();
  }

  getMax(data: any[]): number {
    if (!data || data.length === 0) return 1;
    const max = Math.max(...data.map(d => d.count));
    return max === 0 ? 1 : max;
  }

  getBarHeight(count: number, data: any[]): string {
    const max = this.getMax(data);
    return Math.max(5, (count / max * 85)) + '%';
  }

  getBarColor(count: number, data: any[]): string {
    if (count === 0) return 'var(--primary-100)';
    const max = this.getMax(data);
    const ratio = count / max;
    
    if (ratio > 0.8) return 'var(--primary-700)';
    if (ratio > 0.65) return 'var(--primary-600)';
    if (ratio > 0.5) return 'var(--primary-500)';
    if (ratio > 0.35) return 'var(--primary-400)';
    if (ratio > 0.2) return 'var(--primary-300)';
    return 'var(--primary-200)';
  }

  fetchPopularRecipes() {
    this.recipeService.getFilteredRecipes({ sortBy: 'mostPopular' }, 0, 9).subscribe({
      next: (data: any) => this.popularRecipes = data.recipes,
      error: (err: any) => console.error('Error fetching popular recipes:', err)
    });
  }

  fetchSystemStatus() {
    this.adminService.getSystemStatus().subscribe({
      next: (status) => {
        this.systemStatus = status;
        this.checkWebSockets();
      },
      error: (err: any) => {
        console.error('Error fetching system status:', err);
        this.systemStatus = {
          ...this.systemStatus,
          server: 'admin_down',
          database: 'admin_down',
          mail: 'admin_down',
          websockets: 'admin_down'
        };
      }
    });
  }

  private checkWebSockets() {
    this.http.get('/notify/info').subscribe({
      next: () => {
        this.systemStatus.websockets = 'admin_operational';
      },
      error: () => {
        this.systemStatus.websockets = 'admin_down';
      }
    });
  }

  t(key: string): string {
    return this.translatorService.translate(key);
  }

  switchTab(tab: 'recipes' | 'reviews' | 'users') {
    if (this.activeTab === tab) return;

    this.tabAnimation = tab === 'users' ? 'slideleft' : (tab === 'recipes' ? 'slideright' : (this.activeTab === 'recipes' ? 'slideleft' : 'slideright'));
    this.activeTab = tab;
  }

  toggleTimeRangeDropdown() {
    this.isTimeRangeDropdownOpen = !this.isTimeRangeDropdownOpen;
  }

  selectTimeRange(range: string) {
    this.selectedTimeRange = range;
    this.isTimeRangeDropdownOpen = false;
    this.updateCharts();
  }

  openModal(modal: string) {
    this.currentModal = modal;
    if (modal === 'viewAllUsers') this.fetchUsers(true);
    if (modal === 'manageAdmins') this.fetchAdminUsers(true);
    if (modal === 'suspendedUsers') this.fetchSuspendedUsers(true);
    if (modal === 'pendingRecipes') this.fetchPendingRecipes(true);
    if (modal === 'contentReports') {
      this.fetchReportedRecipes(true);
      this.fetchReportedUsers(true);
      this.fetchReportedReviews(true);
    }
    if (modal === 'manageCategories') this.loadAttributes();
  }

  closeModal(event?: Event) {
    if (event) event.stopPropagation();
    this.currentModal = null;
    this.resetAttributeManagementState();
  }

  onBackdropClick(event: Event) {
    this.closeModal(event);
  }

  fetchUsers(reset: boolean = false) {
    if (reset) {
      this.users = [];
      this.usersPage = 0;
      this.hasMoreUsers = true;
    }
    if (!this.hasMoreUsers || this.isLoadingUsers) return;

    this.isLoadingUsers = true;
    this.userService.searchUsers('', this.usersPage, 10).subscribe({
      next: (data: any) => {
        this.users = [...this.users, ...data.users];
        this.hasMoreUsers = (this.usersPage + 1) * 10 < data.total;
        this.usersPage++;
        this.isLoadingUsers = false;
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
        this.isLoadingUsers = false;
      }
    });
  }

  fetchAdminUsers(reset: boolean = false) {
    if (reset) {
      this.adminUsers = [];
      this.adminUsersPage = 0;
      this.hasMoreAdminUsers = true;
    }
    if (!this.hasMoreAdminUsers || this.isLoadingAdminUsers) return;

    this.isLoadingAdminUsers = true;
    this.userService.getUsersByRole('ADMIN', this.adminUsersPage, 10).subscribe({
      next: (data: any) => {
        this.adminUsers = [...this.adminUsers, ...data.users];
        this.hasMoreAdminUsers = (this.adminUsersPage + 1) * 10 < data.total;
        this.adminUsersPage++;
        this.isLoadingAdminUsers = false;
      },
      error: (err: any) => {
        console.error('Error loading admins:', err);
        this.isLoadingAdminUsers = false;
      }
    });
  }

  fetchSuspendedUsers(reset: boolean = false) {
    if (reset) {
      this.suspendedUsers = [];
      this.suspendedUsersPage = 0;
      this.hasMoreSuspendedUsers = true;
    }
    if (!this.hasMoreSuspendedUsers || this.isLoadingSuspendedUsers) return;

    this.isLoadingSuspendedUsers = true;
    this.userService.getUsersByStatus(true, this.suspendedUsersPage, 10).subscribe({
      next: (data: any) => {
        this.suspendedUsers = [...this.suspendedUsers, ...data.users];
        this.hasMoreSuspendedUsers = (this.suspendedUsersPage + 1) * 10 < data.total;
        this.suspendedUsersPage++;
        this.isLoadingSuspendedUsers = false;
      },
      error: (err: any) => {
        console.error('Error loading suspended users:', err);
        this.isLoadingSuspendedUsers = false;
      }
    });
  }

  fetchPendingRecipes(reset: boolean = false) {
    if (reset) {
      this.pendingRecipes = [];
      this.pendingRecipesPage = 0;
      this.hasMorePendingRecipes = true;
    }
    if (!this.hasMorePendingRecipes || this.isLoadingPendingRecipes) return;

    this.isLoadingPendingRecipes = true;
    this.recipeService.getPendingRecipes(this.pendingRecipesPage, 10).subscribe({
      next: (data: any) => {
        this.pendingRecipes = [...this.pendingRecipes, ...data.recipes];
        this.hasMorePendingRecipes = (this.pendingRecipesPage + 1) * 10 < data.total;
        this.pendingRecipesPage++;
        this.isLoadingPendingRecipes = false;
      },
      error: (err: any) => {
        console.error('Error loading pending recipes:', err);
        this.isLoadingPendingRecipes = false;
      }
    });
  }

  fetchReportedRecipes(reset: boolean = false) {
    if (reset) {
      this.reportedRecipes = [];
      this.reportedRecipesPage = 0;
      this.hasMoreReportedRecipes = true;
    }
    if (!this.hasMoreReportedRecipes || this.isLoadingReportedRecipes) return;

    this.isLoadingReportedRecipes = true;
    this.recipeService.getReportedRecipes(this.reportedRecipesPage, 10).subscribe({
      next: (data: any) => {
        this.reportedRecipes = [...this.reportedRecipes, ...data.recipes];
        this.hasMoreReportedRecipes = (this.reportedRecipesPage + 1) * 10 < data.total;
        this.reportedRecipesPage++;
        this.isLoadingReportedRecipes = false;
      },
      error: (err: any) => {
        console.error('Error loading reported recipes:', err);
        this.isLoadingReportedRecipes = false;
      }
    });
  }

  fetchReportedUsers(reset: boolean = false) {
    if (reset) {
      this.reportedUsers = [];
      this.reportedUsersPage = 0;
      this.hasMoreReportedUsers = true;
    }
    if (!this.hasMoreReportedUsers || this.isLoadingReportedUsers) return;

    this.isLoadingReportedUsers = true;
    this.userService.getReportedUsers(this.reportedUsersPage, 10).subscribe({
      next: (data: any) => {
        this.reportedUsers = [...this.reportedUsers, ...data.users];
        this.hasMoreReportedUsers = (this.reportedUsersPage + 1) * 10 < data.total;
        this.reportedUsersPage++;
        this.isLoadingReportedUsers = false;
      },
      error: (err: any) => {
        console.error('Error loading reported users:', err);
        this.isLoadingReportedUsers = false;
      }
    });
  }

  fetchReportedReviews(reset: boolean = false) {
    if (reset) {
      this.reportedReviews = [];
      this.reportedReviewsPage = 0;
      this.hasMoreReportedReviews = true;
    }
    if (!this.hasMoreReportedReviews || this.isLoadingReportedReviews) return;

    this.isLoadingReportedReviews = true;
    this.reviewService.getReportedReviews(this.reportedReviewsPage, 10).subscribe({
      next: (data: any) => {
        this.reportedReviews = [...this.reportedReviews, ...data.reviews];
        this.hasMoreReportedReviews = (this.reportedReviewsPage + 1) * 10 < data.total;
        this.reportedReviewsPage++;
        this.isLoadingReportedReviews = false;
      },
      error: (err: any) => {
        console.error('Error loading reported reviews:', err);
        this.isLoadingReportedReviews = false;
      }
    });
  }

  toggleAttributeTypeDropdown() {
    this.showAttributeTypeDropdown = !this.showAttributeTypeDropdown;
  }

  selectAttributeType(type: any) {
    this.selectedAttributeType = typeof type === 'string' ? type : type.value;
    this.showAttributeTypeDropdown = false;
    this.filterAttributes();
  }

  getSelectedAttributeLabel(): string {
    const type = this.attributeTypes.find(t => t.value === this.selectedAttributeType);
    return type ? type.label : '';
  }

  loadAttributes() {
    this.enumService.getAllAttributes().subscribe({
      next: (attrs) => {
        this.attributes = attrs;
        this.filterAttributes();
      },
      error: (err: any) => console.error('Error loading attributes:', err)
    });
  }

  filterAttributes() {
    this.filteredAttributes = this.attributes.filter(a => a.type === this.selectedAttributeType);
  }

  addAttribute() {
    if (!this.newAttributeName.trim()) return;

    const newAttr: RecipeAttribute = {
      name: this.newAttributeName,
      type: this.selectedAttributeType
    };

    this.enumService.addAttribute(newAttr).subscribe({
      next: (attr: RecipeAttribute) => {
        this.attributes.push(attr);
        this.newAttributeName = '';
        this.filterAttributes();
      },
      error: (err: any) => console.error('Error adding attribute:', err)
    });
  }

  startEditAttribute(attr: RecipeAttribute) {
    this.editingAttribute = { ...attr };
  }

  cancelEditAttribute() {
    this.editingAttribute = null;
  }

  saveAttribute() {
    if (!this.editingAttribute || !this.editingAttribute.name.trim()) return;

    this.enumService.updateAttribute(this.editingAttribute.id!, this.editingAttribute).subscribe({
      next: (updated) => {
        const index = this.attributes.findIndex(a => a.id === updated.id);
        if (index !== -1) {
          this.attributes[index] = updated;
        }
        this.editingAttribute = null;
        this.filterAttributes();
      },
      error: (err: any) => console.error('Error updating attribute:', err)
    });
  }

  deleteAttribute(id: number, event: Event) {
    event.stopPropagation();
    this.enumService.deleteAttribute(id).subscribe({
      next: () => {
        this.attributes = this.attributes.filter(a => a.id !== id);
        this.deletingAttributeId = null;
        this.filterAttributes();
      },
      error: (err: any) => {
        console.error('Error deleting attribute:', err);
        this.deletingAttributeId = null;
      }
    });
  }

  confirmDeleteAttribute(id: number, event: Event) {
    event.stopPropagation();
    this.deletingAttributeId = id;
  }

  cancelDeleteAttribute() {
    this.deletingAttributeId = null;
  }

  resetAttributeManagementState() {
    this.newAttributeName = '';
    this.editingAttribute = null;
    this.deletingAttributeId = null;
    this.showAttributeTypeDropdown = false;
    this.selectedAttributeType = 'caution';
  }

  suspendUser(username: string) {
    this.userService.changeUserStatus(username, 'suspend').subscribe({
      next: () => {
        if (this.currentModal === 'viewAllUsers') this.fetchUsers(true);
        if (this.currentModal === 'suspendedUsers') this.fetchSuspendedUsers(true);
      },
      error: (err: any) => console.error('Error suspending user:', err)
    });
  }

  unsuspendUser(username: string) {
    this.userService.changeUserStatus(username, 'unsuspend').subscribe({
      next: () => {
        if (this.currentModal === 'viewAllUsers') this.fetchUsers(true);
        if (this.currentModal === 'suspendedUsers') this.fetchSuspendedUsers(true);
      },
      error: (err: any) => console.error('Error unsuspending user:', err)
    });
  }

  liftSuspension(username: string) {
    this.unsuspendUser(username);
  }

  promoteToAdmin(username: string) {
    this.userService.changeUserRole(username, 'ADMIN').subscribe({
      next: () => {
        if (this.currentModal === 'viewAllUsers') this.fetchUsers(true);
        if (this.currentModal === 'manageAdmins') this.fetchAdminUsers(true);
      },
      error: (err: any) => console.error('Error promoting user:', err)
    });
  }

  demoteToUser(username: string) {
    this.userService.changeUserRole(username, 'USER').subscribe({
      next: () => {
        if (this.currentModal === 'viewAllUsers') this.fetchUsers(true);
        if (this.currentModal === 'manageAdmins') this.fetchAdminUsers(true);
      },
      error: (err: any) => console.error('Error demoting user:', err)
    });
  }

  changeUserRole(username: string, role: string) {
    if (role === 'ADMIN') {
      this.promoteToAdmin(username);
    } else {
      this.demoteToUser(username);
    }
  }

  approveRecipe(id: number) {
    this.recipeService.changeRecipeStatus(id, 'approve').subscribe({
      next: () => this.fetchPendingRecipes(true),
      error: (err: any) => console.error('Error approving recipe:', err)
    });
  }

  rejectRecipe(id: number) {
    this.recipeService.changeRecipeStatus(id, 'reject').subscribe({
      next: () => this.fetchPendingRecipes(true),
      error: (err: any) => console.error('Error rejecting recipe:', err)
    });
  }

  dismissRecipeReport(id: number) {
    this.recipeService.dismissReport(id).subscribe({
      next: () => this.fetchReportedRecipes(true),
      error: (err: any) => console.error('Error resolving recipe report:', err)
    });
  }

  dismissUserReport(username: string) {
    this.userService.dismissReport(username).subscribe({
      next: () => this.fetchReportedUsers(true),
      error: (err: any) => console.error('Error resolving user report:', err)
    });
  }

  dismissReviewReport(id: number) {
    this.reviewService.dismissReport(id).subscribe({
      next: () => this.fetchReportedReviews(true),
      error: (err: any) => console.error('Error resolving review report:', err)
    });
  }
}
