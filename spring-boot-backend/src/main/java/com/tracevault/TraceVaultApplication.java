package com.tracevault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * TraceVault — A Personalized Smart Document Management and Integrity Monitoring System.
 * Tagline: Your documents. Your control.
 *
 * Core features:
 * 1. Sensitive document change detection (SHA-256 baseline hashing)
 * 2. Automatic security alerts on unexpected byte modification
 * 3. Fault tolerance and reliable recovery (atomic writes, retry logic, error handling)
 */
@SpringBootApplication
@EnableScheduling
public class TraceVaultApplication {

    public static void main(String[] args) {
        SpringApplication.run(TraceVaultApplication.class, args);
        System.out.println("=========================================================");
        System.out.println(" TRACEVAULT SYSTEM ONLINE");
        System.out.println(" Integrity Monitoring Engine & Fault Tolerance Active");
        System.out.println("=========================================================");
    }
}
