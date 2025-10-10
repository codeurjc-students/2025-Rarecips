import { Component } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute } from '@angular/router';
import { Recipe } from '../../models/recipe.model';


@Component({
  selector: 'app-recipe-view',
  templateUrl: './recipe-view.component.html',
  styleUrls: ['./recipe-view.component.css']
})
export class RecipeViewComponent {
  
  // User interactions
  isLiked = false;
  isSaved = false;
  userRating = 0;
  recipe: Recipe | null = null;

  constructor(private recipeService: RecipeService, private activatedRoute: ActivatedRoute) {}

  async ngOnInit() {
    this.recipe = await this.loadRecipe();
  }

  async loadRecipe() {
    const id = this.activatedRoute.snapshot.params['id'];
    return this.recipeService.getRecipeById(id);
  }

}
