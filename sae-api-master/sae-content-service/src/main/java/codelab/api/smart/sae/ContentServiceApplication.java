package codelab.api.smart.sae;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class })
@EntityScan(basePackages = {"codelab.api.smart.sae"})
@ComponentScan(basePackages = {"codelab.api.smart.sae"})
@EnableMongoRepositories(basePackages = {"codelab.api.smart.sae.content.repository"})
public class ContentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ContentServiceApplication.class, args);
    }
}
