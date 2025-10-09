import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  author: {
    name: string;
    avatar: string;
    id: string;
  };
  stats: {
    prepTime: number;
    cookTime: number;
    servings: number;
    rating: number;
    reviews: number;
  };
  difficulty: string;
  category: string;
  tags: string[];
  cuisine: string;
  isLiked?: boolean;
}

interface User {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  isVerified: boolean;
  recipesCount: number;
  followersCount: number;
  averageRating: number;
  specialties: string[];
  isFollowing: boolean;
}

interface SearchFilters {
  query: string;
  categories: string[];
  difficulties: string[];
  maxTime: number;
  dietaryRestrictions: string[];
  cuisines: string[];
  minRating: number;
  sortBy: string;
}

interface UserFilters {
  query: string;
  specialties: string[];
  verified: boolean;
  minFollowers: number;
  minRecipes: number;
  minRating: number;
  sortBy: string;
}

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent {

  // Active tab management
  activeSearchTab: undefined;

  // User results and pagination
  userResults: User[] = [];
  totalUsers = 247;
  currentUserPage = 1;
  userPageSize = 9;
  totalUserPages = 28;
  userLoading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}
}
