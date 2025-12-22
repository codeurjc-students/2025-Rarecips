import {Component, OnInit, HostListener, ChangeDetectorRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {RecipeService} from '../../services/recipe.service';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Subject, takeUntil} from 'rxjs';
import {Ingredient} from '../../models/ingredient.model';
import {SessionService} from '../../services/session.service';
import {UserService} from '../../services/user.service';

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
  imports: [CommonModule, FormsModule],
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
  showSortDropdown: boolean = false;

  sortOptions = [
    { value: 'popular', label: 'Most Popular', icon: 'ti-star' },
    { value: 'rating', label: 'Highest Rated', icon: 'ti-trophy' },
    { value: 'updatedAt', label: 'Recently Updated', icon: 'ti-clock' },
    { value: 'title', label: 'Alphabetical', icon: 'ti-sort-ascending-letters' }
  ];

  userSortOptions = [
    { value: 'createdAt', label: 'Newest', icon: 'ti-clock' },
    { value: 'username', label: 'Username (A-Z)', icon: 'ti-sort-ascending-letters' },
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
    sortBy: 'popular',
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private recipeService: RecipeService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
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
      }
    });

    if (this.activeSearchTab === 'recipes') {
      if (!this.filters.query) {
        this.applyQuickFilter('popular');
      } else {
        this.applyRecipeFilters();
      }
    } else if (this.activeSearchTab === 'users') {
      this.applyUserFilters();
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
      },
      error: (err) => {
        this.router.navigate(['/error'], {state: {status: err.status, reason: err.message}});
      }
    });
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
      this.applyRecipeFilters();
    } else if (tab === 'users' && this.searchQuery) {
      this.applyUserFilters();
    } else if (tab === 'recipes' && !this.searchQuery) {
      this.applyQuickFilter('popular');
    } else if (tab === 'users' && !this.searchQuery) {
      this.applyUserFilters();
    }
  }

  toggleFilter(filterType: keyof SearchFilters, value: string): void {
    const filterArray = this.filters[filterType] as string[];
    const index = filterArray.indexOf(value);
    if (index > -1) {
      filterArray.splice(index, 1);
    } else {
      filterArray.push(value);
    }
    this.applyRecipeFilters();
  }

  isFilterActive(filterType: keyof SearchFilters, value: string): boolean {
    const filterArray = this.filters[filterType] as string[];
    return filterArray.includes(value);
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
      sortBy: 'popular',
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
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filters.query = '';
    this.userFilters.query = '';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: this.activeSearchTab },
      queryParamsHandling: 'merge'
    });

    if (this.activeSearchTab === 'recipes') {
      this.currentRecipePage = 0;
      this.applyRecipeFilters();
    } else if (this.activeSearchTab === 'users') {
      this.currentUserPage = 0;
      this.applyUserFilters();
    }
  }

  applyQuickFilter(filterType: string): void {
    if (this.activeQuickFilter === filterType) {
      this.activeQuickFilter = '';
      this.resetQuickFilterCriteria();
    } else {
      this.activeQuickFilter = filterType;
      this.resetQuickFilterCriteria();

      switch(filterType) {
        case 'popular':
          this.filters.sortBy = 'rating';
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
    }

    this.currentRecipePage = 0;
    this.applyRecipeFilters();
  }

  resetQuickFilterCriteria(): void {
    this.filters.sortBy = 'popular';
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

  toggleSortDropdown(): void {
    this.showSortDropdown = !this.showSortDropdown;
  }

  changeSortOrder(sortValue: string): void {
    this.filters.sortBy = sortValue;
    this.showSortDropdown = false;
    this.currentRecipePage = 0;
    this.applyRecipeFilters();
  }

  getCurrentSortLabel(): string {
    const option = this.sortOptions.find(opt => opt.value === this.filters.sortBy);
    return option ? option.label : 'Sort by';
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
  }

  getCurrentUserSortLabel(): string {
    const option = this.userSortOptions.find(opt => opt.value === this.userFilters.sortBy);
    return option ? option.label : 'Sort by';
  }
}

