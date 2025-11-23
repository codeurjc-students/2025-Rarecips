import {Component, HostListener} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

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
  cookTime: number;
  servings: number;
  difficulty: string;
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
export class RecipeEditComponent {

  prepTime: number = 0;
  servings: number = 1;

  // Difficulty dropdown
  difficulty: string = '';
  difficultyOptions: string[] = ['Easy', 'Medium', 'Hard'];
  filteredDifficultyOptions: string[] = [...this.difficultyOptions];
  showDifficultyDropdown: boolean = false;

  // Category dropdown
  category: string = '';
  categoryOptions: string[] = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer', 'Beverage'];
  filteredCategoryOptions: string[] = [...this.categoryOptions];
  showCategoryDropdown: boolean = false;

  // Tags and Characteristics - Multi-select dropdowns
  // Dietary
  dietaryCharacteristics: string[] = [];
  dietaryOptions: string[] = ['Vegetarian', 'Vegan', 'Gluten Free', 'Lactose Free'];
  showDietaryDropdown: boolean = false;
  dietarySearchTerm: string = '';

  // Cuisine
  cuisineTypes: string[] = [];
  cuisineTypeOptions: string[] = ['Spanish', 'Italian', 'Asian', 'Mexican', 'American', 'French', 'Mediterranean', 'Middle Eastern', 'Latin American', 'Indian'];
  showCuisineDropdown: boolean = false;
  cuisineSearchTerm: string = '';

  // Cautions
  cautions: string[] = [];
  cautionOptions: string[] = ['Sulfites', 'Tree-Nuts', 'Shellfish', 'Peanuts', 'Gluten', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Fish'];
  showCautionsDropdown: boolean = false;
  cautionsSearchTerm: string = '';

  // Diet Labels
  dietLabels: string[] = [];
  dietLabelOptions: string[] = ['Balanced', 'High-Fiber', 'High-Protein', 'Low-Carb', 'Low-Fat', 'Low-Sodium'];
  showDietLabelsDropdown: boolean = false;
  dietLabelsSearchTerm: string = '';

  // Dish Types
  dishTypes: string[] = [];
  dishTypeOptions: string[] = ['Starter', 'Main course', 'Side dish', 'Soup', 'Salad', 'Bread', 'Dessert', 'Drinks', 'Biscuits and cookies', 'Condiments and sauces'];
  showDishTypesDropdown: boolean = false;
  dishTypesSearchTerm: string = '';

  // Health Labels
  healthLabels: string[] = [];
  healthLabelOptions: string[] = ['Vegan', 'Vegetarian', 'Paleo', 'Dairy-Free', 'Gluten-Free', 'Wheat-Free', 'Egg-Free', 'Peanut-Free', 'Tree-Nut-Free', 'Soy-Free', 'Fish-Free', 'Shellfish-Free', 'Pork-Free', 'Red-Meat-Free', 'Crustacean-Free', 'Celery-Free', 'Mustard-Free', 'Sesame-Free', 'Lupine-Free', 'Mollusk-Free', 'Alcohol-Free', 'No oil added', 'Sulfite-Free', 'FODMAP-Free', 'Kosher', 'Immuno-Supportive'];
  showHealthLabelsDropdown: boolean = false;
  healthLabelsSearchTerm: string = '';

  private intervalId: any = null;
  private timeoutId: any = null;

  // Ingredients management
  ingredients: Ingredient[] = [];
  newIngredient: Ingredient = {name: '', quantity: '', unit: ''};
  draggedIngredientIndex: number | null = null;

  // Instructions management
  instructions: Instruction[] = [];
  newInstruction: string = '';

  // Image upload
  selectedImageFile: File | null = null;
  imagePreviewUrl: string = '';
  isDragging: boolean = false;

  constructor() {
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
  onDifficultyInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.difficulty = input;
    this.filteredDifficultyOptions = this.difficultyOptions.filter(option =>
      option.toLowerCase().includes(input.toLowerCase())
    );
    this.showDifficultyDropdown = true;
  }

  selectDifficulty(option: string): void {
    this.difficulty = option;
    this.showDifficultyDropdown = false;
  }

  toggleDifficultyDropdown(): void {
    this.showDifficultyDropdown = !this.showDifficultyDropdown;
    if (this.showDifficultyDropdown) {
      this.filteredDifficultyOptions = [...this.difficultyOptions];
    }
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

    // Check if click is outside difficulty dropdown
    if (!target.closest('.difficulty-dropdown-container')) {
      this.showDifficultyDropdown = false;
    }

    // Check if click is outside category dropdown
    if (!target.closest('.category-dropdown-container')) {
      this.showCategoryDropdown = false;
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

  addIngredient(): void {
    if (this.newIngredient.name.trim() && this.newIngredient.quantity.trim()) {
      this.ingredients.push({...this.newIngredient});
      this.newIngredient = {name: '', quantity: '', unit: ''};
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
  }
}
