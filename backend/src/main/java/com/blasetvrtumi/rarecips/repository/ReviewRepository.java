package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.Review;
import com.blasetvrtumi.rarecips.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByRecipe(Recipe recipe);

    @Query("SELECT r FROM Review r WHERE r.recipe.id = :recipeId ORDER BY r.createdAt DESC")
    List<Review> findByRecipeIdWithPagination(@Param("recipeId") Long recipeId, Pageable pageable);

    List<Review> findByRecipeId(@Param("recipeId") Long recipeId);

    List<Review> findByAuthor(User author);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.recipe.id = :recipe")
    Double findAverageRatingByRecipe(@Param("recipe") Long recipe);

    Long countByRecipe(Recipe recipe);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Review r WHERE r.recipe.id = :recipeId AND r.author.username = :username")
    boolean existsByRecipeIdAndAuthorUsername(@Param("recipeId") Long recipeId, @Param("username") String username);
}
