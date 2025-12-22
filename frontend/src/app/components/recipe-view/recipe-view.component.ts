import {Component, OnInit} from '@angular/core';
import {RecipeService} from '../../services/recipe.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Recipe} from '../../models/recipe.model';
import {Review} from '../../models/review.model';
import {CommonModule} from '@angular/common';
import {IngredientIconService} from '../../services/ingredient-icon.service';
import {Subject, takeUntil} from 'rxjs';
import {SessionService} from '../../services/session.service';
import {UserService} from '../../services/user.service';
import {FormsModule} from '@angular/forms';
import {ReviewService} from '../../services/review.service';
import {Ingredient} from '../../models/ingredient.model';


@Component({
  selector: 'app-recipe-view',
  templateUrl: './recipe-view.component.html',
  imports: [
    RouterLink,
    CommonModule,
    FormsModule
  ],
  styleUrls: ['./recipe-view.component.css']
})
export class RecipeViewComponent implements OnInit {

  // User interactions
  isLiked = false;
  isSaved = false;
  userRating = 0;
  recipe: Recipe | null = null;

  activeTab: 'instructions' | 'nutrition' | 'reviews' = 'instructions';
  user: any = null;
  authorPfp: string = '';
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
  nextLabel:  string = "Next";

  originalServings: number = 1;
  currentServings: number = 1;
  servingsScale: number = 1;

  holdInterval: any;
  holdTimeout: any;

  // Review properties
  showReviewForm: boolean = false;
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

  reviews: Review[] = [];
  userReview: Review | null = null;
  reviewsPage: number = 0;
  reviewsPageSize: number = 10;
  hasMoreReviews: boolean = false;
  loadingReviews: boolean = false;
  userHasReview: boolean = false;
  isRecipeAuthor: boolean = false;

  userIngredients: Set<Ingredient> = new Set<Ingredient>();

  constructor(
    private router: Router,
    private recipeService: RecipeService,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private sessionService: SessionService,
    private reviewService: ReviewService,
    public ingredientIconService: IngredientIconService
  ) {}

  ngOnInit() {
    this.loadRecipe();

    this.sessionService.getLoggedUser().pipe(
      takeUntil(new Subject<void>())
    ).subscribe({
      next: user => {
        if (!user) {
          this.isAuthenticated = false;
          this.loadReviews();
          return;
        }
        this.user = user;
        this.isAuthenticated = true;

        this.isRecipeAuthor = this.recipe?.author === user.username;

        this.loadReviews();

        this.userService.getUserIngredients(user.username).subscribe({
          next: (ingredients: Ingredient[]) => {
            this.userIngredients = new Set<Ingredient>(ingredients);
          }
        });
      },
      error: () => {
        this.isAuthenticated = false;
        this.loadReviews();
      }
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
    })
  }

  loadRecipe(): void {
    const id = this.activatedRoute.snapshot.params['id'];
    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;

        if (this.recipe?.people) {
          this.originalServings = this.recipe.people;
          this.currentServings = this.recipe.people;
          this.servingsScale = 1;
        }

        if (this.recipe?.author) {
          this.userService.getUserByUsername(<string>this.recipe?.author).subscribe((res) => {
            this.authorPfp = res.profileImageString;
          });
        } else {
          this.authorPfp = '/assets/img/user.png';
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
    if (!this.recipe) return 'Medium';
    switch(this.recipe.difficulty) {
      case 1: return 'Easy';
      case 2: return 'Easy';
      case 3: return 'Medium';
      case 4: return 'Hard';
      case 5: return 'Hard';
      default: return 'Medium';
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

  exitFocusMode() {
    this.focusModeClosing = true;
    setTimeout(() => {
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
      this.router.navigate(['/error'], {state: {status: 403, reason: "You must be logged in to write a review"}});
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
      this.router.navigate(['/error'], {state: {status: 403, reason: "You must be logged in to write a review"}});
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

    const sanitizedComment = this.sanitizeHtml(this.newReview.comment);
    reviewData.comment = sanitizedComment;

    this.reviewService.submitReview(reviewData).subscribe({
      next: (response) => {
        this.resetReviewForm();
        this.showReviewForm = false;
        this.userHasReview = true;
        this.loadRecipe();
        this.reviewsPage = 0;
        this.reviews = [];
        this.userReview = null;
        this.loadReviews();
      },
      error: (error) => {
        console.error('Error submitting review:', error);
      }
    });
  }

  loadReviews() {
    if (!this.recipe?.id) return;

    this.loadingReviews = true;
    this.reviewService.getReviewsByRecipeId(this.recipe.id, this.reviewsPage, this.reviewsPageSize).subscribe({
      next: (data) => {
        const newReviews = data.reviews || [];

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

        this.reviews = [...this.reviews, ...newReviews];
        this.hasMoreReviews = data.hasMore || false;
        this.loadingReviews = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.loadingReviews = false;
      }
    });
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete your review?')) {
      return;
    }

    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.userReview = null;
        this.userHasReview = false;
        this.loadRecipe();
        this.reviewsPage = 0;
        this.reviews = [];
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

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  sanitizeHtml(html: string): string {
    if (!html) return '';

    const temp = document.createElement('div');
    temp.innerHTML = html;

    const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li'];

    const cleanNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.cloneNode(false);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        if (!allowedTags.includes(tagName)) {
          const fragment = document.createDocumentFragment();
          Array.from(node.childNodes).forEach(child => {
            const cleanedChild = cleanNode(child);
            if (cleanedChild) fragment.appendChild(cleanedChild);
          });
          return fragment;
        }

        const cleanElement = document.createElement(tagName);

        Array.from(node.childNodes).forEach(child => {
          const cleanedChild = cleanNode(child);
          if (cleanedChild) cleanElement.appendChild(cleanedChild);
        });

        return cleanElement;
      }

      return null;
    };

    const cleanDiv = document.createElement('div');
    Array.from(temp.childNodes).forEach(child => {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) cleanDiv.appendChild(cleanedChild);
    });

    let sanitized = cleanDiv.innerHTML;

    sanitized = sanitized.replace(/<(\w+)>(\s|&nbsp;)*<\/\1>/gi, '');

    sanitized = sanitized.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');

    sanitized = sanitized.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '');

    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed\b[^<]*>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized.trim();
  }

  onCommentInput(event: Event) {
    const target = event.target as HTMLDivElement;
    this.selection = window.getSelection();
    const range = this.selection && this.selection.rangeCount > 0 ? this.selection.getRangeAt(0) : null;
    const startOffset = range?.startOffset || 0;
    const startContainer = range?.startContainer;

    this.newReview.comment = target.innerHTML;

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
      if (!res) res = ing.id == ingredient;
    });
    return res;
  }
}
