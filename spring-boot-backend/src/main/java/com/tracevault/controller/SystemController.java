package com.tracevault.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @GetMapping("/health")
    public ResponseEntity<?> getSystemHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "application", "TraceVault",
                "version", "1.0.0",
                "architecture", "Spring Boot + Spring Security + MySQL + SHA-256 Verification Engine",
                "monitoring", "Active"
        ));
    }
}
