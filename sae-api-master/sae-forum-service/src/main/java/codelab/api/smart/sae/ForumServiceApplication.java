package codelab.api.smart.sae;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EntityScan(basePackages = {"codelab.api.smart.sae"})
@ComponentScan(
    basePackages = {"codelab.api.smart.sae"},
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = codelab.api.smart.sae.framework.security.SecurityConfig.class
    )
)
public class ForumServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ForumServiceApplication.class, args);
    }
}
