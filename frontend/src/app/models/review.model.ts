export interface Review {
  id: string;
  recipe: string;
  author?: string;
  authorUsername: string;
  authorPfp?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}
