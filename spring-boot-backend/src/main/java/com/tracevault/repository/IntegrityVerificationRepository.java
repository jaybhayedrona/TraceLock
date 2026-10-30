package com.tracevault.repository;

import com.tracevault.entity.IntegrityVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IntegrityVerificationRepository extends JpaRepository<IntegrityVerification, String> {
    List<IntegrityVerification> findByUserIdOrderByCheckedAtDesc(String userId);
    List<IntegrityVerification> findByDocumentIdOrderByCheckedAtDesc(String documentId);
}
