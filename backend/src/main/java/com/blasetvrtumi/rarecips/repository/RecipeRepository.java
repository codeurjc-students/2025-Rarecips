package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByLabelContainingIgnoreCase(String label);

    List<Recipe> findByAuthor(User author);

    @Query("SELECT DISTINCT ct FROM Recipe r JOIN r.cuisineType ct WHERE ct IS NOT NULL")
    List<String> findDistinctCuisineTypes();

    @Query("SELECT DISTINCT dt FROM Recipe r JOIN r.dishTypes dt WHERE dt IS NOT NULL")
    List<String> findDistinctDishTypes();

    @Query("SELECT DISTINCT mt FROM Recipe r JOIN r.mealTypes mt WHERE mt IS NOT NULL")
    List<String> findDistinctMealTypes();

    @Query("SELECT MIN(r.totalTime), MAX(r.totalTime) FROM Recipe r WHERE r.totalTime IS NOT NULL")
    Object[] findTimeRange();

    @Query("SELECT MIN(r.calories), MAX(r.calories) FROM Recipe r WHERE r.calories IS NOT NULL")
    Object[] findCalorieRange();

    Page<Recipe> findByDifficultyBetween(int minDifficulty, int maxDifficulty, Pageable pageable);

    Page<Recipe> findByPeopleBetween(int minPeople, int maxPeople, Pageable pageable);

    Page<Recipe> findByTotalTimeBetween(int minTime, int maxTime, Pageable pageable);

    Page<Recipe> findByCaloriesBetween(double minCalories, double maxCalories, Pageable pageable);

    //Page<Recipe> findByVegetarian(boolean vegetarian, Pageable pageable);

    //Page<Recipe> findByGlutenFree(boolean glutenFree, Pageable pageable);


    @Query("SELECT r FROM Recipe r WHERE " +
            "(:query IS NULL OR LOWER(r.label) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:minDifficulty IS NULL OR r.difficulty >= :minDifficulty) AND " +
            "(:maxDifficulty IS NULL OR r.difficulty <= :maxDifficulty) AND " +
            "(:minPeople IS NULL OR r.people >= :minPeople) AND " +
            "(:maxPeople IS NULL OR r.people <= :maxPeople) AND " +
            "(:minTime IS NULL OR r.totalTime >= :minTime) AND " +
            "(:maxTime IS NULL OR r.totalTime <= :maxTime) AND " +
            "(:minCalories IS NULL OR r.calories >= :minCalories) AND " +
            "(:maxCalories IS NULL OR r.calories <= :maxCalories) AND " +
            "(:cuisineType IS NULL OR LOWER(r.cuisineType) LIKE LOWER(CONCAT('%', :cuisineType, '%'))) AND " +
            "(:dishType IS NULL OR LOWER(r.dishTypes) LIKE LOWER(CONCAT('%', :dishType, '%'))) AND " +
            "(:mealType IS NULL OR LOWER(r.mealTypes) LIKE LOWER(CONCAT('%', :mealType, '%')))")
    Page<Recipe> findRecipesWithFilters(
            @Param("query") String query,
            @Param("minDifficulty") Integer minDifficulty,
            @Param("maxDifficulty") Integer maxDifficulty,
            @Param("minPeople") Integer minPeople,
            @Param("maxPeople") Integer maxPeople,
            @Param("minTime") Integer minTime,
            @Param("maxTime") Integer maxTime,
            @Param("minCalories") Double minCalories,
            @Param("maxCalories") Double maxCalories,
            @Param("vegetarian") Boolean vegetarian,
            @Param("glutenFree") Boolean glutenFree,
            @Param("cuisineType") String cuisineType,
            @Param("dishType") String dishType,
            @Param("mealType") String mealType,
            Pageable pageable
    );

    // Query methods for tags
    @Query("SELECT r FROM Recipe r JOIN r.dietLabels dl WHERE dl = :dietLabel")
    List<Recipe> findByDietLabel(@Param("dietLabel") String dietLabel);

    @Query("SELECT r FROM Recipe r JOIN r.healthLabels hl WHERE hl = :healthLabel")
    List<Recipe> findByHealthLabel(@Param("healthLabel") String healthLabel);

    @Query("SELECT r FROM Recipe r JOIN r.cautions c WHERE c = :caution")
    List<Recipe> findByCaution(@Param("caution") String caution);

    @Query("SELECT r FROM Recipe r JOIN r.cuisineType ct WHERE ct = :cuisineType")
    List<Recipe> findByCuisineType(@Param("cuisineType") String cuisineType);

    @Query("SELECT r FROM Recipe r JOIN r.dishTypes dt WHERE dt = :dishType")
    List<Recipe> findByDishType(@Param("dishType") String dishType);

    @Query("SELECT r FROM Recipe r JOIN r.mealTypes mt WHERE mt = :mealType")
    List<Recipe> findByMealType(@Param("mealType") String mealType);

    @Query("SELECT r FROM Recipe r WHERE " +
            "(:dietLabels IS NULL OR EXISTS (SELECT dl FROM r.dietLabels dl WHERE dl IN :dietLabels)) AND " +
            "(:healthLabels IS NULL OR EXISTS (SELECT hl FROM r.healthLabels hl WHERE hl IN :healthLabels)) AND " +
            "(:cautions IS NULL OR NOT EXISTS (SELECT c FROM r.cautions c WHERE c IN :cautions)) AND " +
            "(:cuisineTypes IS NULL OR EXISTS (SELECT ct FROM r.cuisineType ct WHERE ct IN :cuisineTypes)) AND " +
            "(:dishTypes IS NULL OR EXISTS (SELECT dt FROM r.dishTypes dt WHERE dt IN :dishTypes)) AND " +
            "(:mealTypes IS NULL OR EXISTS (SELECT mt FROM r.mealTypes mt WHERE mt IN :mealTypes))")
    Page<Recipe> findByTags(
            @Param("dietLabels") List<String> dietLabels,
            @Param("healthLabels") List<String> healthLabels,
            @Param("cautions") List<String> cautions,
            @Param("cuisineTypes") List<String> cuisineTypes,
            @Param("dishTypes") List<String> dishTypes,
            @Param("mealTypes") List<String> mealTypes,
            Pageable pageable
    );
}
