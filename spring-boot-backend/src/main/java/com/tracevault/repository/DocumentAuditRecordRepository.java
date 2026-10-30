package com.tracevault.repository;

import com.tracevault.entity.DocumentAuditRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentAuditRecordRepository extends JpaRepository<DocumentAuditRecord, String> {
    List<DocumentAuditRecord> findByDocumentIdOrderByTimestampAsc(String documentId);
}
