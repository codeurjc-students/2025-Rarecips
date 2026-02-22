package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecipeCollectionRepository extends JpaRepository<RecipeCollection, Long> {
    List<RecipeCollection> findByUser(User user);
    List<RecipeCollection> findByUserUsername(String username);

    @Query("SELECT c FROM RecipeCollection c WHERE c.user.username = :username")
    Page<RecipeCollection> findByUserUsername(String username, Pageable pageable);

    Optional<RecipeCollection> findByUserAndIsFavoritesTrue(User user);
    Optional<RecipeCollection> findFirstByUserUsernameAndIsFavoritesTrue(String username);
    boolean existsByUserAndTitle(User user, String title);

    @Query("SELECT c FROM RecipeCollection c LEFT JOIN FETCH c.recipes LEFT JOIN FETCH c.user WHERE c.isFavorites = false")
    List<RecipeCollection> findAllNonFavoritesWithRecipes();

    @Query("SELECT DISTINCT c FROM RecipeCollection c LEFT JOIN FETCH c.recipes LEFT JOIN FETCH c.user WHERE c.user.username = :username")
    List<RecipeCollection> findByUserUsernameWithRecipes(@Param("username") String username);

    Page<RecipeCollection> findByIsFavoritesFalse(Pageable pageable);

    @Query("SELECT c FROM RecipeCollection c WHERE c.user.username = :username AND c.isFavorites = false")
    Page<RecipeCollection> findByUserUsernameAndIsFavoritesFalse(@Param("username") String username, Pageable pageable);

    @Query("SELECT c FROM RecipeCollection c WHERE c.isFavorites = false AND LOWER(c.title) LIKE %:q% ORDER BY c.createdAt DESC")
    Page<RecipeCollection> searchNonFavoritesByTitle(@Param("q") String q, Pageable pageable);

    @Query("SELECT c FROM RecipeCollection c LEFT JOIN c.recipes r WHERE c.isFavorites = false GROUP BY c.id ORDER BY COUNT(r) DESC")
    Page<RecipeCollection> findAllNonFavoritesOrderByRecipeCountDesc(Pageable pageable);

    @Query("SELECT c FROM RecipeCollection c WHERE c.isFavorites = false ORDER BY LOWER(c.title) ASC")
    Page<RecipeCollection> findAllNonFavoritesOrderByTitleAsc(Pageable pageable);

    @Query("SELECT c FROM RecipeCollection c LEFT JOIN c.recipes r WHERE c.isFavorites = false AND LOWER(c.title) LIKE %:q% GROUP BY c.id ORDER BY COUNT(r) DESC")
    Page<RecipeCollection> searchNonFavoritesByTitleOrderByRecipeCountDesc(@Param("q") String q, Pageable pageable);

    @Query("SELECT c FROM RecipeCollection c WHERE c.isFavorites = false AND LOWER(c.title) LIKE %:q% ORDER BY LOWER(c.title) ASC")
    Page<RecipeCollection> searchNonFavoritesByTitleOrderByTitleAsc(@Param("q") String q, Pageable pageable);
}
