import {Component, OnInit, HostListener, ChangeDetectorRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {RecipeService} from '../../services/recipe.service';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Subject, takeUntil, forkJoin} from 'rxjs';
import {Ingredient} from '../../models/ingredient.model';
import {SessionService} from '../../services/session.service';
import {UserService} from '../../services/user.service';
import {IngredientService} from '../../services/ingredient.service';
import {IngredientIconService} from '../../services/ingredient-icon.service';
import {RecipeCollectionService} from '../../services/recipe-collection.service';
import {CollectionCardComponent} from '../shared/collection-card/collection-card.component';
import { TranslatorService } from '../../services/translator.service';
import {ThemeService} from '../../services/theme.service';

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  author: {
    name: string;
    avatar: string;
    id: string;
  };
  stats: {
    prepTime: number;
    servings: number;
    rating: number;
    reviews: number;
  };
  difficulty: string;
  category: string;
  tags: string[];
  cuisine: string;
  isLiked?: boolean;
}

interface User {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  isVerified: boolean;
  recipesCount: number;
  followersCount: number;
  averageRating: number;
  specialties: string[];
  isFollowing: boolean;
}

interface SearchFilters {
  query: string;
  mealTypes: string[];
  difficulties: number[];
  maxTime: number;
  healthLabels: string[];
  cuisines: string[];
  dishTypes: string[];
  dietLabels: string[];
  minRating: number;
  minCalories: number;
  maxCalories: number;
  minWeight: number;
  maxWeight: number;
  minPeople: number;
  maxPeople: number;
  sortBy: string;
  onlyUserIngredients: boolean;
}

