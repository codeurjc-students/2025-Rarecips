import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router, ActivatedRoute, NavigationEnd, RoutesRecognized} from '@angular/router';
import {UserService} from '../../services/user.service';
import {SessionService} from '../../services/session.service';
import {CollectionCardComponent} from '../shared/collection-card/collection-card.component';
import {CommonModule} from '@angular/common';
import {RecipeCollectionService} from '../../services/recipe-collection.service';
import {TranslatorService} from '../../services/translator.service';
import {filter, firstValueFrom} from 'rxjs';
import {ActivityService} from '../../services/activity.service';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
  standalone: true,
  imports: [FormsModule, CollectionCardComponent, CommonModule],
})
export class ProfileViewComponent implements OnInit {
  isOwnProfile: boolean = false;

  editing: boolean = false;
  username: string = '';
  user: any = null;
  isAdminProfile: boolean = false;
  isAdmin: boolean = false;
  creationDate: string | undefined = undefined;
  dateString: string | undefined = '';
  lastOnlineDate: string | undefined = '';
  relativeDate: Intl.RelativeTimeFormat | null = null;
  activeTab: 'recipes' | 'reviews' | 'collections' | 'ingredients' = 'recipes';

  recipes: any[] = [];
  totalRecipes: number = 0;
  reviews: any[] = [];
  ingredients: any[] = [];
  collections: any[] = [];

  recipesLoading: boolean = false;
  reviewsLoading: boolean = false;
  ingredientsLoading: boolean = false;
  collectionsLoading: boolean = false;

  recipesPage: number = 0;
  reviewsPage: number = 0;
  ingredientsPage: number = 0;
  collectionsPage: number = 0;

  hasMoreRecipes: boolean = true;
  hasMoreReviews: boolean = true;
  hasMoreIngredients: boolean = true;
  hasMoreCollections: boolean = true;

  loadingMoreRecipes: boolean = false;
  loadingMoreReviews: boolean = false;
  loadingMoreIngredients: boolean = false;
  loadingMoreCollections: boolean = false;

  showViewCollectionModal: boolean = false;
  viewingCollection: any = null;
  viewModalClosing: boolean = false;

  collectionsCount: number = 0;
  isPrivate:  boolean = false;
  mode: string = '';
  count: number = -1;
  animationClass = '';

