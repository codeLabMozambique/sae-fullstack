package codelab.api.smart.sae;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

@SpringBootApplication
@EntityScan(basePackages = {"codelab.api.smart.sae.content.model.jpa"})
@ComponentScan(basePackages = {"codelab.api.smart.sae"})
@EnableMongoRepositories(
    basePackages = {"codelab.api.smart.sae.content.repository"},
    excludeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
        type = org.springframework.context.annotation.FilterType.REGEX,
        pattern = "codelab\\.api\\.smart\\.sae\\.content\\.repository\\.jpa\\..*"
    )
)
@org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackages = {"codelab.api.smart.sae.content.repository.jpa"})
public class ContentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ContentServiceApplication.class, args);
    }
}
