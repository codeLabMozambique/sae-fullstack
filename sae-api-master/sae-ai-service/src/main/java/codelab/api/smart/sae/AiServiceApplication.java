package codelab.api.smart.sae;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EntityScan(basePackages = {"codelab.api.smart.sae"})
@ComponentScan(basePackages = {"codelab.api.smart.sae"})
public class AiServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiServiceApplication.class, args);
    }
}
