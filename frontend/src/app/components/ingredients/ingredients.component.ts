import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IngredientService} from '../../services/ingredient.service';
import {Ingredient} from '../../models/ingredient.model';
import {IngredientIconService} from '../../services/ingredient-icon.service';
import {SessionService} from '../../services/session.service';
import {Subject, takeUntil} from 'rxjs';
import {User} from '../../models/user.model';
import {Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import { TranslatorService } from '../../services/translator.service';
import {ThemeService} from '../../services/theme.service';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.css']
})
export class IngredientsComponent implements OnInit {
  activeTab: 'ingredients' | 'pantry' = 'ingredients';

  ingredients: Ingredient[] = [];
  currentPage: number = 0;
  pageSize: number = 9;
  hasMore: boolean = false;
  loadingIngredients: boolean = false;
  isAuthenticated: boolean | undefined;
  private user: User | undefined;
  userIngredients: Set<Ingredient> = new Set<Ingredient>();
  displayedUserIngredients: Ingredient[] = [];
  pantryPage: number = 0;
  pantryPageSize: number = 10;
  hasMorePantryItems: boolean = false;
  ingredientSearchQuery: string = '';
  searching: boolean = false;
  searchPage: number = 0;
  searchHasMore: boolean = false;
  searchLoading: boolean = false;
  isAdmin: boolean = false;
  confirmDeleteId: number | null = null;

  logos: Map<string, string> = new Map();

  createIngredientModalOpen = false;
  newIngredient: Partial<Ingredient> = { food: '', image: '' };
  creatingIngredient = false;
  createIngredientError: string | null = null;
  editing: boolean = false;
  editIngredientInd: number = 0;
  confirmClearPantry: boolean = false;
  isDragging: boolean = false;
  currentImage: string | null = null;

  constructor(private ingredientService: IngredientService,
              private ingredientIconService: IngredientIconService,
              private sessionService: SessionService,
              private themeService: ThemeService,
              private userService: UserService,
              private router: Router,
              public translatorService: TranslatorService,
              private titleService: Title) {
    this.t = this.t.bind(this);
  }

  t(key: string): string {
    return this.translatorService.translate(key);
  }

  updateTitle() {
    this.titleService.setTitle(this.t('title_ingredients'));
  }

  ngOnInit(): void {
    this.updateTitle();
    this.logos = this.themeService.getLogos();

    this.translatorService.onChange(() => {
      this.updateTitle();
      this.ingredients = [...this.ingredients];
      this.displayedUserIngredients = [...this.displayedUserIngredients];
    });
    this.loadIngredients();

    this.sessionService.getLoggedUser().pipe(
      takeUntil(new Subject<void>())
    ).subscribe({
      next: user => {
        if (!user) {
          this.isAuthenticated = false;
          return;
        }
        this.user = user;
        this.isAuthenticated = true;
        this.isAdmin = user.role.includes('ADMIN');

        this.loadUserIngredients();
      },
      error: (err) => {
        this.isAuthenticated = false;
        this.router.navigate(['/error'], {state: {status: 500, reason: this.t('Error fetching user data')}});
      }
    });
  }

