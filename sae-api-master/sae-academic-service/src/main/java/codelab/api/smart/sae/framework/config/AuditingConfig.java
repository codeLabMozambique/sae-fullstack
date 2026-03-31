package codelab.api.smart.sae.framework.config;

import codelab.api.smart.sae.framework.jpa.JpaAuditingConfig.SAEAuditorAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class AuditingConfig {

    @Bean
    public AuditorAware<Long> auditorAware() {
        return new SAEAuditorAware();
    }
}
