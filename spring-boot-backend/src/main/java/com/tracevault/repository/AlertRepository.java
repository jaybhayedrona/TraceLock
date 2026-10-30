package com.tracevault.repository;

import com.tracevault.entity.SecurityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<SecurityAlert, String> {
    List<SecurityAlert> findByUserIdOrderByCreatedAtDesc(String userId);
    List<SecurityAlert> findByUserIdAndSeverityOrderByCreatedAtDesc(String userId, SecurityAlert.AlertSeverity severity);
    List<SecurityAlert> findByUserIdAndIsResolvedOrderByCreatedAtDesc(String userId, Boolean isResolved);
    long countByUserIdAndIsReadFalse(String userId);

    Optional<SecurityAlert> findFirstByDocumentIdAndCategoryAndIsResolvedFalse(String documentId, String category);
}
