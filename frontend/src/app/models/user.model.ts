import {Recipe} from "./recipe.model";
import {Review} from "./review.model";

export interface User {
  username: string;
  displayName: string;
  bio: string;
  profileImageFile: string;
  profileImageUrl: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  lastOnline: Date;
  recipes: Recipe[];
  privateProfile: boolean;
  reviews: Review[];
  savedRecipes: string[];

}