  responsive: boolean = window.innerWidth < 1024;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private sessionService: SessionService,
    private collectionService: RecipeCollectionService,
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef,
    private translatorService: TranslatorService,
    private titleService: Title
  ) {}

  t(key: string) {
    return this.translatorService.translate(key);
  }

  updateTitle() {
    if (this.user?.username) {
      this.titleService.setTitle(this.t('title_user') + this.user.username);
    }
  }

  ngOnInit(): void {
    this.username = this.activatedRoute.snapshot.paramMap.get('id') || '';

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      // refresh component on same route navigation
      const currentUsername = this.activatedRoute.snapshot.paramMap.get('id') || '';
      if (this.username !== currentUsername) {
        this.username = currentUsername;
        this.ngOnInit();
      }
    });

    this.translatorService.onChange(() => {
      this.updateTitle();
      if (this.router.url.includes('/users/') && this.creationDate) {
        this.dateString = new Intl.DateTimeFormat(this.translatorService.getLang(), {
          dateStyle: 'long'
        }).format(new Date(this.creationDate as string));

        const diffMs = Date.now() - new Date(this.user.lastOnline as string).getTime();

        this.relativeDate = new Intl.RelativeTimeFormat(this.translatorService.getLang(), {numeric: "auto"});
        this.lastOnlineDate = this.activityService.getRelativeTime(this.relativeDate, diffMs);
        this.lastOnlineDate = this.lastOnlineDate?.charAt(0).toUpperCase() + this.lastOnlineDate?.slice(1);
      }
    });


    this.userService.getUserByUsername(this.username).subscribe({
      next: (userData) => {
        this.user = userData;
        this.updateTitle();

        this.isAdminProfile = this.user?.role?.includes('ADMIN');

        this.creationDate = this.user.createdAt;
        //local date for createdAt
        this.dateString = new Intl.DateTimeFormat(this.translatorService.getLang(), {
          dateStyle: 'long'
        }).format(new Date(this.creationDate as string));

        this.lastOnlineDate = this.user.lastOnline;

        // Format last online date to relative strings (like yesterday, 2 days ago, etc.) and capitalize first letter
        const diffMs = Date.now() - new Date(this.lastOnlineDate as string).getTime();

        this.relativeDate = new Intl.RelativeTimeFormat(this.translatorService.getLang(), { numeric: "auto" });

        this.lastOnlineDate = this.activityService.getRelativeTime(this.relativeDate, diffMs);
        this.lastOnlineDate = this.lastOnlineDate?.charAt(0).toUpperCase() + this.lastOnlineDate?.slice(1);

      },
      error: (error) => {
        this.user = null;
        const status = error?.status;
        const statusText = error?.statusText || error?.message || 'Unknown error';
        if (statusText.includes("Forbidden")) {
          this.isPrivate = true;
          setTimeout(() => this.animateMoodX(), 100);
        } else {
          this.router.navigate(['/error'], {state: {status: status, reason: statusText}});
        }
      }
    });

    this.sessionService.getLoggedUser().subscribe(loggedUser => {
      this.isOwnProfile = loggedUser?.username === this.username;
      this.isAdmin = loggedUser?.role?.includes('ADMIN');
    });


    this.activatedRoute.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && ['recipes', 'reviews', 'collections', 'ingredients'].includes(tab)) {
        this.activeTab = tab as 'recipes' | 'reviews' | 'collections' | 'ingredients';
      }
      this.loadDataForActiveTab();
    });

    this.userService.getUserCollections(this.username, 0, 1).subscribe({
      next: (response) => {
        this.collectionsCount = response.total;
      },
      error: (error) => {
        this.collectionsCount = 0;
      }
    });
  }

  animateMoodX() {
    const icon = document.getElementsByClassName('ti-mood-xd')[0] as HTMLElement;
    const iconContainer = document.getElementsByClassName('iconCont')[0] as HTMLElement;
    const fingerIcon = document.getElementsByClassName('ti-hand-finger')[0] as HTMLElement;
    if (icon) {
      iconContainer.classList.remove('mood-xd-cont-anim');
      icon.classList.remove('mood-xd-anim');
      fingerIcon.classList.remove('finger-bounce-anim');
      void (icon as HTMLElement).offsetWidth;
      icon.classList.add('mood-xd-anim');
      iconContainer.classList.add('mood-xd-cont-anim');
      fingerIcon.classList.add('finger-bounce-anim');
    }
  }

  async loadDataForActiveTab(): Promise<void> {
    switch(this.activeTab) {
      case 'recipes':
        this.recipes = await this.loadRecipes();
        break;
      case 'reviews':
        if (this.reviews.length === 0) {
          this.loadReviews();
        }
        break;
      case 'ingredients':
        if (this.ingredients.length === 0) {
          this.loadIngredients();
        }
        break;
      case 'collections':
        if (this.collections.length === 0) {
          this.loadCollections();
        }
        break;
    }
  }

  navigateToEditProfile() {
    this.editing = true;
    this.router.navigate([`/users/${this.username}/edit`]);
  }

  setActiveTab(tab: 'recipes' | 'reviews' | 'collections' | 'ingredients'): void {
    const tabOrder = ['recipes', 'reviews', 'collections', 'ingredients'];
    const currentIndex = tabOrder.indexOf(this.activeTab);
    const newIndex = tabOrder.indexOf(tab);

    const newAnimationClass = newIndex > currentIndex ? 'slideleft' : 'slideright';

    this.animationClass = '';
    this.cdr.detectChanges();

    setTimeout(() => {
      this.animationClass = newAnimationClass;
      this.cdr.detectChanges();
    }, 10);

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge'
    });
  }

  async loadRecipes(): Promise<any[]> {
    this.recipesLoading = true;
    this.recipesPage = 0;
    try {
      const response = await firstValueFrom(this.userService.getUserRecipes(this.username, this.recipesPage, 10));
      this.recipes = response.content;
      this.hasMoreRecipes = response.hasMore;
      this.totalRecipes = response.total;
      this.recipesLoading = false;
      return response.content;
    } catch (error) {
      console.error('Error loading recipes:', error);
      this.recipesLoading = false;
      return [];
    }
  }

  loadMoreRecipes(): void {
    if (this.loadingMoreRecipes || !this.hasMoreRecipes) return;

    this.loadingMoreRecipes = true;
    this.recipesPage++;

    this.userService.getUserRecipes(this.username, this.recipesPage, 10).subscribe({
      next: (response) => {
        this.recipes = [...this.recipes, ...response.content];
        this.hasMoreRecipes = response.hasMore;
        this.loadingMoreRecipes = false;
      },
      error: (error) => {
        console.error('Error loading more recipes:', error);
        this.loadingMoreRecipes = false;
        this.recipesPage--;
      }
    });
  }

  loadReviews(): void {
    this.reviewsLoading = true;
    this.reviewsPage = 0;
    this.userService.getUserReviews(this.username, this.reviewsPage, 10).subscribe({
      next: (response) => {
        this.reviews = response.content;
        this.hasMoreReviews = response.hasMore;
        this.reviewsLoading = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.reviewsLoading = false;
      }
    });
  }

  loadMoreReviews(): void {
    if (this.loadingMoreReviews || !this.hasMoreReviews) return;

    this.loadingMoreReviews = true;
    this.reviewsPage++;

    this.userService.getUserReviews(this.username, this.reviewsPage, 10).subscribe({
      next: (response) => {
        this.reviews = [...this.reviews, ...response.content];
        this.hasMoreReviews = response.hasMore;
        this.loadingMoreReviews = false;
      },
      error: (error) => {
        console.error('Error loading more reviews:', error);
        this.loadingMoreReviews = false;
        this.reviewsPage--;
      }
    });
  }

  loadIngredients(): void {
    this.ingredientsLoading = true;
    this.ingredientsPage = 0;
    this.userService.getUserIngredientsPaginated(this.username, this.ingredientsPage, 9).subscribe({
      next: (response) => {
        this.ingredients = response.content;
        this.hasMoreIngredients = response.hasMore;
        this.ingredientsLoading = false;
      },
      error: (error) => {
        console.error('Error loading ingredients:', error);
        this.ingredientsLoading = false;
      }
    });
  }

  loadMoreIngredients(): void {
    if (this.loadingMoreIngredients || !this.hasMoreIngredients) return;

    this.loadingMoreIngredients = true;
    this.ingredientsPage++;

    this.userService.getUserIngredientsPaginated(this.username, this.ingredientsPage, 9).subscribe({
      next: (response) => {
        this.ingredients = [...this.ingredients, ...response.content];
        this.hasMoreIngredients = response.hasMore;
        this.loadingMoreIngredients = false;
      },
      error: (error) => {
        console.error('Error loading more ingredients:', error);
        this.loadingMoreIngredients = false;
        this.ingredientsPage--;
      }
    });
  }

  loadCollections(): void {
    this.collectionsLoading = true;
    this.collectionsPage = 0;
    this.collectionService.getAllUserCollections(this.username).subscribe({
      next: (response: any) => {
        this.collections = response;
        this.hasMoreCollections = false;
        this.collectionsLoading = false;
      },
      error: (error: any) => {
        this.collections = [];
        this.hasMoreCollections = false;
        this.collectionsLoading = false;
      }
    });
  }

  loadMoreCollections(): void {
    if (this.loadingMoreCollections || !this.hasMoreCollections) return;
    this.loadingMoreCollections = true;
    this.collectionService.getAllUserCollections(this.username).subscribe({
      next: (response: any) => {
        this.collections = response;
        this.hasMoreCollections = false;
        this.loadingMoreCollections = false;
      },
      error: (error: any) => {
        this.loadingMoreCollections = false;
      }
    });
  }

  openViewCollectionModal(collection: any): void {
    this.viewingCollection = collection;
    this.showViewCollectionModal = true;
    this.viewModalClosing = false;
  }

  closeViewCollectionModal(): void {
    this.viewModalClosing = true;
    setTimeout(() => {
      this.showViewCollectionModal = false;
      this.viewingCollection = null;
      this.viewModalClosing = false;
    }, 300);
  }

  navigateToRecipe(recipeId: number): void {
    this.router.navigate(['/recipes', recipeId]);
  }

}
