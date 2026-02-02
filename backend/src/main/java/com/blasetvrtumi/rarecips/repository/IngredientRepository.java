package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    Ingredient findByFood(String food);

    @Query("SELECT i FROM Ingredient i WHERE LOWER(i.food) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Ingredient> searchByFood(@Param("query") String query, Pageable pageable);

    @Query("SELECT i FROM Ingredient i ORDER BY i.id DESC")
    Page<Ingredient> findAllByOrderByIdDesc(Pageable pageable);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM user_ingredients WHERE ingredients_id = :ingredientId", nativeQuery = true)
    void deleteUserIngredientsByIngredientId(@Param("ingredientId") Long ingredientId);


}
