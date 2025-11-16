package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.Review;
import com.blasetvrtumi.rarecips.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByRecipe(Recipe recipe);

    List<Review> findByAuthor(User author);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.recipe.id = :recipe")
    Double findAverageRatingByRecipe(@Param("recipe") Long recipe);

    Long countByRecipe(Recipe recipe);
}
