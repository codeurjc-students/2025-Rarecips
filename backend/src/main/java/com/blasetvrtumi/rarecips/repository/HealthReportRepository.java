package com.blasetvrtumi.rarecips.repository;

import com.blasetvrtumi.rarecips.entity.HealthReport;
import com.blasetvrtumi.rarecips.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface HealthReportRepository extends JpaRepository<HealthReport, Long> {
    List<HealthReport> findByUserOrderByCreatedAtDesc(User user);
    int countByUserAndCreatedAtAfter(User user, LocalDateTime date);
}
