package com.tracevault.repository;

import com.tracevault.entity.DocumentSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentSignatureRepository extends JpaRepository<DocumentSignature, String> {
    List<DocumentSignature> findByDocumentIdOrderBySignedAtDesc(String documentId);
    Optional<DocumentSignature> findByDocumentIdAndVersionNumberAndStatus(String documentId, Integer versionNumber, DocumentSignature.SignatureStatus status);
}
