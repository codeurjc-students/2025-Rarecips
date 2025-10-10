import { Component, OnInit, OnDestroy, ElementRef, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  newestRecipes: Recipe[] = [];
  recipeList: Recipe[] = [];

  page = 0;

  isLoading: boolean = true;
  hasMore: boolean = true;

  constructor(private recipeService: RecipeService, private router: Router) {
  }

  ngOnInit(): void {
    this.fetchRecipes();
  }

  async fetchRecipes() {
    this.isLoading = true;
    this.page = 0; // Reset to first page on new fetch
    this.recipeList = await this.recipeService.getRecipes(this.page);
    this.isLoading = false;
    this.hasMore = this.recipeList.length % 3 === 0;
  }

  async loadMoreRecipes() {
    this.isLoading = true;
    const moreRecipes = await this.recipeService.getRecipes(++this.page);
    this.recipeList = [...this.recipeList, ...moreRecipes];
    this.isLoading = false;
    this.hasMore = moreRecipes.length % 3 === 0;
  }

  viewRecipe(id: number) {
    this.router.navigate(['/recipes', id]);
  }
}


