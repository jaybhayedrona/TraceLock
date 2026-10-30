package com.tracevault.repository;

import com.tracevault.entity.UserKeyPair;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserKeyPairRepository extends JpaRepository<UserKeyPair, String> {
    Optional<UserKeyPair> findByUserId(String userId);
}
