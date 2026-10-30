package com.tracevault.repository;

import com.tracevault.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {
    List<Document> findByOwnerIdOrderByCreatedAtDesc(String ownerId);
    Optional<Document> findByIdAndOwnerId(String id, String ownerId);
    List<Document> findByMonitoringStatus(Document.MonitoringStatus status);

    @Query("SELECT d FROM Document d WHERE d.monitoringStatus = 'MONITORED' ORDER BY d.lastVerificationTime ASC NULLS FIRST")
    List<Document> findDocumentsDueForScheduledVerification();

    long countByOwnerId(String ownerId);
    long countByOwnerIdAndMonitoringStatus(String ownerId, Document.MonitoringStatus status);
}
