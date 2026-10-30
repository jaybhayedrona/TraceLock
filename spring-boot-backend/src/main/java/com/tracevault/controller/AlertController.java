package com.tracevault.controller;

import com.tracevault.entity.SecurityAlert;
import com.tracevault.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertRepository alertRepository;

    @GetMapping
    public ResponseEntity<List<SecurityAlert>> getAlerts(
            @RequestHeader(value = "X-User-Id", defaultValue = "usr_demo_001") String userId
    ) {
        return ResponseEntity.ok(alertRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @RequestHeader(value = "X-User-Id", defaultValue = "usr_demo_001") String userId
    ) {
        long count = alertRepository.countByUserIdAndIsReadFalse(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable("id") String id) {
        SecurityAlert alert = alertRepository.findById(id).orElse(null);
        if (alert != null) {
            alert.setIsRead(true);
            alertRepository.save(alert);
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<?> resolveAlert(@PathVariable("id") String id) {
        SecurityAlert alert = alertRepository.findById(id).orElse(null);
        if (alert != null) {
            alert.setIsResolved(true);
            alert.setIsRead(true);
            alert.setResolvedAt(LocalDateTime.now());
            alertRepository.save(alert);
        }
        return ResponseEntity.ok(Map.of("status", "RESOLVED"));
    }
}
