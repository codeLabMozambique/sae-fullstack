package codelab.api.smart.sae;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;

/**
 * Main Application for SAE Academic Service
 *
 * @author Antigravity
 */
@SpringBootApplication
@EntityScan(basePackages = {"codelab.api.smart.sae"})
@ComponentScan(basePackages = {"codelab.api.smart.sae"})
public class AcademicServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AcademicServiceApplication.class, args);
    }
}
