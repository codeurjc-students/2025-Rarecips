package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.ReviewStack;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewStackRepository extends JpaRepository<ReviewStack, Long> {
    @Query("SELECT r FROM ReviewStack r ORDER BY r.timestamp DESC")
    List<ReviewStack> findLatestReviews(Pageable pageable);
}

