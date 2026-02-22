import { Component, HostListener, OnInit, SecurityContext } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Recipe } from '../../models/recipe.model';
import { Review } from '../../models/review.model';
import { CommonModule } from '@angular/common';
import { IngredientIconService } from '../../services/ingredient-icon.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { Ingredient } from '../../models/ingredient.model';
import { RecipeCollectionService } from '../../services/recipe-collection.service';
import { RecipeCollection } from '../../models/recipe-collection.model';
import { CollectionCardComponent } from '../shared/collection-card/collection-card.component';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatorService } from '../../services/translator.service';
import { ThemeService } from '../../services/theme.service';
import { ActivityService } from '../../services/activity.service';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-recipe-view',
  templateUrl: './recipe-view.component.html',
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    CollectionCardComponent
  ],
  styleUrls: ['./recipe-view.component.css']
})
export class RecipeViewComponent implements OnInit {

  // User interactions
  recipe: Recipe | null = null;

  activeTab: 'instructions' | 'nutrition' | 'reviews' = 'instructions';
  user: any = null;
  authorPfp: string = '';
  defaultPfp: string = '';
  isAuthenticated: any;
  created: string | number | Date = "";
  lastUpdated: string | number | Date = "";

  // Timer properties
  timer: any;
  time: number = 0;
  timerRunning: boolean = false;
  showTimer: boolean = false;

  // Step navigation
  currentStep: number = 0;

  focusMode: boolean = false;
  focusModeClosing: boolean = false;
  nextLabel: string = "Next";

  originalServings: number = 1;
  currentServings: number = 1;
  servingsScale: number = 1;

  holdInterval: any;
  holdTimeout: any;

  // Review properties
  showReviewForm: boolean = false;
  showDeleteModal: boolean = false;
  selectedRecipeId: number | undefined = -1;
  showAddToCollectionDialog: boolean = false;

  responsive: boolean = window.innerWidth <= 1024;
  currentCarouselIndex: number = 0;
  isDraggingCarousel: boolean = false;
  carouselStartX: number = 0;
  carouselCurrentX: number = 0;
  carouselTranslate: number = 0;
  carouselCards: string[] = ['recipe', 'ingredients'];

  openDeleteModal() {
    this.showDeleteModal = true;
    document.getElementsByTagName("html")[0].style.overflow = 'hidden';
  }

  closeDeleteModal(event: Event) {
    ((event?.target as HTMLElement).closest('.visibleBackdrop')?.classList.remove('visibleBackdrop'));
    setTimeout(() => this.showDeleteModal = false, 500);
  }

  onDeleteBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeDeleteModal(event);
    }
  }

  async confirmDeleteRecipe(event: Event) {
    const id: number = this.activatedRoute.snapshot.params['id'];
    this.recipeService.deleteRecipe(id).subscribe({
      next: () => {
        this.router.navigate(["/"])
      },
      error: (error) => {
        this.router.navigate(['/error'], { state: { status: error.status, reason: error.message } });
      }
    })
    this.closeDeleteModal(event);
  }
  newReview: {
    rating: number;
    comment: string;
  } = {
      rating: 0,
      comment: ''
    };
  reviewHoverRating: number = 0;
  private selection: Selection | null = null;
  animationMode: string = '';

  logos: Map<string, string> = new Map();

  reviews: Set<any> = new Set<Review>();
  uniqueReviews: Review[] = [];
  userReview: Review | null = null;
  reviewsPage: number = 0;
  reviewsPageSize: number = 10;
  hasMoreReviews: boolean = false;
  loadingReviews: boolean = false;
  userHasReview: boolean = false;
  isRecipeAuthor: boolean = false;

  userIngredients: Set<Ingredient> = new Set<Ingredient>();

  userCollections: RecipeCollection[] = [];
  favoritesCollection: RecipeCollection | null = null;
  showCollectionModal: boolean = false;
  isInFavorites: boolean = false;
  isAdmin: boolean = false;

  confirmDeleteReview: boolean = false;

  constructor(
    private router: Router,
    private recipeService: RecipeService,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private sessionService: SessionService,
    private themeService: ThemeService,
    private reviewService: ReviewService,
    private collectionService: RecipeCollectionService,
    public ingredientIconService: IngredientIconService,
    private activityService: ActivityService,
    private sanitizer: DomSanitizer,
    private translatorService: TranslatorService,
    private titleService: Title
  ) { }

  t(key: string): string {
    return this.translatorService.translate(key);
  }

  private getUniqueReviewsArray(): Review[] {
    const seen = new Set<number>();
    const unique: Review[] = [];
    this.reviews.forEach((review: Review) => {
      if (!seen.has(Number(review.id))) {
        seen.add(Number(review.id));
        unique.unshift(review);
      }
    });
    return unique;
  }

  async ngOnInit() {
    this.translatorService.onChange(() => {
      this.updateTitle();
    });
    await this.initAll();
    this.uniqueReviews = this.getUniqueReviewsArray();
  }

  updateTitle() {
    if (this.recipe?.title) {
      this.titleService.setTitle(this.t('title_rarecips') + this.recipe.title);
    }
  }

  private async initAll() {
    this.logos = this.themeService.getLogos();

    this.userService.getDefaultPfp().subscribe({
      next: (data: any) => {
        this.defaultPfp = data.profileImageString;
      }
    })

    await this.loadRecipe();
    await this.loadReviews();
    await new Promise<void>((resolve) => {
      this.sessionService.getLoggedUser().pipe(
        takeUntil(new Subject<void>())
      ).subscribe({
        next: async user => {
          if (!user) {
            this.isAuthenticated = false;
            await this.loadReviews();
            this.uniqueReviews = this.getUniqueReviewsArray();
            resolve();
            return;
          }
          this.user = user;
          this.isAuthenticated = true;
          this.isRecipeAuthor = this.recipe?.author === user.username;
          this.isAdmin = user.role.includes('ADMIN');
          await this.loadReviews();
          this.uniqueReviews = this.getUniqueReviewsArray();
          this.userService.getUserIngredients(user.username).subscribe({
            next: (ingredients: Ingredient[]) => {
              this.userIngredients = new Set<Ingredient>(ingredients);
            }
          });
          this.loadUserCollections(user.username);
          resolve();
        },
        error: async () => {
          this.isAuthenticated = false;
          await this.loadReviews();
          this.uniqueReviews = this.getUniqueReviewsArray();
          resolve();
        }
      });
    });
    if (this.recipe?.createdAt) {
      const createdDate = new Date(this.recipe.createdAt);
      const day = String(createdDate.getDate()).padStart(2, '0');
      const month = String(createdDate.getMonth() + 1).padStart(2, '0');
      const year = createdDate.getFullYear();
      this.created = `${day}/${month}/${year}`;
    }
    if (this.recipe?.updatedAt) {
      const updatedDate = new Date(this.recipe.updatedAt);
      const day = String(updatedDate.getDate()).padStart(2, '0');
      const month = String(updatedDate.getMonth() + 1).padStart(2, '0');
      const year = updatedDate.getFullYear();
      this.lastUpdated = `${day}/${month}/${year}`;
    }
    if (this.recipe?.totalTime) {
      this.time = this.recipe.totalTime * 60;
    }
    addEventListener('keydown', (event) => {
      if (!this.focusMode) return;
      if (event?.key === 'ArrowRight') {
        this.nextStep();
      } else if (event?.key === 'ArrowLeft') {
        this.previousStep();
      } else if (event?.key === 'Escape') {
        this.exitFocusMode();
      }
    });
  }

  async loadRecipe(): Promise<void> {
    const id = this.activatedRoute.snapshot.params['id'];


    this.recipe = await firstValueFrom(this.recipeService.getRecipeById(this.activatedRoute.snapshot.params['id']));
    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        this.updateTitle();
        if (this.recipe?.people) {
          this.originalServings = this.recipe.people;
          this.currentServings = this.recipe.people;
          this.servingsScale = 1;
        }

        if (this.recipe?.author) {
          this.userService.getUserByUsername(<string>this.recipe?.author).subscribe((res) => {
            if (res.profileImageString) {
              this.authorPfp = "data:image/png;base64," + res.profileImageString;
            }
          });
        }

        if (this.recipe?.createdAt) {
          const createdDate = new Date(this.recipe.createdAt);
          const day = String(createdDate.getDate()).padStart(2, '0');
          const month = String(createdDate.getMonth() + 1).padStart(2, '0');
          const year = createdDate.getFullYear();
          this.created = `${day}/${month}/${year}`;
        }

        if (this.recipe?.updatedAt) {
          const updatedDate = new Date(this.recipe.updatedAt);
          const day = String(updatedDate.getDate()).padStart(2, '0');
          const month = String(updatedDate.getMonth() + 1).padStart(2, '0');
          const year = updatedDate.getFullYear();
          this.lastUpdated = `${day}/${month}/${year}`;
        }

        if (this.recipe?.totalTime) {
          this.time = this.recipe.totalTime * 60;
        }
      },
      error: (err) => {
        console.error('Error loading recipe:', err);
        this.router.navigate(['/error'], { state: { status: err.status, reason: err.message } });
      }
    });
  }

  setActiveTab(tab: 'instructions' | 'nutrition' | 'reviews'): void {

    const nutritionContainer = document.getElementsByClassName('nutritionContainer')[0] as HTMLElement;
    if (nutritionContainer) {
      if (tab === 'reviews') {
        this.animationMode = "right"
      } else if (tab === 'instructions') {
        this.animationMode = "left";
      }
    }

    this.activeTab = tab;
  }

  getDifficultyLabel(): string {
    if (!this.recipe) return this.t('medium');
    switch (this.recipe.difficulty) {
      case 1: return this.t('very_easy');
      case 2: return this.t('easy');
      case 3: return this.t('medium');
      case 4: return this.t('hard');
      case 5: return this.t('very_hard');
      default: return this.t('medium');
    }
  }

  openAddToCollection(recipeId: number | undefined, event: Event): void {
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

  getCuisineTypes(): readonly string[] {
    return this.recipe?.cuisineType || [];
  }

  getMealTypes(): readonly string[] {
    return this.recipe?.mealTypes || [];
  }

  getDishTypes(): readonly string[] {
    return this.recipe?.dishTypes || [];
  }

  getDietLabels(): readonly string[] {
    return this.recipe?.dietLabels || [];
  }

  getHealthLabels(): readonly string[] {
    return this.recipe?.healthLabels || [];
  }

  getCautions(): readonly string[] {
    return this.recipe?.cautions || [];
  }

  getSteps(): readonly string[] {
    return this.recipe?.steps || [];
  }

  getIngredients() {
    return this.recipe?.ingredients || [];
  }

  getReviews(): readonly Review[] {
    return this.recipe?.reviews || [];
  }

  get formatTime() {
    const minutes = Math.floor(this.time / 60);
    const seconds = this.time % 60;
    return `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(num: number) {
    return String(num).padStart(2, '0');
  }

  startTimer() {
    this.focusMode = true;
    document.getElementsByTagName("html")[0].style.overflow = 'hidden';
    this.focusModeClosing = false;
    this.currentStep = 0;
    document.body.style.overflow = 'hidden';

    if (!this.timerRunning && this.time === 0 && this.recipe?.totalTime) {
      this.time = this.recipe.totalTime * 60;
    }

    if (!this.recipe?.totalTime) return;
    this.showTimer = true;
    if (!this.timerRunning) {
      if (this.time === 0) {
        this.time = this.recipe.totalTime * 60;
      }
      this.timer = setInterval(() => {
        if (this.time > 0) {
          this.time--;
        } else {
          this.stopTimer();
        }
      }, 1000);
      this.timerRunning = true;
    }
  }

  pauseTimer() {
    clearInterval(this.timer);
    this.timerRunning = false;
  }

  resetTimer() {
    this.stopTimer();
    if (this.recipe?.totalTime) {
      this.time = this.recipe.totalTime * 60;
    } else {
      this.time = 0;
    }
  }

  stopTimer() {
    clearInterval(this.timer);
    this.timerRunning = false;
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
    this.nextLabel = "Next";
  }

  nextStep() {
    const steps = this.getSteps();
    if (this.currentStep < steps.length - 1) {
      this.currentStep++;
      if (this.currentStep === steps.length - 1) {
        this.nextLabel = "Bon appétit!";
      }
    } else {
      this.exitFocusMode();
    }
  }

  goToStep(index: number) {
    const steps = this.getSteps();
    if (index >= 0 && index < steps.length) {
      this.currentStep = index;
    }
  }

  exitFocusMode(event: Event | null = null) {
    ((event?.target as HTMLElement).closest('.visibleBackdrop')?.classList.remove('visibleBackdrop'));
    setTimeout(() => {
      this.focusModeClosing = true;
      this.focusMode = false;
      this.focusModeClosing = false;
      this.resetTimer();
      this.nextLabel = "Next";

      document.body.style.overflow = 'auto';
    }, 300);
  }

  incrementServings() {
    this.currentServings++;
    this.updateServingsScale();
  }

  decrementServings() {
    if (this.currentServings > 1) {
      this.currentServings--;
      this.updateServingsScale();
    }
  }

  updateServingsScale() {
    this.servingsScale = this.currentServings / this.originalServings;
  }

  getScaledQuantity(quantity: number): string {
    const scaled = quantity * this.servingsScale;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2).replace(/\.?0+$/, '');
  }

  startHoldIncrement() {
    this.incrementServings();
    this.holdTimeout = setTimeout(() => {
      this.holdInterval = setInterval(() => {
        this.incrementServings();
      }, 100);
    }, 500);
  }

  startHoldDecrement() {
    if (this.currentServings > 1) {
      this.decrementServings();
      this.holdTimeout = setTimeout(() => {
        this.holdInterval = setInterval(() => {
          if (this.currentServings > 1) {
            this.decrementServings();
          } else {
            this.stopHold();
          }
        }, 100);
      }, 500);
    }
  }

  stopHold() {
    clearTimeout(this.holdTimeout);
    clearInterval(this.holdInterval);
  }

  toggleReviewForm() {
    if (!this.isAuthenticated) {
      this.router.navigate(['/error'], { state: { status: 403, reason: "You must be logged in to write a review" } });
      return;
    }
    this.showReviewForm = !this.showReviewForm;
    if (!this.showReviewForm) {
      this.resetReviewForm();
    }
  }

  resetReviewForm() {
    this.newReview = {
      rating: 0,
      comment: ''
    };
    this.reviewHoverRating = 0;
  }

  setRating(rating: number) {
    this.newReview.rating = rating;
  }

  setHoverRating(rating: number) {
    this.reviewHoverRating = rating;
  }

  clearHoverRating() {
    this.reviewHoverRating = 0;
  }

  applyFormat(event: Event, command: string) {
    event.preventDefault();
    const htmlTarget = event.target as HTMLElement;
    const editor = document.getElementsByClassName("reviewEditor")[0] as HTMLElement;
    document.execCommand(command, false);

    htmlTarget.closest("button")?.classList.toggle('clicked');
  }

  submitReview() {
    const reviewData = {
      rating: this.newReview.rating,
      comment: this.newReview.comment,
      recipe: {
        id: this.recipe?.id
      }
    };

    if (!this.isAuthenticated) {
      this.router.navigate(['/error'], { state: { status: 403, reason: "You must be logged in to write a review" } });
      return;
    }

    if (this.newReview.rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!this.newReview.comment || this.newReview.comment.trim() === '') {
      alert('Please write a comment');
      return;
    }

    const sanitizedComment = this.sanitizer.sanitize(SecurityContext.HTML, this.sanitizer.bypassSecurityTrustHtml(this.newReview.comment)) || '';
    reviewData.comment = sanitizedComment;

    this.reviewService.submitReview(reviewData).subscribe({
      next: (response) => {
        this.resetReviewForm();
        this.showReviewForm = false;
        this.userHasReview = true;
        this.loadRecipe();
        this.reviewsPage = 0;
        this.userReview = null;
        this.loadReviews();
      },
      error: (error) => {
        console.error('Error submitting review:', error);
      }
    });
  }

  async loadReviews(): Promise<Set<any>> {
    if (!this.recipe?.id) return Promise.resolve(new Set<any>());

    this.loadingReviews = true;
    return new Promise((resolve, reject) => {
      this.reviewService.getReviewsByRecipeId(this.recipe?.id, this.reviewsPage, this.reviewsPageSize).subscribe({
        next: async (data) => {
          const newReviews = data.reviews || [];
          await newReviews.map(async (r: Review) => {
            try {
              let user: any;
              if (r.authorUsername) user = await firstValueFrom(this.userService.getUserByUsername(r.authorUsername));
              if (user) r.authorPfp = "data:image/png;base64," + user?.profileImageString; else r.authorPfp = '/assets/img/user.png';
            } catch {
              r.authorPfp = '/assets/img/user.png';
            }
            if (!this.reviewsPage) this.reviews.add(r)
            this.reviews.forEach((existingReview: Review, index: number) => {
              if (existingReview.id === r.id) {

              } else {
                this.reviews.add(r)
              }
            })
          });

          if (this.isAuthenticated && this.user) {
            const userReviewIndex = newReviews.findIndex((r: Review) =>
              (r.authorUsername || r.author) === this.user.username
            );
            if (userReviewIndex !== -1) {
              this.userReview = newReviews.splice(userReviewIndex, 1)[0];
              this.userHasReview = true;
            } else if (this.reviewsPage === 0) {
              this.userHasReview = false;
              this.userReview = null;
            }
          }

          this.hasMoreReviews = data.hasMore || false;
          this.loadingReviews = false;
          resolve(this.reviews);
        },
        error: (error) => {
          console.error('Error loading reviews:', error);
          this.loadingReviews = false;
          reject(error);
        }
      });
    });
  }

  confirmDeleteReviewPrompt(event: Event) {
    event.stopPropagation();
    this.confirmDeleteReview = true;
  }

  cancelReviewDelete(event: FocusEvent) {
    if (!event.relatedTarget || !(<HTMLElement>event.relatedTarget).classList.contains('confirmDelete')) {
      this.confirmDeleteReview = false;
    }
  }

  deleteReview(reviewId: string) {

    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.confirmDeleteReview = false;
        this.userReview = null;
        this.userHasReview = false;
        this.loadRecipe();
        this.reviewsPage = 0;
        this.reviews = new Set<Review>();
        this.loadReviews();
      },
      error: (error) => {
        console.error('Error deleting review:', error);
        alert('Error deleting review. Please try again.');
      }
    });
  }

  loadMoreReviews() {
    if (this.loadingReviews || !this.hasMoreReviews) return;
    this.reviewsPage++;
    this.loadReviews();
  }

  formatReviewDate(date: Date | string): string {
    const reviewDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const relativeDate = new Intl.RelativeTimeFormat(this.translatorService.getLang(), { numeric: "auto" });

    return this.activityService.getRelativeTime(relativeDate, diffMs);
  }

  onCommentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.selection = window.getSelection();
    const range = this.selection && this.selection.rangeCount > 0 ? this.selection.getRangeAt(0) : null;
    const startOffset = range?.startOffset || 0;
    const startContainer = range?.startContainer;

    this.newReview.comment = target.innerText;

    setTimeout(() => {
      if (startContainer && this.selection && range) {
        try {
          if (target.contains(startContainer)) {
            range.setStart(startContainer, Math.min(startOffset, startContainer.textContent?.length || 0));
            range.collapse(true);
            this.selection.removeAllRanges();
            this.selection.addRange(range);
          }
        } catch (e) {
          const newRange = document.createRange();
          newRange.selectNodeContents(target);
          newRange.collapse(false);
          this.selection.removeAllRanges();
          this.selection.addRange(newRange);
        }
      }
    }, 0);
  }

  checkReview() {
    return !(this.newReview.rating > 0 && this.newReview.comment.trim().length > 0);
  }

  hasIngredientInPantry(ingredient: number, ingred: any): boolean {
    let res = false;
    this.userIngredients.forEach((ing: Ingredient) => {
      if (!res) res = ingred.id == ingredient;
    });
    return res;
  }

  loadUserCollections(username: string): void {
    this.userService.getUserCollections(username, 0, 100).subscribe({
      next: (response: any) => {
        const collections = response.content;
        this.userCollections = collections.filter((c: any) => !c.isFavorites);
        this.favoritesCollection = collections.find((c: any) => c.isFavorites) || null;
        this.checkIfInFavorites();
      },
      error: (error: any) => {
        console.error('Error loading collections:', error);
      }
    });
  }

  checkIfInFavorites(): void {
    if (!this.favoritesCollection || !this.recipe?.id) {
      this.isInFavorites = false;
      return;
    }

    this.isInFavorites = this.favoritesCollection.recipes.some(r => r.id === this.recipe!.id);
  }

  toggleFavorite(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/error'], { state: { status: 403, reason: "You must be logged in to add favorites" } });
      return;
    }

    if (!this.favoritesCollection) {
      this.collectionService.getFavoritesCollection(this.user.username).subscribe({
        next: (collection) => {
          this.favoritesCollection = collection;
          this.addToFavorites();
        },
        error: (error) => {
          console.error('Error getting favorites collection:', error);
        }
      });
    } else {
      if (this.isInFavorites) {
        this.removeFromFavorites();
      } else {
        this.addToFavorites();
      }
    }
  }

  addToFavorites(): void {
    if (!this.favoritesCollection || !this.recipe?.id) return;

    this.collectionService.addRecipeToCollection(this.favoritesCollection.id, this.recipe.id).subscribe({
      next: () => {
        this.isInFavorites = true;
      },
      error: (error) => {
        console.error('Error adding to favorites:', error);
      }
    });
  }

  removeFromFavorites(): void {
    if (!this.favoritesCollection || !this.recipe?.id) return;

    this.collectionService.removeRecipeFromCollection(this.favoritesCollection.id, this.recipe.id).subscribe({
      next: () => {
        this.isInFavorites = false;
      },
      error: (error) => {
        console.error('Error removing from favorites:', error);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.responsive = window.innerWidth <= 1024;
  }

  nextCarouselCard() {
    this.currentCarouselIndex = (this.currentCarouselIndex + 1) % this.carouselCards.length;
  }

  prevCarouselCard() {
    this.currentCarouselIndex = (this.currentCarouselIndex - 1 + this.carouselCards.length) % this.carouselCards.length;
  }

  goToCarouselCard(index: number) {
    this.currentCarouselIndex = index;
  }

  carouselStartY: number = 0;

  onCarouselTouchStart(event: TouchEvent) {
    if (!this.responsive) return;

    const target = event.target as HTMLElement;

    this.isDraggingCarousel = true;
    this.carouselStartX = event.touches[0].clientX;
    this.carouselStartY = event.touches[0].clientY;
    this.carouselCurrentX = this.carouselStartX;
  }

  onCarouselTouchMove(event: TouchEvent) {
    if (!this.isDraggingCarousel || !this.responsive) return;

    const deltaX = event.touches[0].clientX - this.carouselStartX;
    const deltaY = event.touches[0].clientY - this.carouselStartY;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      this.isDraggingCarousel = false;
      this.carouselTranslate = 0;
      return;
    }

    event.stopPropagation();
    if (event.cancelable) {
      event.preventDefault();
    }


    this.carouselCurrentX = event.touches[0].clientX;
    this.carouselTranslate = this.carouselCurrentX - this.carouselStartX;
  }

  onCarouselTouchEnd(event: TouchEvent) {
    if (!this.isDraggingCarousel || !this.responsive) return;

    const deltaX = this.carouselCurrentX - this.carouselStartX;
    const threshold = 50;

    if (deltaX > threshold) {
      this.prevCarouselCard();
    } else if (deltaX < -threshold) {
      this.nextCarouselCard();
    }

    this.isDraggingCarousel = false;
    this.carouselTranslate = 0;
  }

  closeCollectionModal(): void {
    this.showCollectionModal = false;
  }

  toggleRecipeInCollection(collection: RecipeCollection): void {
    if (!this.recipe?.id) return;

    const isInCollection = collection.recipes.some(r => r.id === this.recipe!.id);

    if (isInCollection) {
      this.collectionService.removeRecipeFromCollection(collection.id, this.recipe.id).subscribe({
        next: () => {
          if (this.user?.username) {
            this.loadUserCollections(this.user.username);
          }
        },
        error: (error) => {
          console.error('Error removing from collection:', error);
        }
      });
    } else {
      this.collectionService.addRecipeToCollection(collection.id, this.recipe.id).subscribe({
        next: () => {
          if (this.user?.username) {
            this.loadUserCollections(this.user.username);
          }
        },
        error: (error) => {
          console.error('Error adding to collection:', error);
        }
      });
    }
  }

  shareRecipe() {
    if (navigator.share) {
      navigator.share({
        title: this.recipe?.title,
        text: `${this.t('share_recipe_desc')} ${this.recipe?.title}`,
        url: window.location.href
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    }
  }
}

