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

  constructor(private recipeService: RecipeService, private router: Router) {
    this.fetchRecipes();
  }

  async fetchRecipes() {
    this.recipeList = await this.recipeService.getRecipes();
  }

  viewRecipe(id: number) {
    this.router.navigate(['/recipes', id]);
  }
}