  loadUserIngredients(): void {
    if (!this.user?.username) return;

    this.userService.getUserIngredients(<string>this.user.username).subscribe({
      next: (ingredients: Ingredient[]) => {
        this.userIngredients.clear();
        ingredients.forEach(element => {
          element.icon = this.ingredientIconService.getIconForIngredient(element.food);
          element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
          this.userIngredients.add(element);
        });
        this.pantryPage = 0;
        this.displayedUserIngredients = [];
        this.loadPantryPage();
      },
      error: (error) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
      }
    });
  }

  loadPantryPage(): void {
    const allUserIngredients = Array.from(this.userIngredients);
    const startIndex = this.pantryPage * this.pantryPageSize;
    const endIndex = startIndex + this.pantryPageSize;
    const pageItems = allUserIngredients.slice(startIndex, endIndex);

    this.displayedUserIngredients = [...this.displayedUserIngredients, ...pageItems];
    this.hasMorePantryItems = endIndex < allUserIngredients.length;
  }

  loadMorePantryItems(): void {
    this.pantryPage++;
    this.loadPantryPage();
  }
  loadIngredientsSearchPage(): void {
    this.searchLoading = true;
    this.ingredientService.searchIngredients(this.ingredientSearchQuery, this.searchPage, this.pageSize).subscribe({
      next: (data) => {
        this.ingredients.push(...data.content.map(element => {
          element.icon = this.ingredientIconService.getIconForIngredient(element.food);
          element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
          return element;
        }));
        this.searchHasMore = !data.last;
        this.searchLoading = false;
      },
      error: (error) => {
        console.error('Error searching ingredients:', error);
        this.searchLoading = false;
      }
    });
  }

  loadMoreIngredients(): void {
    if (this.searching) {
      if (this.searchLoading || !this.searchHasMore) return;
      this.searchPage++;
      this.loadIngredientsSearchPage();
      return;
    }
    if (this.loadingIngredients || !this.hasMore) return;
    this.currentPage++;
    this.loadIngredients();
  }

  loadIngredients(): void {
    if (this.searching) return;
    this.loadingIngredients = true;
    this.ingredientService.getPagedIngredients(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        this.ingredients.push(...data.content.map((element: Ingredient) => {
          element.icon = this.ingredientIconService.getIconForIngredient(element.food);
          element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
          return element;
        }));
        this.hasMore = !data.last;
        this.loadingIngredients = false;
      },
      error: (error) => {
        console.error('Error loading ingredients:', error);
        this.loadingIngredients = false;
      }
    });
  }

  setActiveTab(tab: 'ingredients' | 'pantry'): void {
    this.activeTab = tab;
    if (tab === 'pantry') {
    }
  }

  addToPantry(ingredient: Ingredient): void {

    if (!this.isAuthenticated || !this.user) {
      this.router.navigate(['/error'], {state: {status: 403, reason: this.t('You must be logged in to add ingredients') }});
      return;
    }

    if (this.hasIngredient(ingredient)) return;

    this.userService.addIngredient(ingredient).subscribe({
      next: (updatedUser: User) => {
        ingredient.isItOwned = true;
        this.userIngredients.add(ingredient);
        this.pantryPage = 0;
        this.displayedUserIngredients = [];
        this.loadPantryPage();
      },
      error: (error) => {
        console.error('Error adding ingredient to pantry:', error);
      }
    });

  }

  removeFromPantry(ingredient: Ingredient): void {
    if (!this.isAuthenticated || !this.user) {
      this.router.navigate(['/error'], {state: {status: 403, reason: this.t('You must be an administrator to remove ingredients') }});
      return;
    }

    this.userService.removeIngredient(ingredient).subscribe({
      next: () => {
        this.userIngredients.delete(ingredient);
        this.pantryPage = 0;
        this.displayedUserIngredients = [];
        this.loadPantryPage();
      },
      error: (error) => {
        console.error('Error removing ingredient from pantry:', error);
      }
    });
  }

  manageClearPantry(event: Event): void {
    if (!this.confirmClearPantry) {
      this.confirmClearPantry = true;
      event.stopPropagation();
      return;
    }
    this.clearPantry();
  }

  clearPantry(event?: Event): void {
    if (!this.isAuthenticated || !this.user) {
      this.router.navigate(['/error'], {state: {status: 403, reason: 'You must be logged in to clear your pantry.' }});
      return;
    }

    this.userService.clearPantry().subscribe({
      next: () => {
        this.userIngredients.clear();
        this.pantryPage = 0;
        this.displayedUserIngredients = [];
        this.hasMorePantryItems = false;
      },
      error: (error) => {
        console.error('Error clearing pantry:', error);
      }
    });
  }

  hasIngredient(ingredient: Ingredient): boolean {
    let res = false;
    this.userIngredients.forEach((ing: Ingredient) => {
      if (!res) res = ing.id === ingredient.id;
    });
    return res;
  }

  deleteIngredient(ingredient: Ingredient, event: Event): void {
    this.confirmDeleteId = ingredient.id;
  }

  confirmDeleteIngredient(ingredient: Ingredient, $event: MouseEvent) {
    this.ingredientService.deleteIngredient(ingredient.id).subscribe({
      next: () => {
        this.ingredients = this.ingredients.filter(ing => ing.id !== ingredient.id);
        this.userIngredients.delete(ingredient);
        this.pantryPage = 0;
        this.displayedUserIngredients = [];
        this.loadPantryPage();
        this.confirmDeleteId = null;
      },
      error: (error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
      }
    });
  }

  cancelDelete(event: FocusEvent) {
    if (!event.relatedTarget || !(<HTMLElement>event.relatedTarget).classList.contains('confirmDelete')) {
      this.confirmDeleteId = null;
    }
  }

  openCreateIngredientModal(ingredient?: Ingredient) {
    this.createIngredientModalOpen = true;
    if (ingredient) {
      this.editing = true;
      this.editIngredientInd = this.ingredients.findIndex(ing => ing.id === ingredient.id);
      this.newIngredient = { ...ingredient };
      if (ingredient.imageString) ingredient.image = '';
      this.currentImage = ingredient.image || ingredient.imageString as any;
    } else {
      this.editing = false;
      this.editIngredientInd = -1;
      this.newIngredient = {food: '', image: ''};
      this.createIngredientError = null;
    }
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const createIngredientModal = document.getElementsByClassName('createIngredientModal')[0] as HTMLElement;
      (createIngredientModal.querySelector("input") as HTMLElement)?.focus();
    }, 100)
  }

  closeCreateIngredientModal(event?: Event) {
    ((event?.target as HTMLElement).closest('.visibleBackdrop')?.classList.remove('visibleBackdrop'));
    setTimeout(() => {
      this.createIngredientModalOpen = false;
      this.createIngredientError = null;
      this.editIngredientInd = -1;
      this.currentImage = null;
      this.editing = false;
      document.body.style.overflow = '';
    }, 500);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processImageFile(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.processImageFile(file);
    }
  }

  processImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.currentImage = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.currentImage = null;
  }

  createIngredient(event: Event): void {
    const recipeNameInp = (document.getElementsByClassName("recipeNameInp")[0] as HTMLInputElement);
    if (!recipeNameInp.value) {
      this.createIngredientError = this.t('fill_ingredient_name');
      return;
    }
    this.newIngredient.food = recipeNameInp.value;
    this.creatingIngredient = true;
    this.createIngredientError = null;
    if (this.currentImage) {
      this.newIngredient.imageString = this.currentImage;
    } else {
      this.newIngredient.imageString = 'assets/img/ingredient.png';
    }
    if (this.editing) {
      this.ingredientService.updateIngredient(this.newIngredient.id!, this.newIngredient).subscribe({
        next: (ingredient: Ingredient) => {
          ingredient.category = this.ingredientIconService.getCategoryFromIcon(ingredient.icon);
          ingredient.icon = this.ingredientIconService.getIconForIngredient(ingredient.food);
          this.ingredients[this.editIngredientInd] = ingredient;
          this.creatingIngredient = false;
          this.closeCreateIngredientModal(event);
          this.editIngredientInd = -1;
          this.editing = false;
          this.currentImage = null;
          this.newIngredient = { food: '', image: '' };
        },
        error: (err: any) => {
          this.createIngredientError = this.t('error_updating_ingredient');
          this.creatingIngredient = false;
        }
      });
      return;
    }
    this.ingredientService.createIngredient(this.newIngredient).subscribe({
      next: (ingredient: Ingredient) => {
        ingredient.category = this.ingredientIconService.getCategoryFromIcon(ingredient.icon);
        ingredient.icon = this.ingredientIconService.getIconForIngredient(ingredient.food);
        this.ingredients.unshift(ingredient);
        this.ingredients.splice(this.ingredients.length - 1, 1);
        this.creatingIngredient = false;
        this.closeCreateIngredientModal(event);
        this.currentImage = null;
        this.newIngredient = { food: '', image: '' };
      },
      error: (_err: any) => {
        this.createIngredientError = this.t('error_creating_ingredient');
        this.creatingIngredient = false;
      }
    });
  }

  manageModalClose(event: Event) {
    if (event instanceof MouseEvent && event.type === 'click') {
      if ((event.target as HTMLElement).classList.contains('createIngredientModal')) {
        this.closeCreateIngredientModal(event);
      }
    } else if (event instanceof KeyboardEvent) {
      if (event.key === 'Escape' && this.createIngredientModalOpen) {
        this.closeCreateIngredientModal(event);
      }
    }
  }

  logout() {
    this.sessionService.logout();
    this.router.navigate(['/auth/login']);
  }

  protected readonly confirm = confirm;
}
