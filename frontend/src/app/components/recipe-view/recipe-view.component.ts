import { Component } from '@angular/core';


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

  constructor(
  ) {}

}
