import { Review } from './review.model';

export interface Recipe {
  id: number;
  label: string;
  title: string;
  description: string;
  imageUrl: string;
  imageString: string;
  people: number;
  difficulty: number;
  ingredients: { description: string; food: string; quantity: number; measure: string; weight: number }[];
  dishTypes: string[];
  mealTypes: string[];
  cuisineType: string[];
  dietLabels: string[];
  healthLabels: string[];
  cautions: string[];
  totalTime: number;
  totalWeight: number;
  calories: number;
  rating: number;
  author: string;
  reviews: Review[];
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
}
