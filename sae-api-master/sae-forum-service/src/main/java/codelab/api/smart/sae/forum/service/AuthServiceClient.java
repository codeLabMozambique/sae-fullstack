package codelab.api.smart.sae.forum.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AuthServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceClient.class);

    @Value("${forum.auth-service.url:http://localhost:8081}")
    private String authServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean canProfessorAnswerArea(String professorUsername, String area) {
        try {
            String url = authServiceUrl + "/users/professor/" + professorUsername + "/specializations";
            String[] specializations = restTemplate.getForObject(url, String[].class);
            if (specializations == null) return true; // fallback: allow
            for (String spec : specializations) {
                if (spec.equalsIgnoreCase(area)) return true;
            }
            return false;
        } catch (Exception e) {
            log.warn("Auth service unavailable for specialization check of '{}'. Allowing answer as fallback. Error: {}",
                professorUsername, e.getMessage());
            return true;
        }
    }
}
