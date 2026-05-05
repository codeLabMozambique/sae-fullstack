package codelab.api.smart.sae;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Main Application for SAE Academic Service
 *
 * @author Antigravity
 */
@SpringBootApplication
@EntityScan(basePackages = {"codelab.api.smart.sae"})
@ComponentScan(basePackages = {"codelab.api.smart.sae"})
@EnableMethodSecurity
public class AcademicServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AcademicServiceApplication.class, args);
    }
}
