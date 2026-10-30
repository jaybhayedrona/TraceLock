package com.tracevault.repository;

import com.tracevault.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, String> {
    List<DocumentVersion> findByDocumentIdOrderByVersionNumberAsc(String documentId);
    Optional<DocumentVersion> findByDocumentIdAndVersionNumber(String documentId, Integer versionNumber);
}
