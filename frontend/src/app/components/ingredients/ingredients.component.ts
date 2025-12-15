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

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.css']
})
export class IngredientsComponent implements OnInit {
  activeTab: 'ingredients' | 'pantry' = 'ingredients';

  categoryIcons: { [key: string]: string } = {
    'Vegetables': 'ti-leaf',
    'Fruits': 'ti-apple',
    'Meats': 'ti-meat',
    'Fish & Seafood': 'ti-fish',
    'Dairy': 'ti-milk',
    'Cereals': 'ti-wheat',
    'Spices': 'ti-pepper',
    'Condiments': 'ti-bottle',
    'Beverages': 'ti-cup',
    'Others': 'ti-package'
  };

  ingredients: Ingredient[] = [];
  currentPage: number = 0;
  pageSize: number = 10;
  hasMore: boolean = false;
  loadingIngredients: boolean = false;
  private isAuthenticated: boolean | undefined;
  private user: User | undefined;
  userIngredients: Set<Ingredient> = new Set<Ingredient>();
  displayedUserIngredients: Ingredient[] = [];
  pantryPage: number = 0;
  pantryPageSize: number = 10;
  hasMorePantryItems: boolean = false;

  constructor(private ingredientService: IngredientService,
              private ingredientIconService: IngredientIconService,
              private sessionService: SessionService,
              private userService: UserService,
              private router: Router) {}

  ngOnInit(): void {
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

        this.loadUserIngredients();
      },
      error: () => {
        this.isAuthenticated = false;
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

  loadIngredients(): void {
    this.loadingIngredients = true;
    this.ingredientService.getPagedIngredients(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        data.content.forEach((element: Ingredient) => {
          element.icon = this.ingredientIconService.getIconForIngredient(element.food);
          element.category = this.ingredientIconService.getCategoryFromIcon(element.icon);
          this.ingredients.push(element);
        });
        this.hasMore = !data.last;
        this.loadingIngredients = false;
      },
      error: (error) => {
        console.error('Error loading ingredients:', error);
        this.loadingIngredients = false;
      }
    });
  }

  loadMoreIngredients(): void {
    if (this.loadingIngredients || !this.hasMore) return;
    this.currentPage++;
    this.loadIngredients();
  }

  setActiveTab(tab: 'ingredients' | 'pantry'): void {
    this.activeTab = tab;
    if (tab === 'pantry') {
    }
  }

  addToPantry(ingredient: Ingredient): void {

    if (!this.isAuthenticated || !this.user) {
      this.router.navigate(['/error'], {state: {status: 403, reason: "You must be logged in to add ingredients to your pantry."}});
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
      this.router.navigate(['/error'], {state: {status: 403, reason: "You must be logged in to remove ingredients from your pantry."}});
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

  clearPantry(): void {
    if (!this.isAuthenticated || !this.user) {
      this.router.navigate(['/error'], {state: {status: 403, reason: "You must be logged in to clear your pantry."}});
      return;
    }

    if (!confirm('Are you sure you want to clear your entire pantry?')) return

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
}
