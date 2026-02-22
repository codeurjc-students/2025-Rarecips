import { Component, HostListener, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { EnumService } from '../../services/enum.service';
import { IngredientService } from '../../services/ingredient.service';
import { IngredientIconService } from '../../services/ingredient-icon.service';
import { TranslatorService } from '../../services/translator.service';
import { Title } from '@angular/platform-browser';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Instruction {
  step: number;
  description: string;
}

interface RecipeData {
  title: string;
  description: string;
  prepTime: number;
  servings: number;
  difficulty: number;
  category: string;
  image: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  dietaryTags: string[];
  cuisineType: string;
}

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.component.html',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  styleUrls: ['./recipe-edit.component.css']
})
export class RecipeEditComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Recipe ID (null for new recipe)
  recipeId: number | null = null;
  isEditMode: boolean = false;

  defaultImageUrl: string = '';

  title: string = '';
  description: string = '';
  prepTime: number = 0;
  servings: number = 1;

  // Difficulty slider
  difficulty: number = 3;

  // Category dropdown
  category: string = '';
  categoryOptions: string[] = [];
  filteredCategoryOptions: string[] = [];
  showCategoryDropdown: boolean = false;

  // Tags and Characteristics - Multi-select dropdowns
  dietaryCharacteristics: string[] = [];
  dietaryOptions: string[] = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'];
  showDietaryDropdown: boolean = false;
  dietarySearchTerm: string = '';

  // Cuisine
  cuisineTypes: string[] = [];
  cuisineTypeOptions: string[] = [];
  showCuisineDropdown: boolean = false;
  cuisineSearchTerm: string = '';

  // Cautions
  cautions: string[] = [];
  cautionOptions: string[] = [];
  showCautionsDropdown: boolean = false;
  cautionsSearchTerm: string = '';

  // Diet Labels
  dietLabels: string[] = [];
  dietLabelOptions: string[] = [];
  showDietLabelsDropdown: boolean = false;
  dietLabelsSearchTerm: string = '';

  // Dish Types
  dishTypes: string[] = [];
  dishTypeOptions: string[] = [];
  showDishTypesDropdown: boolean = false;
  dishTypesSearchTerm: string = '';

  // Health Labels
  healthLabels: string[] = [];
  healthLabelOptions: string[] = [];
  showHealthLabelsDropdown: boolean = false;
  healthLabelsSearchTerm: string = '';

  private intervalId: any = null;
  private timeoutId: any = null;

  // Ingredients management
  ingredients: { name: string; quantity: string | undefined; unit: string | undefined }[] = [];
  newIngredient: Ingredient = { name: '', quantity: '', unit: '' };
  draggedIngredientIndex: number | null = null;

  availableIngredients: string[] = [];
  filteredIngredients: string[] = [];
  showIngredientDropdown: boolean = false;

  // Instructions management
  instructions: Instruction[] = [];
  newInstruction: string = '';

  // Image upload
  selectedImageFile: File | null = null;
  imagePreviewUrl: string = '';
  isDragging: boolean = false;

  // Tabs
  activeTab: 'ingredients' | 'instructions' | 'nutrition' = 'ingredients';

  // Nutrition
  calories: number = 0;
  protein: number = 0;
  carbs: number = 0;
  fat: number = 0;
  fiber: number = 0;
  sugar: number = 0;
  sodium: number = 0;
  totalWeight: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private enumService: EnumService,
    private ingredientService: IngredientService,
    public ingredientIconService: IngredientIconService,
    private translatorService: TranslatorService,
    private ngZone: NgZone,
    private titleService: Title
  ) {
  }

  t(key: string): string {
    return this.translatorService.translate(key);
  }

  updateTitle() {
    if (this.isEditMode) {
      this.titleService.setTitle(this.t('title_recipe_edit'));
    } else {
      this.titleService.setTitle(this.t('title_recipe_create'));
    }
  }

  ngOnInit(): void {
    this.updateTitle();
    this.translatorService.onChange(() => {
      this.updateTitle();
    });

    this.recipeService.getDefaultRecipeImageUrl().subscribe({
      next: (url) => {
        this.defaultImageUrl = url;
      },
      error: (err) => console.error('Error loading default recipe image URL:', err)
    })

    // Load enum values from backend
    this.loadEnumValues();

    // Load all ingredient names
    this.loadIngredients();

    this.route.params.subscribe(params => {
      const id = params['id'];
      this.recipeId = id ? +id : null;
      this.isEditMode = this.recipeId !== null;
      this.updateTitle();

      if (this.isEditMode) {
        this.loadRecipe();
      }
    });
  }

  loadIngredients(): void {
    this.ingredientService.getAllIngredientNames().subscribe({
      next: (names) => {
        this.availableIngredients = names;
      },
      error: (err) => console.error('Error loading ingredients:', err)
    });
  }

  loadEnumValues(): void {
    this.enumService.getMealTypes().subscribe({
      next: (types) => {
        this.categoryOptions = types;
        this.filteredCategoryOptions = [...types];
      },
      error: (err) => console.error('Error loading meal types:', err)
    });

    this.enumService.getCuisineTypes().subscribe({
      next: (types) => {
        this.cuisineTypeOptions = types;
      },
      error: (err) => console.error('Error loading cuisine types:', err)
    });

    this.enumService.getCautions().subscribe({
      next: (cautions) => {
        this.cautionOptions = cautions;
      },
      error: (err) => console.error('Error loading cautions:', err)
    });

    this.enumService.getDietLabels().subscribe({
      next: (labels) => {
        this.dietLabelOptions = labels;
      },
      error: (err) => console.error('Error loading diet labels:', err)
    });

    this.enumService.getDishTypes().subscribe({
      next: (types) => {
        this.dishTypeOptions = types;
      },
      error: (err) => console.error('Error loading dish types:', err)
    });

    this.enumService.getHealthLabels().subscribe({
      next: (labels) => {
        this.healthLabelOptions = labels;
      },
      error: (err) => console.error('Error loading health labels:', err)
    });
  }

  loadRecipe(): void {
    if (this.recipeId !== null) {
      this.recipeService.getRecipeById(this.recipeId).subscribe({
        next: (recipe) => {
          if (recipe) {
            this.title = recipe.title;
            this.description = recipe.description;
            this.servings = recipe.people;

            this.difficulty = recipe.difficulty || 1;

            if (recipe.mealTypes && recipe.mealTypes.length > 0) {
              this.category = recipe.mealTypes[0];
            }

            if (recipe.imageString && !this.defaultImageUrl.includes(recipe.imageString)) {
              if (!recipe.imageString.startsWith('data:image')) {
                this.imagePreviewUrl = 'data:image/jpeg;base64,' + recipe.imageString;
              } else {
                this.imagePreviewUrl = recipe.imageString;
              }
            }

            this.ingredients = recipe.ingredients.map(ing => ({
              name: ing.food,
              quantity: ing.quantity?.toString(),
              unit: ing.measure
            }));

            this.instructions = recipe.steps.map((step, index) => ({
              step: index + 1,
              description: step
            }));

            this.cuisineTypes = recipe.cuisineType || [];
            this.cautions = recipe.cautions || [];

            this.dietLabels = recipe.dietLabels || [];

            const allHealthLabels = recipe.healthLabels || [];
            const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'];
            this.dietaryCharacteristics = allHealthLabels.filter(label => dietaryOptions.includes(label));
            this.healthLabels = allHealthLabels.filter(label => !dietaryOptions.includes(label));

            this.dishTypes = recipe.dishTypes || [];
            this.calories = recipe.calories || 0;
            this.totalWeight = recipe.totalWeight || 0;
            this.prepTime = recipe.totalTime || 0;
          }
        },
        error: (err) => {
          console.error('Error loading recipe:', err);
        }
      });
    }
  }

  setActiveTab(tab: 'ingredients' | 'instructions' | 'nutrition'): void {
    this.activeTab = tab;
  }

  incrementValue(field: 'prepTime' | 'servings'): void {
    this[field]++;
  }

  decrementValue(field: 'prepTime' | 'servings'): void {
    if (field === 'servings' && this.servings <= 1) return;
    if (field === 'prepTime' && this.prepTime <= 0) return;
    this[field]--;
  }

  startIncrement(field: 'prepTime' | 'servings'): void {
    // Delay
    this.timeoutId = setTimeout(() => {
      this.intervalId = setInterval(() => {
        this.incrementValue(field);
      }, 100);
    }, 500);
  }

  startDecrement(field: 'prepTime' | 'servings'): void {
    this.timeoutId = setTimeout(() => {
      this.intervalId = setInterval(() => {
        this.decrementValue(field);
      }, 100);
    }, 500);
  }

  stopChange(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Difficulty methods
  getDifficultyLabel(): string {
    switch (this.difficulty) {
      case 1: return this.t('very_easy');
      case 2: return this.t('easy');
      case 3: return this.t('medium');
      case 4: return this.t('hard');
      case 5: return this.t('very_hard');
      default: return this.t('medium');
    }
  }

  checkFields(): boolean {
    const recipeLabel = document.getElementById('recipeLabel') as HTMLInputElement;
    const recipeDescription = document.getElementById('recipeDesc') as HTMLInputElement;
    return recipeLabel.value.trim() === '' || recipeDescription.value.trim() === '';
  }

  // Category methods
  onCategoryInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.category = input;
    this.filteredCategoryOptions = this.categoryOptions.filter(option =>
      option.toLowerCase().includes(input.toLowerCase())
    );
    this.showCategoryDropdown = true;
  }

  selectCategory(option: string): void {
    this.category = option;
    this.showCategoryDropdown = false;
  }

  toggleCategoryDropdown(): void {
    this.showCategoryDropdown = !this.showCategoryDropdown;
    if (this.showCategoryDropdown) {
      this.filteredCategoryOptions = [...this.categoryOptions];
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;


    // Check if click is outside category dropdown
    if (!target.closest('.category-dropdown-container')) {
      this.showCategoryDropdown = false;
    }

    if (!target.closest('.ingredient-autocomplete-container')) {
      this.showIngredientDropdown = false;
    }

    // Check if click is outside multi-select dropdowns
    if (!target.closest('.multiselect-dropdown-container')) {
      this.showDietaryDropdown = false;
      this.showCuisineDropdown = false;
      this.showCautionsDropdown = false;
      this.showDietLabelsDropdown = false;
      this.showDishTypesDropdown = false;
      this.showHealthLabelsDropdown = false;
    }
  }

  closeAllMultiSelectDropdowns(): void {
    this.showDietaryDropdown = false;
    this.showCuisineDropdown = false;
    this.showCautionsDropdown = false;
    this.showDietLabelsDropdown = false;
    this.showDishTypesDropdown = false;
    this.showHealthLabelsDropdown = false;
  }

  toggleDietaryDropdown(): void {
    const wasOpen = this.showDietaryDropdown;
    this.closeAllMultiSelectDropdowns();
    this.showDietaryDropdown = !wasOpen;
  }

  toggleCuisineDropdown(): void {
    const wasOpen = this.showCuisineDropdown;
    this.closeAllMultiSelectDropdowns();
    this.showCuisineDropdown = !wasOpen;
  }

  toggleCautionsDropdown(): void {
    const wasOpen = this.showCautionsDropdown;
    this.closeAllMultiSelectDropdowns();
    this.showCautionsDropdown = !wasOpen;
  }

  toggleDietLabelsDropdown(): void {
    const wasOpen = this.showDietLabelsDropdown;
    this.closeAllMultiSelectDropdowns();
    this.showDietLabelsDropdown = !wasOpen;
  }

  toggleDishTypesDropdown(): void {
    const wasOpen = this.showDishTypesDropdown;
    this.closeAllMultiSelectDropdowns();
    this.showDishTypesDropdown = !wasOpen;
  }

  toggleHealthLabelsDropdown(): void {
    const wasOpen = this.showHealthLabelsDropdown;
    this.closeAllMultiSelectDropdowns();
    this.showHealthLabelsDropdown = !wasOpen;
  }

  // Multi-select dropdown methods
  // Dietary
  toggleDietary(item: string): void {
    const index = this.dietaryCharacteristics.indexOf(item);
    if (index > -1) {
      this.dietaryCharacteristics.splice(index, 1);
    } else {
      this.dietaryCharacteristics.push(item);
    }
  }

  isDietarySelected(item: string): boolean {
    return this.dietaryCharacteristics.includes(item);
  }

  getFilteredDietaryOptions(): string[] {
    if (!this.dietarySearchTerm) return this.dietaryOptions;
    return this.dietaryOptions.filter(option =>
      option.toLowerCase().includes(this.dietarySearchTerm.toLowerCase())
    );
  }

  removeDietary(item: string): void {
    this.dietaryCharacteristics = this.dietaryCharacteristics.filter(i => i !== item);
  }

  // Cuisine
  toggleCuisineType(type: string): void {
    const index = this.cuisineTypes.indexOf(type);
    if (index > -1) {
      this.cuisineTypes.splice(index, 1);
    } else {
      this.cuisineTypes.push(type);
    }
  }

  isCuisineTypeSelected(type: string): boolean {
    return this.cuisineTypes.includes(type);
  }

  getFilteredCuisineOptions(): string[] {
    if (!this.cuisineSearchTerm) return this.cuisineTypeOptions;
    return this.cuisineTypeOptions.filter(option =>
      option.toLowerCase().includes(this.cuisineSearchTerm.toLowerCase())
    );
  }

  removeCuisine(item: string): void {
    this.cuisineTypes = this.cuisineTypes.filter(i => i !== item);
  }

  // Cautions
  toggleCaution(caution: string): void {
    const index = this.cautions.indexOf(caution);
    if (index > -1) {
      this.cautions.splice(index, 1);
    } else {
      this.cautions.push(caution);
    }
  }

  isCautionSelected(caution: string): boolean {
    return this.cautions.includes(caution);
  }

  getFilteredCautionOptions(): string[] {
    if (!this.cautionsSearchTerm) return this.cautionOptions;
    return this.cautionOptions.filter(option =>
      option.toLowerCase().includes(this.cautionsSearchTerm.toLowerCase())
    );
  }

  removeCaution(item: string): void {
    this.cautions = this.cautions.filter(i => i !== item);
  }

  // Diet Labels
  toggleDietLabel(label: string): void {
    const index = this.dietLabels.indexOf(label);
    if (index > -1) {
      this.dietLabels.splice(index, 1);
    } else {
      this.dietLabels.push(label);
    }
  }

  isDietLabelSelected(label: string): boolean {
    return this.dietLabels.includes(label);
  }

  getFilteredDietLabelOptions(): string[] {
    if (!this.dietLabelsSearchTerm) return this.dietLabelOptions;
    return this.dietLabelOptions.filter(option =>
      option.toLowerCase().includes(this.dietLabelsSearchTerm.toLowerCase())
    );
  }

  removeDietLabel(item: string): void {
    this.dietLabels = this.dietLabels.filter(i => i !== item);
  }

  // Dish Types
  toggleDishType(type: string): void {
    const index = this.dishTypes.indexOf(type);
    if (index > -1) {
      this.dishTypes.splice(index, 1);
    } else {
      this.dishTypes.push(type);
    }
  }

  isDishTypeSelected(type: string): boolean {
    return this.dishTypes.includes(type);
  }

  getFilteredDishTypeOptions(): string[] {
    if (!this.dishTypesSearchTerm) return this.dishTypeOptions;
    return this.dishTypeOptions.filter(option =>
      option.toLowerCase().includes(this.dishTypesSearchTerm.toLowerCase())
    );
  }

  removeDishType(item: string): void {
    this.dishTypes = this.dishTypes.filter(i => i !== item);
  }

  // Health Labels
  toggleHealthLabel(label: string): void {
    const index = this.healthLabels.indexOf(label);
    if (index > -1) {
      this.healthLabels.splice(index, 1);
    } else {
      this.healthLabels.push(label);
    }
  }

  isHealthLabelSelected(label: string): boolean {
    return this.healthLabels.includes(label);
  }

  getFilteredHealthLabelOptions(): string[] {
    if (!this.healthLabelsSearchTerm) return this.healthLabelOptions;
    return this.healthLabelOptions.filter(option =>
      option.toLowerCase().includes(this.healthLabelsSearchTerm.toLowerCase())
    );
  }

  removeHealthLabel(item: string): void {
    this.healthLabels = this.healthLabels.filter(i => i !== item);
  }

  onIngredientNameInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.newIngredient.name = input;

    if (input.trim().length > 0) {
      this.filteredIngredients = this.availableIngredients.filter(ingredient =>
        ingredient.toLowerCase().includes(input.toLowerCase())
      );
      this.showIngredientDropdown = this.filteredIngredients.length > 0;
    } else {
      this.showIngredientDropdown = false;
    }
  }

  selectIngredient(ingredient: string): void {
    this.newIngredient.name = ingredient;
    this.showIngredientDropdown = false;
  }

  isValidIngredient(): boolean {
    return !!this.newIngredient.name && this.newIngredient.name.trim().length > 0;
  }

  addIngredient(): void {
    if (this.isValidIngredient()) {
      this.ingredients.push({ ...this.newIngredient });
      this.newIngredient = { name: '', quantity: '', unit: '' };
      this.showIngredientDropdown = false;
    }
  }

  removeIngredient(index: number): void {
    this.ingredients.splice(index, 1);
  }

  // Drag and Drop for ingredients
  onIngredientDragStart(index: number): void {
    this.draggedIngredientIndex = index;
  }

  onIngredientDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onIngredientDrop(dropIndex: number): void {
    if (this.draggedIngredientIndex !== null && this.draggedIngredientIndex !== dropIndex) {
      const draggedItem = this.ingredients[this.draggedIngredientIndex];
      this.ingredients.splice(this.draggedIngredientIndex, 1);
      this.ingredients.splice(dropIndex, 0, draggedItem);
    }
    this.draggedIngredientIndex = null;
  }

  private dragGhost: HTMLElement | null = null;
  private dragGhostOffsetX: number = 0;
  private dragGhostOffsetY: number = 0;
  private dragRafId: number | null = null;
  private dragX: number = 0;
  private dragY: number = 0;

  onIngredientTouchStart(index: number, event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault();
      event.stopPropagation();
    }
    const touch = event.touches[0];
    this.startDrag(index, touch.clientX, touch.clientY, event.target as HTMLElement);

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      window.addEventListener('touchend', this.boundTouchEnd);
    });
  }

  private boundTouchMove = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault();
    const touch = event.touches[0];
    this.moveDrag(touch.clientX, touch.clientY);
  };

  private boundTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    this.endDrag(touch.clientX, touch.clientY);

    window.removeEventListener('touchmove', this.boundTouchMove);
    window.removeEventListener('touchend', this.boundTouchEnd);
  };

  onIngredientTouchMove(event: TouchEvent): void { }
  onIngredientTouchEnd(event: TouchEvent): void { }


  onIngredientMouseDown(index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.startDrag(index, event.clientX, event.clientY, event.target as HTMLElement);

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.boundMouseMove);
      window.addEventListener('mouseup', this.boundMouseUp);
    });
  }

  private boundMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    this.moveDrag(event.clientX, event.clientY);
  };

  private boundMouseUp = (event: MouseEvent) => {
    this.endDrag(event.clientX, event.clientY);

    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup', this.boundMouseUp);
  };


  private startDrag(index: number, clientX: number, clientY: number, target: HTMLElement): void {
    if (this.dragRafId) {
      cancelAnimationFrame(this.dragRafId);
      this.dragRafId = null;
    }

    this.draggedIngredientIndex = index;
    const ingredientItem = target.closest('.ingredient-item') as HTMLElement;

    if (ingredientItem) {
      this.dragGhost = ingredientItem.cloneNode(true) as HTMLElement;
      this.dragGhost.classList.add('dragging-ghost');
      this.dragGhost.style.position = 'fixed';
      this.dragGhost.style.zIndex = '1000';
      this.dragGhost.style.pointerEvents = 'none';
      this.dragGhost.style.width = `${ingredientItem.offsetWidth}px`;
      this.dragGhost.style.opacity = '0.9';
      this.dragGhost.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
      this.dragGhost.style.willChange = 'transform';
      this.dragGhost.style.transition = 'none';
      this.dragGhost.style.animation = 'none';
      this.dragGhost.style.margin = '0';
      this.dragGhost.style.left = '0';
      this.dragGhost.style.top = '0';

      const rect = ingredientItem.getBoundingClientRect();

      this.dragGhostOffsetX = clientX - rect.left;
      this.dragGhostOffsetY = clientY - rect.top;

      this.dragGhost.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1.05)`;

      document.body.appendChild(this.dragGhost);
      ingredientItem.classList.add('opacity-50');
    }
  }

  private moveDrag(clientX: number, clientY: number): void {
    if (this.draggedIngredientIndex === null || !this.dragGhost) return;

    this.dragX = clientX;
    this.dragY = clientY;

    if (!this.dragRafId) {
      this.dragRafId = requestAnimationFrame(() => {
        this.updateDragPosition();
      });
    }
  }

  private updateDragPosition(): void {
    if (!this.dragGhost) {
      this.dragRafId = null;
      return;
    }

    const x = this.dragX - this.dragGhostOffsetX;
    const y = this.dragY - this.dragGhostOffsetY;

    this.dragGhost.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.05)`;
    this.dragRafId = null;
  }

  private endDrag(clientX: number, clientY: number): void {
    if (this.draggedIngredientIndex === null) return;

    if (this.dragRafId) {
      cancelAnimationFrame(this.dragRafId);
      this.dragRafId = null;
    }

    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }

    const items = document.querySelectorAll('.ingredient-item');
    items.forEach(item => item.classList.remove('opacity-50'));

    const target = document.elementFromPoint(clientX, clientY);

    if (target) {
      const ingredientItem = target.closest('.ingredient-item');
      if (ingredientItem) {
        this.ngZone.run(() => {
          const container = document.getElementById('ingredients-list');
          if (container) {
            const children = Array.from(container.querySelectorAll('.ingredient-item'));
            const dropIndex = children.indexOf(ingredientItem as Element);

            if (dropIndex !== -1 && dropIndex !== this.draggedIngredientIndex) {
              this.onIngredientDrop(dropIndex);
            }
          }
        });
      }
    }

    this.draggedIngredientIndex = null;
  }

  addInstruction(): void {
    if (this.newInstruction.trim()) {
      this.instructions.push({
        step: this.instructions.length + 1,
        description: this.newInstruction
      });
      this.newInstruction = '';
    }
  }

  removeInstruction(index: number): void {
    this.instructions.splice(index, 1);
    this.instructions.forEach((instruction, i) => {
      instruction.step = i + 1;
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.onImageSelected(file);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.onImageSelected(file);
      }
    }
  }

  onImageSelected(file: File): void {
    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = '';

    // Clean inout image file
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  saveRecipe(): void {
    let cleanImageString = '';
    if (this.imagePreviewUrl) {
      const base64Index = this.imagePreviewUrl.indexOf('base64,');
      if (base64Index !== -1) {
        cleanImageString = this.imagePreviewUrl.substring(base64Index + 7);
      } else {
        cleanImageString = this.imagePreviewUrl;
      }
    }

    const recipeData = {
      label: this.title || '',
      description: this.description || '',
      people: this.servings || 1,
      difficulty: this.difficulty || 1,
      imageString: cleanImageString,
      ingredients: this.ingredients.map(ing => ({
        food: ing.name,
        quantity: parseFloat(<string>ing.quantity) || 0,
        measure: ing.unit || '',
        image: ''
      })),
      steps: this.instructions.map(inst => inst.description),
      cuisineType: this.cuisineTypes || [],
      cautions: this.cautions || [],
      dietLabels: this.dietLabels || [], // Solo Diet Labels (Balanced, High-Fiber, etc.)
      dishTypes: this.dishTypes || [],
      mealTypes: this.category ? [this.category] : [],
      healthLabels: [...(this.dietaryCharacteristics || []), ...(this.healthLabels || [])], // Combinar dietaryCharacteristics con healthLabels
      totalTime: (this.prepTime || 0),
      calories: this.calories || 0,
      totalWeight: this.totalWeight || 0,
      rating: 0
    };

    if (this.isEditMode && this.recipeId !== null) {
      // Update existing recipe
      this.recipeService.updateRecipe(this.recipeId, recipeData).subscribe({
        next: (response) => {
          this.router.navigate(['/recipes', this.recipeId]);
        },
        error: (error) => {
          console.error('Error updating recipe:', error);
          alert('Error updating recipe: ' + error.message);
        }
      });
    } else {
      // Create new recipe
      this.recipeService.createRecipe(recipeData).subscribe({
        next: (response) => {
          const newRecipeId = response.recipe?.id;
          if (newRecipeId) {
            this.router.navigate(['/recipes', newRecipeId]);
          } else {
            this.router.navigate(['/explore']);
          }
        },
        error: (error) => {
          console.error('Error creating recipe:', error);
          alert('Error creating recipe: ' + error.message);
        }
      });
    }
  }
}

