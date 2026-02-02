export interface Activity {
	id: number;
	username: string;
	activityType: string;
	recipeId?: number;
	collectionId?: number;
	recipeName?: string;
	description: string;
	timestamp: string;
}

export {};

