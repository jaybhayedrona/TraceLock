package com.tracevault.repository;

import com.tracevault.entity.IntegrityIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IntegrityIncidentRepository extends JpaRepository<IntegrityIncident, String> {
    List<IntegrityIncident> findByUserIdOrderByDetectedAtDesc(String userId);
    List<IntegrityIncident> findByUserIdAndStatusOrderByDetectedAtDesc(String userId, IntegrityIncident.IncidentStatus status);
    Optional<IntegrityIncident> findFirstByDocumentIdAndStatus(String documentId, IntegrityIncident.IncidentStatus status);
}
