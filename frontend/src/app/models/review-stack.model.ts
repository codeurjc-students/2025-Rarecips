export interface ReviewStack {
	id: number;
	username: string;
	recipeId: number;
	recipeName: string;
	rating: number;
	comment: string;
	userImageString?: string;
	timestamp: string;
}

export {};

