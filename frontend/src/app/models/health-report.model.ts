export interface HealthReport {
  id?: number;
  generatedSummary: string;
  totalCalories: number;
  totalWeight?: number;
  totalTime?: number;
  averageCalories?: number;
  averageDifficulty?: number;
  averagePeople?: number;
  dietLabelsCount?: Record<string, number>;
  healthLabelsCount?: Record<string, number>;
  cautionsCount?: Record<string, number>;
  recipesAnalyzed: number;
  createdAt: string;
}
