import {Component, OnInit, OnDestroy, ElementRef, Renderer2} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {Recipe} from '../../models/recipe.model';
import {RecipeService} from '../../services/recipe.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  newestRecipes: Recipe[] = [];
  recipeList: Recipe[] = [];

  page = 0;
  itemsPerPage = 10;

  isLoading: boolean = true;
  hasMore: boolean = true;


  constructor(private recipeService: RecipeService, private router: Router) {
  }

  ngOnInit(): void {
    this.fetchRecipes();
  }

  fetchRecipes() {
    this.isLoading = true;
    this.page = 0; // Reset to first page on new fetch
    this.recipeService.getRecipes(this.page).subscribe({
      next: (recipes) => {
        this.recipeList = recipes;
        this.isLoading = false;
        this.hasMore = this.recipeList.length % this.itemsPerPage === 0;
      },
      error: (error) => {
        console.error('Error fetching recipes:', error);
        this.isLoading = false;
      }
    });
  }

  loadMoreRecipes() {
    this.isLoading = true;
    this.recipeService.getRecipes(++this.page).subscribe({
      next: (moreRecipes) => {
        this.recipeList = [...this.recipeList, ...moreRecipes];
        this.isLoading = false;
        this.hasMore = moreRecipes.length % this.itemsPerPage > 0;
      },
      error: (error) => {
        console.error('Error loading more recipes:', error);
        this.isLoading = false;
      }
    });
  }

  viewRecipe(id: number) {
    this.router.navigate(['/recipes', id]);
  }
}


