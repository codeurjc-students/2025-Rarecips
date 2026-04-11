package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :start AND :end")
    long countByCreatedAtBetween(@org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);

    User findByEmail(String email);

    User findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Page<User> findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
            String query, String query2, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
            "(:query IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:minRecipes IS NULL OR SIZE(u.recipes) >= :minRecipes) AND " +
            "(:minReviews IS NULL OR SIZE(u.reviews) >= :minReviews) AND " +
            "(:minCollections IS NULL OR SIZE(u.savedRecipes) >= :minCollections)")
    Page<User> filterUsersWithCounts(
            @org.springframework.data.repository.query.Param("query") String query,
            @org.springframework.data.repository.query.Param("minRecipes") Integer minRecipes,
            @org.springframework.data.repository.query.Param("minReviews") Integer minReviews,
            @org.springframework.data.repository.query.Param("minCollections") Integer minCollections,
            Pageable pageable
    );

    @Query("SELECT u FROM User u WHERE (u.role IS NULL OR u.role != :role) AND u.suspended = :suspended")
    Page<User> findByRoleNotAndSuspendedCustom(@Param("role") User.Role role, @Param("suspended") boolean suspended, Pageable pageable);

    User findByPasswordResetToken(String token);

    Page<User> findByRole(User.Role role, Pageable pageable);

    Page<User> findByReportedTrue(Pageable pageable);
}
