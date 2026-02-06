import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {BehaviorSubject, forkJoin, Observable} from 'rxjs';
import {Recipe} from '../../models/recipe.model';
import {RecipeService} from '../../services/recipe.service';
import {RecipeCollectionService} from '../../services/recipe-collection.service';
import {SessionService} from '../../services/session.service';
import {RecipeCollection} from '../../models/recipe-collection.model';
import {ActivityService} from '../../services/activity.service';
import {CollectionCardComponent} from '../shared/collection-card/collection-card.component';
import {TranslatorService} from '../../services/translator.service';
import {DomSanitizer} from '@angular/platform-browser';
import {ThemeService} from '../../services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CollectionCardComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  recipeList: Recipe[] = [];
  page = 0;
  itemsPerPage = 9;
  isLoading: boolean = true;
  hasMore: boolean = true;

  showAddToCollectionDialog: boolean = false;
  selectedRecipeId?: number;
  favoritesCollection?: RecipeCollection;
  favoriteRecipeIds: Set<number> = new Set();

  logos: Map<string, string> = new Map();

  private userCollectionsSubject = new BehaviorSubject<RecipeCollection[]>([]);
  public userCollections$ = this.userCollectionsSubject.asObservable();

  get userCollections(): RecipeCollection[] {
    return this.userCollectionsSubject.value;
  }

  popularCollections: RecipeCollection[] = [];
  collectionsLoading: boolean = false;

  showCollectionView: boolean = false;
  selectedCollection?: RecipeCollection;

  activities: any[] = [];
  reviews: any[] = [];

  public currentUser: any = null;
  public linkHover: boolean = false;
  hoverRecipeId: number | undefined = undefined;

  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private themeService: ThemeService,
    private collectionService: RecipeCollectionService,
    private sessionService: SessionService,
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef,
    public sanitizer: DomSanitizer,
    public translator: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.logos = this.themeService.getLogos();
    this.cdr.detectChanges();

    this.translator.onChange(() => {
      this.loadActivities()
    })

    this.loadActivities();

    this.activityService.getLatestReviews(10).subscribe((res: any) => {
      this.reviews = ((res.reviews || []).slice(0, 10)).reverse();
    });

    this.sessionService.getLoggedUser().subscribe(user => {
      if (user && user.username) {
        this.currentUser = user;
        this.sessionService.currentUser = user;
        this.loadFavoritesCollectionForUser(user.username);
        this.loadUserCollections(user.username);
      } else {
        this.currentUser = null;
        this.fetchRecipes();
        this.loadPopularCollections();
      }
    }, _error => {
      this.currentUser = null;
      this.fetchRecipes();
      this.loadPopularCollections();
    });

  }

  loadActivities(): void {
    this.activityService.getLatestActivities(10).subscribe(async (res: any) => {
      const activitiesRaw = (res.activities || [])
        .filter((a: any) => !a.activityType || !a.activityType.includes('REVIEW'))
        .slice(0, 10)
        .reverse();

      this.activities = await Promise.all(activitiesRaw.map(async (a: any) => {
        if (a.activityType) {
          if (["CREATE_COLLECTION", "UPDATE_COLLECTION", "DELETE_COLLECTION"].includes(a.activityType) && a.collectionId) {
            try {
              const colName = await this.getCollectionNamePromise(a.collectionId);
              const link = `<p>${colName}</p>`;
              a.formattedDescription = this.sanitizer.bypassSecurityTrustHtml(`${this.t('activity_' + a.activityType.toLowerCase())} ${link}`);
            } catch {
              a.formattedDescription = this.sanitizer.bypassSecurityTrustHtml(`${this.t('activity_' + a.activityType.toLowerCase())} ${this.t('collection')}`);
            }
          } else {
            a.formattedDescription = await this.formatActivityDescription(a);
          }
        }
        return a;
      }));
    });
  }

  loadUserCollections(username: string): void {
    this.collectionsLoading = true;
    this.collectionService.getAllUserCollections(username).subscribe({
      next: (collections) => {
        const filtered = collections.reverse().filter(c => !c.isFavorites).slice(0, 10);
        this.userCollectionsSubject.next(filtered);
        this.collectionsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user collections:', err);
        this.collectionsLoading = false;
      }
    });
  }

  loadPopularCollections(): void {
    this.collectionsLoading = true;
    this.collectionService.getPopularPublicCollections(5).subscribe({
      next: (collections) => {
        this.popularCollections = collections;
        this.collectionsLoading = false;
      },
      error: () => {
        this.collectionsLoading = false;
      }
    });
  }

  loadFavoritesCollectionForUser(username: string): void {
    forkJoin({
      collection: this.collectionService.getFavoritesCollection(username),
      ids: this.collectionService.getFavoriteRecipeIds(username)
    }).subscribe({
      next: (result) => {
        this.favoritesCollection = result.collection;
        this.favoriteRecipeIds.clear();
        result.ids.forEach((id: number) => this.favoriteRecipeIds.add(id));
        this.fetchRecipes();
        this.loadPopularCollections();
      },
      error: () => {
        this.fetchRecipes();
        this.loadPopularCollections();
      }
    });
  }

  fetchRecipes(): void {
    this.isLoading = true;
    this.page = 0;
    this.recipeService.getRecipes(this.page).subscribe({
      next: (recipes) => {
        this.recipeList = recipes;
        this.isLoading = false;
        this.hasMore = this.recipeList.length % this.itemsPerPage === 0;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadMoreRecipes(): void {
    this.isLoading = true;
    this.recipeService.getRecipes(++this.page).subscribe({
      next: (moreRecipes) => {
        this.recipeList = [...this.recipeList, ...moreRecipes];
        this.isLoading = false;
        this.hasMore = moreRecipes.length % this.itemsPerPage > 0;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  viewRecipe(id: number): void {
    this.router.navigate(['/recipes', id]);
  }

  toggleFavorite(recipeId: number, event: Event): void {
    event.stopPropagation();

    if (!this.sessionService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.favoritesCollection) {
      this.collectionService.getFavoritesCollection(this.sessionService.currentUser.username).subscribe({
        next: (collection) => {
          this.favoritesCollection = collection;
          this.toggleFavoriteInternal(recipeId);
        },
        error: () => {
        }
      });
      return;
    }

    this.toggleFavoriteInternal(recipeId);
  }

  private toggleFavoriteInternal(recipeId: number): void {
    if (!this.favoritesCollection) return;

    const isInFavorites = this.isRecipeInFavorites(recipeId);

    if (isInFavorites) {
      this.collectionService.removeRecipeFromCollection(this.favoritesCollection.id, recipeId).subscribe({
        next: () => {
          this.favoriteRecipeIds.delete(recipeId);
        },
        error: () => {
        }
      });
    } else {
      this.collectionService.addRecipeToCollection(this.favoritesCollection.id, recipeId).subscribe({
        next: () => {
          this.favoriteRecipeIds.add(recipeId);
        },
        error: () => {
        }
      });
    }
  }

  openAddToCollection(recipeId: number, event: Event): void {
    event.stopPropagation();

    if (!this.sessionService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.selectedRecipeId = recipeId;
    this.showAddToCollectionDialog = true;
    document.getElementsByTagName("html")[0].style.overflow = 'hidden';
  }

  closeAddToCollection(): void {
    this.showAddToCollectionDialog = false;
    this.selectedRecipeId = undefined;
  }

  onRecipeAddedToCollection(): void {
    this.closeAddToCollection();
    if (this.sessionService.currentUser) {
      this.loadUserCollections(this.sessionService.currentUser.username);
    }
  }

  isRecipeInFavorites(recipeId: number): boolean {
    return this.favoriteRecipeIds.has(recipeId);
  }

  navigateToCreateRecipe(): void {
    if (this.sessionService.currentUser) {
      this.router.navigate(['/recipes/new']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  navigateToEditProfile(): void {
    if (this.sessionService.currentUser) {
      this.router.navigate(['/profile/edit']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  navigateToExploreRecipes(): void {
    this.router.navigate(['/explore']);
  }

  navigateToIngredients(): void {
    this.router.navigate(['/ingredients']);
  }

  navigateToUser(username: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/users', username]);
  }

  viewCollection(collection: RecipeCollection): void {
    this.selectedCollection = collection;
    this.showCollectionView = true;
    document.getElementsByTagName("html")[0].style.overflow = 'hidden';
  }

  closeCollectionView(): void {
    this.showCollectionView = false;
    this.selectedCollection = undefined;
  }

  getCollectionImages(collection: RecipeCollection): string[] {
    if (!collection.recipes || collection.recipes.length === 0) {
      return [];
    }
    return collection.recipes
      .slice(0, 3)
      .filter(r => r.imageString)
      .map(r => `data:image/png;base64,${r.imageString}`);
  }

  async formatActivityDescription(activity: any): Promise<any> {
    const t = (key: string) => this.translator.translate(key);
    let link = '';
    let name = '';
    switch (activity.activityType) {
      case 'CREATE_RECIPE':
      case 'UPDATE_RECIPE':
      case 'DELETE_RECIPE':
        if (activity.recipeId && activity.recipeName) {
          if (activity.activityType === 'DELETE_RECIPE') {
            link = `<p>${activity.recipeName}</p>`;
          } else {
            link = `<a href='/recipes/${activity.recipeId}' style='color: var(--primary-600); text-decoration: underline;'>${activity.recipeName}</a>`;
          }
          name = link;
        } else {
          name = t('recipe');
        }
        return this.sanitizer.bypassSecurityTrustHtml(`${t('activity_' + activity.activityType.toLowerCase())} ${name}`);
      case 'CREATE_COLLECTION':
      case 'UPDATE_COLLECTION':
      case 'DELETE_COLLECTION':
        if (activity.collectionId) {
          this.getCollectionName(activity.collectionId).subscribe({
            next: (colName) => {
              link = `<p>${colName}</p>`;
              name = link;
            },
            error: () => {
              name = t('collection');
            }
          })
        } else {
          name = t('collection');
        }
        return this.sanitizer.bypassSecurityTrustHtml(`${t('activity_' + activity.activityType.toLowerCase())} ${name}`);
      case 'ADD_RECIPE_TO_COLLECTION':
        let recipeLink = activity.recipeId && activity.recipeName ? `<a href='/recipes/${activity.recipeId}' style='color: var(--primary-600); text-decoration: underline;'>${activity.recipeName}</a>` : t('recipe');
        let collectionLink = activity.collectionId ? `<a href='/collections/${activity.collectionId}' style='color: var(--primary-600); text-decoration: underline;'>#${activity.collectionId}</a>` : t('collection');
        return this.sanitizer.bypassSecurityTrustHtml(`${t('activity_add_recipe_to_collection')} ${recipeLink} → ${collectionLink}`);
      default:
        return this.sanitizer.bypassSecurityTrustHtml(activity.description || '');
    }
  }

  getCollectionName(collectionId: number): Observable<string> {
    return new Observable<string>((observer) => {
      this.collectionService.getCollectionById(collectionId).subscribe({
        next: (collection) => {
          observer.next(collection.title);
          observer.complete();
        },
        error: () => {
          observer.next(this.translator.translate('collection'));
          observer.complete();
        }
      });
    });
  }

  getCollectionNamePromise(collectionId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.collectionService.getCollectionById(collectionId).subscribe({
        next: (collection) => resolve(collection.title),
        error: () => resolve(this.translator.translate('collection'))
      });
    });
  }

  navigateToActivityTarget(activity: any): void {
    if (activity.recipeId && typeof activity.recipeId === 'number') {
      this.router.navigate(['/recipes', activity.recipeId]);
      return;
    }
    if (activity.collectionId && typeof activity.collectionId === 'number') {
      this.collectionService.getCollectionById(activity.collectionId).subscribe({
        next: (collection) => {
          this.selectedCollection = collection;
          this.showCollectionView = true;
        },
        error: (err) => {
          this.router.navigate(['/error'], {state: {status: err.status, reason: err.message}});
        }
      });
      return;
    }
  }

  protected openMyCollections() {
    this.router.navigateByUrl(`/users/${this.currentUser.username}?tab=collections`);
  }

  t(key: string): string {
    return this.translator.translate(key);
  }

  stripHtml(comment: string) {
    return comment.replace(/<[^>]*>/g, '');
  }
}
