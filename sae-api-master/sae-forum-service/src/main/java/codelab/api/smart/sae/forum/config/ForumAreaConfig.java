package codelab.api.smart.sae.forum.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class ForumAreaConfig {

    @Bean
    @ConfigurationProperties(prefix = "forum.area-mapping")
    public Map<String, String> forumAreaMapping() {
        return new LinkedHashMap<>();
    }
}