interface UserFilters {
  query: string;
  minRecipes: number;
  minReviews: number;
  minCollections: number;
  sortBy: string;
}

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, CollectionCardComponent],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit {

  // Active tab management
  activeSearchTab: 'recipes' | 'ingredients' | 'collections' | 'users' = 'recipes';

  // User results and pagination
  userResults: any[] = [];
  totalUsers = 0;
  currentUserPage = 0;
  userPageSize = 9;
  userLoading = false;
  loadingMoreUsers = false;
  hasMoreUsers = true;
  recipeList: any[] = [];
  recipeLoading = false;
  loadingMore = false;
  totalRecipes = 0;
  currentRecipePage = 0;
  recipePageSize = 9;
  hasMoreRecipes = true;

  ingredients: Ingredient[] = [];
  ingredientResults: Ingredient[] = [];
  ingredientLoading = false;
  loadingMoreIngredients = false;
  currentIngredientPage = 0;
  ingredientPageSize = 12;
  hasMoreIngredients = true;
  userIngredients: Set<Ingredient> = new Set<Ingredient>();
  ingredientSearchQuery: string = '';

  collections: any[] = [];
  collectionLoading = false;
  currentUsername: string = '';

  currentCollectionPage: number = 0;
  collectionPageSize: number = 9;
  loadingMoreCollections: boolean = false;
  hasMoreCollections: boolean = true;
  totalCollections: number = 0;

  showViewCollectionModal: boolean = false;
  viewingCollection: any = null;
  viewModalClosing: boolean = false;
  collectionRecipesLimit: number = 4;

  showAddToCollectionDialog: boolean = false;
  selectedRecipeId?: number;
  favoritesCollection?: any;
  favoriteRecipeIds: Set<number> = new Set();

  animationClass: string = '';

  mealTypeCategories = [
    { name: 'Breakfast', value: 'Breakfast', count: 0 },
    { name: 'Brunch', value: 'Brunch', count: 0 },
    { name: 'Lunch/Dinner', value: 'Lunch/Dinner', count: 0 },
    { name: 'Snack', value: 'Snack', count: 0 },
    { name: 'Teatime', value: 'Teatime', count: 0 },
    { name: 'Dessert', value: 'Dessert', count: 0 },
    { name: 'Appetizer', value: 'Appetizer', count: 0 },
    { name: 'Beverage', value: 'Beverage', count: 0 }
  ];

  // Difficulty levels (1-5)
  difficultyLevels = [
    { value: 1, label: 'Very Easy' },
    { value: 2, label: 'Easy' },
    { value: 3, label: 'Medium' },
    { value: 4, label: 'Hard' },
    { value: 5, label: 'Very Hard' }
  ];

  cuisineTypes = ['World', 'American', 'Asian', 'British', 'Caribbean', 'Central Europe', 'Chinese',
    'Eastern Europe', 'French', 'Greek', 'Indian', 'Italian', 'Japanese', 'Korean', 'Kosher',
    'Mediterranean', 'Mexican', 'Middle Eastern', 'Nordic', 'South American', 'South East Asian',
    'Spanish'];

  mealTypes = ['Breakfast', 'Brunch', 'Lunch/Dinner', 'Snack', 'Teatime', 'Dessert', 'Appetizer', 'Beverage'];

  dishTypes = ['Alcohol Cocktail', 'Biscuits and Cookies', 'Bread', 'Cereals', 'Condiments and Sauces',
    'Desserts', 'Drinks', 'Egg', 'Ice Cream and Custard', 'Main Course', 'Pancake', 'Pasta',
    'Pastry', 'Pies and Tarts', 'Pizza', 'Preps', 'Preserve', 'Salad', 'Sandwiches', 'Seafood',
    'Side Dish', 'Snack', 'Soup', 'Special Occasions', 'Starter', 'Sweets'];

  dietLabels = ['Balanced', 'High-Fiber', 'High-Protein', 'Low-Carb', 'Low-Fat', 'Low-Sodium'];

  healthLabels = [
    'Alcohol-Cocktail', 'Alcohol-Free', 'Celery-Free', 'Crustacean-Free', 'Dairy-Free',
    'Egg-Free', 'Fish-Free', 'FODMAP-Free', 'Gluten-Free', 'Immuno-Supportive',
    'Keto-Friendly', 'Kidney-Friendly', 'Kosher', 'Low Potassium', 'Low Sugar',
    'Lupine-Free', 'Mediterranean', 'Mollusk-Free', 'Mustard-Free', 'No oil added',
    'Paleo', 'Peanut-Free', 'Pescatarian', 'Pork-Free', 'Red-Meat-Free',
    'Sesame-Free', 'Shellfish-Free', 'Soy-Free', 'Sugar-Conscious', 'Sulfite-Free',
    'Tree-Nut-Free', 'Vegan', 'Vegetarian', 'Wheat-Free'
  ];

  showCuisineDropdown: boolean = false;
  cuisineSearchTerm: string = '';

  showDishTypeDropdown: boolean = false;
  dishTypeSearchTerm: string = '';

  showDietLabelDropdown: boolean = false;
  dietLabelSearchTerm: string = '';

  showHealthLabelDropdown: boolean = false;
  healthLabelSearchTerm: string = '';

  isAuthenticated = false;

  Math = Math;

  searchQuery: string = '';
  activeQuickFilter: string = 'popular';
  viewMode: 'grid' | 'list' = 'grid';
  ingredientViewMode: 'grid' | 'list' = 'grid';
  collectionViewMode: 'grid' | 'list' = 'grid';
  userViewMode: 'grid' | 'list' = 'grid';
  showSortDropdown: boolean = false;
  showCollectionSortDropdown: boolean = false;

  responsive: boolean = window.innerWidth < 1024;

  isQuickFiltersExpanded: boolean = !this.responsive;
  isFiltersExpanded: boolean = !this.responsive;
  isUserFiltersExpanded: boolean = !this.responsive;

  sortingOptions = [
    { value: 'date_desc', label: 'sort_newest', icon: 'clock-down' },
    { value: 'date_asc', label: 'sort_oldest', icon: 'clock-up' },
    { value: 'rating_desc', label: 'sort_best_rated', icon: 'message-circle-down' },
    { value: 'rating_asc', label: 'sort_worst_rated', icon: 'message-circle-up' },
    { value: 'difficulty_asc', label: 'sort_easiest', icon: 'sort-descending-shapes' },
    { value: 'difficulty_desc', label: 'sort_hardest', icon: 'sort-ascending-shapes' },
    { value: 'time_asc', label: 'sort_shortest_time', icon: 'sort-ascending-numbers' },
    { value: 'time_desc', label: 'sort_longest_time', icon: 'sort-descending-numbers' },
  ];

  collectionSortOptions = [
    { value: 'createdAt', label: 'sort_newest', icon: 'ti-clock' },
    { value: 'title', label: 'sort_title_az', icon: 'ti-sort-ascending-letters' },
    { value: 'recipeCount', label: 'sort_most_recipes', icon: 'ti-chef-hat' }
  ];

  userSortOptions = [
    { value: 'createdAt', label: 'sort_newest', icon: 'ti-clock' },
    { value: 'username', label: 'sort_username_az', icon: 'ti-sort-ascending-letters' },
  ];

  showUserSortDropdown: boolean = false;

  filters: SearchFilters = {
    query: '',
    mealTypes: [],
    difficulties: [],
    maxTime: 300,
    healthLabels: [],
    cuisines: [],
    dishTypes: [],
    dietLabels: [],
    minRating: 0,
    minCalories: 0,
    maxCalories: 10000,
    minWeight: 0,
    maxWeight: 20000,
    minPeople: 1,
    maxPeople: 20,
    sortBy: 'mostPopular',
    onlyUserIngredients: false
  };

  minTime: number = 0;

  userFilters: UserFilters = {
    query: '',
    minRecipes: 0,
    minReviews: 0,
    minCollections: 0,
    sortBy: 'createdAt'
  };

  logos: Map<string, string> = new Map();

  ingredientSearchHasMore: boolean = false;
  ingredientSearchLoading: boolean = false;

  collectionSortBy: string = 'createdAt';
  totalIngredients: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private themeService: ThemeService,
    private recipeService: RecipeService,
    private userService: UserService,
    private ingredientService: IngredientService,
    private ingredientIconService: IngredientIconService,
    private collectionService: RecipeCollectionService,
    private cdr: ChangeDetectorRef,
    public translatorService: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.logos = this.themeService.getLogos();


    this.loadMealTypeCounts();

    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      if (mode && ['recipes', 'ingredients', 'collections', 'users'].includes(mode)) {
        this.activeSearchTab = mode as 'recipes' | 'ingredients' | 'collections' | 'users';
      }

      const query = params['q'];
      if (query) {
        this.searchQuery = query;
        this.filters.query = query;
        this.userFilters.query = query;
        this.ingredientSearchQuery = query;
      }
    });

    if (this.activeSearchTab === 'recipes') {
      this.clearFilters();
    } else if (this.activeSearchTab === 'users') {
      this.applyUserFilters();
    } else if (this.activeSearchTab === 'ingredients') {
      this.loadIngredients();
    } else if (this.activeSearchTab === 'collections') {
      this.sessionService.getLoggedUser().pipe(
        takeUntil(new Subject<void>())
      ).subscribe({
        next: user => {
          if (user?.username) {
            this.currentUsername = user.username;
          }
        }
      });
    }

    this.sessionService.getLoggedUser().pipe(
      takeUntil(new Subject<void>())
    ).subscribe({
      next: user => {
        if (!user) {
          this.isAuthenticated = false;
          return;
        }
        this.isAuthenticated = true;
        this.currentUsername = user.username;

        if (this.activeSearchTab === 'ingredients') {
          this.loadUserIngredients();
        }

        this.loadFavoritesCollection();
      },
      error: (err) => {
        this.router.navigate(['/error'], {state: {status: err.status, reason: err.message}});
      }
    });

    if (this.activeSearchTab === 'collections') {
      this.performSearch();
    }

    this.updateSortingLabels();
  }

  loadMealTypeCounts(): void {
    this.mealTypeCategories.forEach(category => {
      this.recipeService.getRecipeCountByMealType(category.value).subscribe({
        next: (data: any) => {
          category.count = data.count;
        },
        error: (error) => {
          console.error(`Error loading count for ${category.value}:`, error);
          category.count = 0;
        }
      });
    });
  }

  setActiveTab(tab: 'recipes' | 'ingredients' | 'collections' | 'users'): void {
    const tabOrder = ['recipes', 'ingredients', 'collections', 'users'];
    const currentIndex = tabOrder.indexOf(this.activeSearchTab);
    const newIndex = tabOrder.indexOf(tab);

    const newAnimationClass = newIndex > currentIndex ? 'slideright' : 'slideleft';

    this.animationClass = '';
    this.cdr.detectChanges();

    setTimeout(() => {
      this.animationClass = newAnimationClass;
      this.cdr.detectChanges();
    }, 10);

    this.activeSearchTab = tab;

    const queryParams: any = { mode: tab };
    if (this.searchQuery) {
      queryParams.q = this.searchQuery;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });

    if (tab === 'recipes' && this.searchQuery) {
      this.clearFilters();
      this.applyRecipeFilters();
    } else if (tab === 'users') {
      this.applyUserFilters();
    } else if (tab === 'ingredients') {
      this.loadIngredients();
    } else if (tab === 'collections') {
      this.performSearch();
    }
  }

  clearFilters(): void {
    this.filters = {
      query: '',
      mealTypes: [],
      difficulties: [],
      maxTime: 300,
      healthLabels: [],
      cuisines: [],
      dishTypes: [],
      dietLabels: [],
      minRating: 0,
      minCalories: 0,
      maxCalories: 10000,
      minWeight: 0,
      maxWeight: 20000,
      minPeople: 1,
      maxPeople: 20,
      sortBy: 'mostPopular',
      onlyUserIngredients: false
    };
    this.minTime = 0;
    this.activeQuickFilter = '';
    this.applyRecipeFilters();
  }

  applyManualFilters(): void {
    this.activeQuickFilter = '';
    this.applyRecipeFilters();
  }

  applyRecipeFilters(): void {
    this.recipeLoading = true;
    this.currentRecipePage = 0;
    this.recipeList = [];

    const actualMinTime = Math.min(this.minTime, this.filters.maxTime);
    const actualMaxTime = Math.max(this.minTime, this.filters.maxTime);

    const actualMinCalories = Math.min(this.filters.minCalories, this.filters.maxCalories);
    const actualMaxCalories = Math.max(this.filters.minCalories, this.filters.maxCalories);

    const actualMinWeight = Math.min(this.filters.minWeight, this.filters.maxWeight);
    const actualMaxWeight = Math.max(this.filters.minWeight, this.filters.maxWeight);

    const actualMinPeople = Math.min(this.filters.minPeople, this.filters.maxPeople);
    const actualMaxPeople = Math.max(this.filters.minPeople, this.filters.maxPeople);

    const filterParams = {
      query: this.filters.query || undefined,
      cuisines: this.filters.cuisines.length > 0 ? this.filters.cuisines : undefined,
      mealTypes: this.filters.mealTypes.length > 0 ? this.filters.mealTypes : undefined,
      dishTypes: this.filters.dishTypes.length > 0 ? this.filters.dishTypes : undefined,
      dietLabels: this.filters.dietLabels.length > 0 ? this.filters.dietLabels : undefined,
      healthLabels: this.filters.healthLabels.length > 0 ? this.filters.healthLabels : undefined,
      difficulties: this.filters.difficulties.length > 0 ? this.filters.difficulties : undefined,
      minRating: this.filters.minRating > 0 ? this.filters.minRating : undefined,
      minTime: actualMinTime > 0 || actualMaxTime < 300 ? actualMinTime : undefined,
      maxTime: actualMinTime > 0 || actualMaxTime < 300 ? actualMaxTime : undefined,
      minCalories: actualMinCalories > 0 || actualMaxCalories < 10000 ? actualMinCalories : undefined,
      maxCalories: actualMinCalories > 0 || actualMaxCalories < 10000 ? actualMaxCalories : undefined,
      minWeight: actualMinWeight > 0 || actualMaxWeight < 20000 ? actualMinWeight : undefined,
      maxWeight: actualMinWeight > 0 || actualMaxWeight < 20000 ? actualMaxWeight : undefined,
      minPeople: actualMinPeople > 1 || actualMaxPeople < 20 ? actualMinPeople : undefined,
      maxPeople: actualMinPeople > 1 || actualMaxPeople < 20 ? actualMaxPeople : undefined,
      sortBy: this.filters.sortBy,
      onlyUserIngredients: this.filters.onlyUserIngredients
    };

    this.recipeService.getFilteredRecipes(filterParams, this.currentRecipePage, this.recipePageSize).subscribe({
      next: (result) => {
        this.recipeList = result.recipes;
        this.totalRecipes = result.total;
        this.hasMoreRecipes = this.recipeList.length < this.totalRecipes;
        this.recipeLoading = false;
      },
      error: (error) => {
        console.error('Error applying filters:', error);
        this.recipeLoading = false;
      }
    });
  }

  loadMoreRecipes(): void {
    if (this.loadingMore || !this.hasMoreRecipes) {
      return;
    }

    this.loadingMore = true;
    this.currentRecipePage++;

    const actualMinTime = Math.min(this.minTime, this.filters.maxTime);
    const actualMaxTime = Math.max(this.minTime, this.filters.maxTime);

    const actualMinCalories = Math.min(this.filters.minCalories, this.filters.maxCalories);
    const actualMaxCalories = Math.max(this.filters.minCalories, this.filters.maxCalories);

    const actualMinWeight = Math.min(this.filters.minWeight, this.filters.maxWeight);
    const actualMaxWeight = Math.max(this.filters.minWeight, this.filters.maxWeight);

    const actualMinPeople = Math.min(this.filters.minPeople, this.filters.maxPeople);
    const actualMaxPeople = Math.max(this.filters.minPeople, this.filters.maxPeople);

    const filterParams = {
      query: this.filters.query || undefined,
      cuisines: this.filters.cuisines.length > 0 ? this.filters.cuisines : undefined,
      mealTypes: this.filters.mealTypes.length > 0 ? this.filters.mealTypes : undefined,
      dishTypes: this.filters.dishTypes.length > 0 ? this.filters.dishTypes : undefined,
      dietLabels: this.filters.dietLabels.length > 0 ? this.filters.dietLabels : undefined,
      healthLabels: this.filters.healthLabels.length > 0 ? this.filters.healthLabels : undefined,
      difficulties: this.filters.difficulties.length > 0 ? this.filters.difficulties : undefined,
      minRating: this.filters.minRating > 0 ? this.filters.minRating : undefined,
      minTime: actualMinTime > 0 || actualMaxTime < 300 ? actualMinTime : undefined,
      maxTime: actualMinTime > 0 || actualMaxTime < 300 ? actualMaxTime : undefined,
      minCalories: actualMinCalories > 0 || actualMaxCalories < 10000 ? actualMinCalories : undefined,
      maxCalories: actualMinCalories > 0 || actualMaxCalories < 10000 ? actualMaxCalories : undefined,
      minWeight: actualMinWeight > 0 || actualMaxWeight < 20000 ? actualMinWeight : undefined,
      maxWeight: actualMinWeight > 0 || actualMaxWeight < 20000 ? actualMaxWeight : undefined,
      minPeople: actualMinPeople > 1 || actualMaxPeople < 20 ? actualMinPeople : undefined,
      maxPeople: actualMinPeople > 1 || actualMaxPeople < 20 ? actualMaxPeople : undefined,
      sortBy: this.filters.sortBy,
      onlyUserIngredients: this.filters.onlyUserIngredients
    };

    this.recipeService.getFilteredRecipes(filterParams, this.currentRecipePage, this.recipePageSize).subscribe({
      next: (result) => {
        this.recipeList = [...this.recipeList, ...result.recipes];
        this.totalRecipes = result.total;
        this.hasMoreRecipes = this.recipeList.length < this.totalRecipes;
        this.loadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more recipes:', error);
        this.loadingMore = false;
      }
    });
  }

  fetchRecipes(): void {
    this.recipeService.getRecipes(1).subscribe({
      next: (recipes) => {
        this.recipeList = recipes;
      },
      error: (error) => {
        console.error('Error fetching recipes:', error);
      }
    });
  }

  viewRecipe(id: number) {
    this.router.navigate(['recipes', id]);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.multiselect-dropdown-container')) {
      this.closeAllDropdowns();
    }
    if (!target.closest('.sort-dropdown-container')) {
      this.showSortDropdown = false;
      this.showUserSortDropdown = false;
    }
  }

  closeAllDropdowns(): void {
    this.showCuisineDropdown = false;
    this.showDishTypeDropdown = false;
    this.showDietLabelDropdown = false;
    this.showHealthLabelDropdown = false;
  }

  toggleCuisineDropdown(): void {
    const wasOpen = this.showCuisineDropdown;
    this.closeAllDropdowns();
    this.showCuisineDropdown = !wasOpen;
  }

  getFilteredCuisineOptions(): string[] {
    if (!this.cuisineSearchTerm) return this.cuisineTypes;
    return this.cuisineTypes.filter(option =>
      option.toLowerCase().includes(this.cuisineSearchTerm.toLowerCase())
    );
  }

  toggleCuisine(type: string): void {
    const index = this.filters.cuisines.indexOf(type);
    if (index > -1) {
      this.filters.cuisines.splice(index, 1);
    } else {
      this.filters.cuisines.push(type);
    }
  }

  isCuisineSelected(type: string): boolean {
    return this.filters.cuisines.includes(type);
  }

  removeCuisine(item: string): void {
    this.filters.cuisines = this.filters.cuisines.filter(i => i !== item);
  }

  toggleDishTypeDropdown(): void {
    const wasOpen = this.showDishTypeDropdown;
    this.closeAllDropdowns();
    this.showDishTypeDropdown = !wasOpen;
  }

  getFilteredDishTypeOptions(): string[] {
    if (!this.dishTypeSearchTerm) return this.dishTypes;
    return this.dishTypes.filter(option =>
      option.toLowerCase().includes(this.dishTypeSearchTerm.toLowerCase())
    );
  }

  toggleDishType(type: string): void {
    const index = this.filters.dishTypes.indexOf(type);
    if (index > -1) {
      this.filters.dishTypes.splice(index, 1);
    } else {
      this.filters.dishTypes.push(type);
    }
  }

  isDishTypeSelected(type: string): boolean {
    return this.filters.dishTypes.includes(type);
  }

  removeDishType(item: string): void {
    this.filters.dishTypes = this.filters.dishTypes.filter(i => i !== item);
  }

  toggleDietLabelDropdown(): void {
    const wasOpen = this.showDietLabelDropdown;
    this.closeAllDropdowns();
    this.showDietLabelDropdown = !wasOpen;
  }

  getFilteredDietLabelOptions(): string[] {
    if (!this.dietLabelSearchTerm) return this.dietLabels;
    return this.dietLabels.filter(option =>
      option.toLowerCase().includes(this.dietLabelSearchTerm.toLowerCase())
    );
  }

  toggleDietLabel(label: string): void {
    const index = this.filters.dietLabels.indexOf(label);
    if (index > -1) {
      this.filters.dietLabels.splice(index, 1);
    } else {
      this.filters.dietLabels.push(label);
    }
  }

  isDietLabelSelected(label: string): boolean {
    return this.filters.dietLabels.includes(label);
  }

  removeDietLabel(item: string): void {
    this.filters.dietLabels = this.filters.dietLabels.filter(i => i !== item);
  }

  toggleHealthLabelDropdown(): void {
    const wasOpen = this.showHealthLabelDropdown;
    this.closeAllDropdowns();
    this.showHealthLabelDropdown = !wasOpen;
  }

  getFilteredHealthLabelOptions(): string[] {
    if (!this.healthLabelSearchTerm) return this.healthLabels;
    return this.healthLabels.filter(option =>
      option.toLowerCase().includes(this.healthLabelSearchTerm.toLowerCase())
    );
  }

  toggleHealthLabel(label: string): void {
    const index = this.filters.healthLabels.indexOf(label);
    if (index > -1) {
      this.filters.healthLabels.splice(index, 1);
    } else {
      this.filters.healthLabels.push(label);
    }
  }

  isHealthLabelSelected(label: string): boolean {
    return this.filters.healthLabels.includes(label);
  }

  removeHealthLabel(item: string): void {
    this.filters.healthLabels = this.filters.healthLabels.filter(i => i !== item);
  }

  // Meal Type/category
  toggleMealType(value: string): void {
    const index = this.filters.mealTypes.indexOf(value);
    if (index > -1) {
      this.filters.mealTypes.splice(index, 1);
    } else {
      this.filters.mealTypes.push(value);
    }
  }

  isMealTypeSelected(value: string): boolean {
    return this.filters.mealTypes.includes(value);
  }

  // Difficulty
  toggleDifficulty(value: number): void {
    const index = this.filters.difficulties.indexOf(value);
    if (index > -1) {
      this.filters.difficulties.splice(index, 1);
    } else {
      this.filters.difficulties.push(value);
    }
  }

  isDifficultySelected(value: number): boolean {
    return this.filters.difficulties.includes(value);
  }

  performSearch(): void {
    this.filters.query = this.searchQuery.trim();
    this.userFilters.query = this.searchQuery.trim();
    this.ingredientSearchQuery = this.searchQuery.trim();

    const queryParams: any = { mode: this.activeSearchTab };
    if (this.searchQuery.trim()) {
      queryParams.q = this.searchQuery.trim();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });

    if (this.activeSearchTab === 'recipes') {
      this.currentRecipePage = 0;
      this.applyRecipeFilters();
    } else if (this.activeSearchTab === 'users') {
      this.currentUserPage = 0;
      this.applyUserFilters();
    } else if (this.activeSearchTab === 'ingredients') {
      this.ingredientSearchLoading = true;
      this.currentIngredientPage = 0;
      this.ingredientService.searchIngredients(this.ingredientSearchQuery, this.currentIngredientPage, this.ingredientPageSize).subscribe({
        next: (result: any) => {
          this.ingredientResults = (result.content || []).map((element: Ingredient) => {
            element.icon = this.ingredientIconService.getIconForIngredient(element.food);
            element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
            return element;
          });
          this.ingredientSearchHasMore = !result.last;
          try { this.cdr.detectChanges(); } catch(e) { }
          this.ingredientSearchLoading = false;
        },
        error: (error) => {
          this.ingredientResults = [];
          this.ingredientSearchHasMore = false;
          this.ingredientSearchLoading = false;
        }
      });
    } else if (this.activeSearchTab === 'collections') {
      this.currentCollectionPage = 0;
      this.collections = [];
      this.collectionLoading = true;
      this.hasMoreCollections = true;
      this.collectionService.searchCollectionsPaged(this.searchQuery ? this.searchQuery.trim() : null, this.currentCollectionPage, this.collectionPageSize).subscribe({
        next: (result: any) => {
          this.collections = result.content || [];
          this.totalCollections = result.total || 0;
          this.hasMoreCollections = !result.last;
          this.collectionLoading = false;
        },
        error: (error) => {
          console.error('Error searching collections:', error);
          this.collections = [];
          this.totalCollections = 0;
          this.hasMoreCollections = false;
          this.collectionLoading = false;
        }
      });
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filters.query = '';
    this.userFilters.query = '';
    this.ingredientSearchQuery = '';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: this.activeSearchTab, q: '' },
      queryParamsHandling: 'merge'
    });

    if (this.activeSearchTab === 'recipes') {
      this.currentRecipePage = 0;
      this.applyRecipeFilters();
    } else if (this.activeSearchTab === 'users') {
      this.currentUserPage = 0;
      this.applyUserFilters();
    } else if (this.activeSearchTab === 'collections') {
      this.currentCollectionPage = 0;
      this.applyCollectionFilters();
    } else if (this.activeSearchTab === 'ingredients') {
      this.ingredientSearchLoading = true;
      this.currentIngredientPage = 0;
      this.applyIngredientFilters();
    }
  }

  applyQuickFilter(filterType: string): void {
    if (this.activeQuickFilter === filterType) {
      this.activeQuickFilter = '';
      this.resetQuickFilterCriteria();
      this.clearFilters();
    } else {
      this.resetQuickFilterCriteria();
      this.clearFilters();
      this.activeQuickFilter = filterType;

      switch(filterType) {
        case 'popular':
          this.filters.sortBy = 'mostPopular';
          this.filters.minRating = 4;
          break;
        case 'quick':
          this.minTime = 0;
          this.filters.maxTime = 60;
          break;
        case 'healthy':
          this.filters.maxCalories = 600;
          this.filters.healthLabels = ['Low Sugar', 'Low Fat', 'Low Sodium'];
          break;
        case 'traditional':
          this.filters.cuisines = ['Italian', 'French', 'Spanish', 'Greek', 'Turkish', 'Middle Eastern'];
          break;
        case 'easy':
          this.filters.difficulties = [1, 2];
          break;
      }


      this.currentRecipePage = 0;
      this.applyRecipeFilters();
    }
  }

  resetQuickFilterCriteria(): void {
    this.filters.sortBy = 'mostPopular';
    this.filters.minRating = 0;
    this.minTime = 0;
    this.filters.maxTime = 180;
    this.filters.maxCalories = 5000;
    this.filters.healthLabels = [];
    this.filters.cuisines = [];
    this.filters.difficulties = [];
    this.filters.minPeople = 1;
    this.filters.maxPeople = 12;
  }

  toggleViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  toggleIngredientViewMode(mode: 'grid' | 'list'): void {
    this.ingredientViewMode = mode;
  }

  toggleUserViewMode(mode: 'grid' | 'list'): void {
    this.userViewMode = mode;
  }

  toggleSortDropdown(): void {
    this.showSortDropdown = !this.showSortDropdown;
  }

  toggleCollectionSortDropdown(): void {
    this.showCollectionSortDropdown = !this.showCollectionSortDropdown;
  }

  changeSortOrder(sortValue: string): void {
    let backendSortBy = sortValue;
    switch (sortValue) {
      case 'mostPopular':
        backendSortBy = 'mostPopular';
        break;
      case 'highestRated':
        backendSortBy = 'highestRated';
        break;
      case 'recentlyUpdated':
        backendSortBy = 'recentlyUpdated';
        break;
      case 'alphabetical':
        backendSortBy = 'alphabetical';
        break;
      default:
        backendSortBy = sortValue;
    }
    this.filters.sortBy = backendSortBy;
    this.showSortDropdown = false;
    this.currentRecipePage = 0;
    this.applyRecipeFilters();
  }

  changeCollectionSortOrder(sortValue: string): void {
    this.collectionSortBy = sortValue;
    this.showCollectionSortDropdown = false;
    this.currentCollectionPage = 0;
    this.collections = [];
    this.collectionLoading = true;
    this.hasMoreCollections = true;
    this.collectionService.searchCollectionsPaged(
      this.searchQuery ? this.searchQuery.trim() : null,
      this.currentCollectionPage,
      this.collectionPageSize,
      this.collectionSortBy
    ).subscribe({
      next: (result: any) => {
        this.collections = result.content || [];
        this.totalCollections = result.total || 0;
        this.hasMoreCollections = !result.last;
        this.collectionLoading = false;
      },
      error: (error) => {
        this.collections = [];
        this.totalCollections = 0;
        this.hasMoreCollections = false;
        this.collectionLoading = false;
      }
    });
  }

  getCurrentSortLabel(): string {
    const option = this.sortingOptions.find(opt => opt.value === this.filters.sortBy);
    return option ? this.translatorService.translate(option.label) : this.translatorService.translate('sort_by');
  }

  getCurrentCollectionSortLabel(): string {
    const option = this.collectionSortOptions.find((opt: { value: string; label: string }) => opt.value === this.collectionSortBy);
    return option ? this.translatorService.translate(option.label) : this.translatorService.translate('sort_by');
  }

  getCurrentUserSortLabel(): string {
    const option = this.userSortOptions.find((opt: { value: string; label: string }) => opt.value === this.userFilters.sortBy);
    return option ? this.translatorService.translate(option.label) : this.translatorService.translate('sort_by');
  }

  applyUserFilters(): void {
    this.userLoading = true;
    this.currentUserPage = 0;
    this.userResults = [];

    const filterParams: any = {};

    if (this.userFilters.query) filterParams.query = this.userFilters.query;
    if (this.userFilters.minRecipes > 0) filterParams.minRecipes = this.userFilters.minRecipes;
    if (this.userFilters.minReviews > 0) filterParams.minReviews = this.userFilters.minReviews;
    if (this.userFilters.minCollections > 0) filterParams.minCollections = this.userFilters.minCollections;
    if (this.userFilters.sortBy) filterParams.sortBy = this.userFilters.sortBy;

    this.userService.filterUsers(filterParams, this.currentUserPage, this.userPageSize).subscribe({
      next: (result) => {
        this.userResults = result.users;
        this.totalUsers = result.total;
        this.hasMoreUsers = this.userResults.length < this.totalUsers;
        this.userLoading = false;
      },
      error: (error) => {
        console.error('Error applying user filters:', error);
        this.userLoading = false;
      }
    });
  }

  loadMoreUsers(): void {
    if (this.loadingMoreUsers || !this.hasMoreUsers) {
      return;
    }

    this.loadingMoreUsers = true;
    this.currentUserPage++;

    const filterParams: any = {};

    if (this.userFilters.query) filterParams.query = this.userFilters.query;
    if (this.userFilters.minRecipes > 0) filterParams.minRecipes = this.userFilters.minRecipes;
    if (this.userFilters.minReviews > 0) filterParams.minReviews = this.userFilters.minReviews;
    if (this.userFilters.minCollections > 0) filterParams.minCollections = this.userFilters.minCollections;
    if (this.userFilters.sortBy) filterParams.sortBy = this.userFilters.sortBy;

    this.userService.filterUsers(filterParams, this.currentUserPage, this.userPageSize).subscribe({
      next: (result) => {
        this.userResults = [...this.userResults, ...result.users];
        this.totalUsers = result.total;
        this.hasMoreUsers = this.userResults.length < this.totalUsers;
        this.loadingMoreUsers = false;
      },
      error: (error) => {
        console.error('Error loading more users:', error);
        this.loadingMoreUsers = false;
      }
    });
  }

  clearUserFilters(): void {
    this.userFilters = {
      query: '',
      minRecipes: 0,
      minReviews: 0,
      minCollections: 0,
      sortBy: 'createdAt'
    };
    this.applyUserFilters();
  }

  viewProfile(username: string): void {
    this.router.navigate(['/users', username]);
  }

  toggleUserSortDropdown(): void {
    this.showUserSortDropdown = !this.showUserSortDropdown;
  }

  changeUserSortOrder(sortValue: string): void {
    this.userFilters.sortBy = sortValue;
    this.showUserSortDropdown = false;
    this.applyUserFilters();
  }

  loadIngredients(): void {
    this.ingredientLoading = true;
    this.ingredientService.getPagedIngredients(this.currentIngredientPage, this.ingredientPageSize).subscribe({
      next: (data) => {
        data.content.forEach((element: Ingredient) => {
          element.icon = this.ingredientIconService.getIconForIngredient(element.food);
          element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
          this.totalIngredients = data.totalElements;
          this.ingredients.push(element);
        });
        this.hasMoreIngredients = !data.last;

        this.ingredientResults = [...this.ingredients];
        try { this.cdr.detectChanges(); } catch(e) {  }
        this.ingredientLoading = false;
        this.ingredientSearchHasMore = this.hasMoreIngredients;
        this.ingredientSearchLoading = this.ingredientLoading;
      },
      error: (error) => {
        console.error('Error loading ingredients:', error);
        this.ingredientLoading = false;
        this.ingredientSearchLoading = this.ingredientLoading;
      }
    });
  }

  loadMoreIngredients(): void {
    if (this.loadingMoreIngredients || !this.hasMoreIngredients) return;
    this.loadingMoreIngredients = true;
    this.currentIngredientPage++;

    this.ingredientService.getPagedIngredients(this.currentIngredientPage, this.ingredientPageSize).subscribe({
      next: (data) => {
        data.content.forEach((element: Ingredient) => {
          element.icon = this.ingredientIconService.getIconForIngredient(element.food);
          element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
          this.ingredients.push(element);
        });
        this.hasMoreIngredients = !data.last;
        this.ingredientResults = [...this.ingredients];
        try { this.cdr.detectChanges(); } catch(e) { }
        this.loadingMoreIngredients = false;
        this.ingredientSearchHasMore = this.hasMoreIngredients;
        this.ingredientSearchLoading = this.loadingMoreIngredients;
      },
      error: (error) => {
        console.error('Error loading more ingredients:', error);
        this.loadingMoreIngredients = false;
        this.ingredientSearchLoading = this.loadingMoreIngredients;
      }
    });
  }

  loadMoreIngredientResults() {
    this.loadMoreIngredients();
  }

  loadUserIngredients(): void {
    this.sessionService.getLoggedUser().pipe(
      takeUntil(new Subject<void>())
    ).subscribe({
      next: user => {
        if (!user?.username) return;

        this.userService.getUserIngredients(user.username).subscribe({
          next: (ingredients: Ingredient[]) => {
            this.userIngredients.clear();
            ingredients.forEach(element => {
              element.icon = this.ingredientIconService.getIconForIngredient(element.food);
              element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
              this.userIngredients.add(element);
            });
          },
          error: (error) => {
            console.error('Error loading user ingredients:', error);
          }
        });
      }
    });
  }

  addToPantry(ingredient: Ingredient): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/error'], {state: {status: 403, reason: "You must be logged in to add ingredients to your pantry."}});
      return;
    }

    if (this.hasIngredient(ingredient)) return;

    this.userService.addIngredient(ingredient).subscribe({
      next: () => {
        ingredient.isItOwned = true;
        this.userIngredients.add(ingredient);
      },
      error: (error) => {
        console.error('Error adding ingredient to pantry:', error);
      }
    });
  }

  hasIngredient(ingredient: Ingredient): boolean {
    return Array.from(this.userIngredients).some(i => i.id === ingredient.id);
  }

  loadUserCollections(): void {
    this.sessionService.getLoggedUser().pipe(
      takeUntil(new Subject<void>())
    ).subscribe({
      next: user => {
        if (!user?.username) {
          this.collectionLoading = false;
          return;
        }

        this.currentUsername = user.username;
        this.collectionLoading = true;

        this.currentCollectionPage = 0;
        this.collections = [];
        this.collectionService.searchCollectionsPaged(null, this.currentCollectionPage, this.collectionPageSize).subscribe({
          next: (result: any) => {
            this.collections = result.content || [];
            this.totalCollections = result.total || 0;
            this.hasMoreCollections = !result.last;
            this.collectionLoading = false;
          },
          error: (error) => {
            console.error('Error loading user collections:', error);
            this.collections = [];
            this.totalCollections = 0;
            this.hasMoreCollections = false;
            this.collectionLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading user collections:', error);
        this.collectionLoading = false;
      }
    });
  }

  openViewCollectionModal(collection: any): void {
    this.viewingCollection = collection;
    this.showViewCollectionModal = true;
    document.getElementsByTagName("html")[0].style.overflow = 'hidden';
    this.viewModalClosing = false;
    this.collectionRecipesLimit = 4;
  }

  closeViewCollectionModal(): void {
    this.viewModalClosing = true;
    setTimeout(() => {
      this.showViewCollectionModal = false;
      this.viewingCollection = null;
      this.viewModalClosing = false;
      this.collectionRecipesLimit = 4;
    }, 300);
  }

  getVisibleCollectionRecipes(): any[] {
    if (!this.viewingCollection?.recipes) return [];
    return this.viewingCollection.recipes.slice(0, this.collectionRecipesLimit);
  }

  hasMoreCollectionRecipes(): boolean {
    if (!this.viewingCollection?.recipes) return false;
    return this.viewingCollection.recipes.length > this.collectionRecipesLimit;
  }

  getRemainingCollectionRecipes(): number {
    if (!this.viewingCollection?.recipes) return 0;
    return this.viewingCollection.recipes.length - this.collectionRecipesLimit;
  }

  loadMoreCollectionRecipes(event: Event): void {
    event.stopPropagation();
    this.collectionRecipesLimit += 4;
  }

  loadMoreCollections(): void {
    if (this.loadingMoreCollections || !this.hasMoreCollections) return;
    this.loadingMoreCollections = true;
    this.currentCollectionPage++;

    this.collectionService.searchCollectionsPaged(this.searchQuery ? this.searchQuery.trim() : null, this.currentCollectionPage, this.collectionPageSize).subscribe({
      next: (result: any) => {
        const items = result.content || [];
        this.collections = [...this.collections, ...items];
        this.totalCollections = result.total || this.totalCollections;
        this.hasMoreCollections = !result.last;
        this.loadingMoreCollections = false;
      },
      error: (error) => {
        console.error('Error loading more collections:', error);
        this.loadingMoreCollections = false;
      }
    });
  }

  navigateToRecipeFromCollection(recipeId: number): void {
    this.closeViewCollectionModal();
    setTimeout(() => {
      this.router.navigate(['/recipes', recipeId]);
    }, 300);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  loadFavoritesCollection(): void {
    if (!this.sessionService.currentUser) return;

    forkJoin({
      collection: this.collectionService.getFavoritesCollection(this.sessionService.currentUser.username),
      ids: this.collectionService.getFavoriteRecipeIds(this.sessionService.currentUser.username)
    }).subscribe({
      next: (result) => {
        this.favoritesCollection = result.collection;
        this.favoriteRecipeIds.clear();
        result.ids.forEach(id => this.favoriteRecipeIds.add(id));
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
      }
    });
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
        error: (error) => {
          console.error('Error loading favorites:', error);
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
        error: (error) => {
          console.error('Error removing from favorites:', error);
        }
      });
    } else {
      this.collectionService.addRecipeToCollection(this.favoritesCollection.id, recipeId).subscribe({
        next: () => {
          this.favoriteRecipeIds.add(recipeId);
        },
        error: (error) => {
          console.error('Error adding to favorites:', error);
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
  }

  closeAddToCollection(): void {
    this.showAddToCollectionDialog = false;
    this.selectedRecipeId = undefined;
  }

  onRecipeAddedToCollection(): void {
    this.closeAddToCollection();
  }

  isRecipeInFavorites(recipeId: number): boolean {
    return this.favoriteRecipeIds.has(recipeId);
  }

  private applyCollectionFilters() {
    this.collections = [];
    this.collectionLoading = true;
    this.hasMoreCollections = true;
    this.collectionService.searchCollectionsPaged(null, this.currentCollectionPage, this.collectionPageSize).subscribe({
      next: (result: any) => {
        this.collections = result.content || [];
        this.totalCollections = result.total || 0;
        this.hasMoreCollections = !result.last;
        this.collectionLoading = false;
      },
      error: (err) => {
        console.error('Error clearing collection search:', err);
        this.collections = [];
        this.totalCollections = 0;
        this.hasMoreCollections = false;
        this.collectionLoading = false;
      }
    });
  }

  private applyIngredientFilters() {
    this.ingredientService.searchIngredients('', this.currentIngredientPage, this.ingredientPageSize).subscribe({
      next: (result: any) => {
        this.ingredientResults = (result.content || []).map((element: Ingredient) => {
          element.icon = this.ingredientIconService.getIconForIngredient(element.food);
          element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
          return element;
        });
        this.ingredientSearchHasMore = !result.last;
        this.ingredientSearchLoading = false;
        try { this.cdr.detectChanges(); } catch(e) { }
      },
      error: (error) => {
        this.ingredientResults = [];
        this.ingredientSearchHasMore = false;
        this.ingredientSearchLoading = false;
      }
    });
  }

  toggleCollectionViewMode(mode: any) {
    this.collectionViewMode = mode;
  }

  navigateToUser(username: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/users', username]);
  }

  updateSortingLabels() {
    this.sortingOptions = [
      { value: 'newest', label: this.t('sort_newest'), icon: 'clock-up' },
      { value: 'oldest', label: this.t('sort_oldest'), icon: 'clock-down' },
      { value: 'rating', label: this.t('sort_rating'), icon: 'message-circle-up' },
      { value: 'difficulty', label: this.t('sort_difficulty'), icon: 'sort-descending-shapes' },
      { value: 'preptime', label: this.t('sort_preptime'), icon: 'sort-ascending-numbers' },
      { value: 'servings', label: this.t('sort_servings'), icon: 'tools-kitchen-2' },
    ];
  }

  t(key: string): string {
    return this.translatorService.translate(key);
  }

  toggleQuickFilters(): void {
    this.isQuickFiltersExpanded = !this.isQuickFiltersExpanded;
  }

  toggleFilters(): void {
    this.isFiltersExpanded = !this.isFiltersExpanded;
  }

  toggleUserFilters() {
    this.isUserFiltersExpanded = !this.isUserFiltersExpanded;
  }
}

