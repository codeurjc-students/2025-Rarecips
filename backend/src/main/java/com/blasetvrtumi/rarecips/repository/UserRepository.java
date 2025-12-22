package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    User findByEmail(String email);

    User findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE " +
            "(:query IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:minRecipes IS NULL OR SIZE(u.recipes) >= :minRecipes) AND " +
            "(:minReviews IS NULL OR SIZE(u.reviews) >= :minReviews) AND " +
            "(:minCollections IS NULL OR SIZE(u.savedRecipes) >= :minCollections)")
    Page<User> findUsersWithFilters(
            @Param("query") String query,
            @Param("minRecipes") Integer minRecipes,
            @Param("minReviews") Integer minReviews,
            @Param("minCollections") Integer minCollections,
            Pageable pageable
    );
}
