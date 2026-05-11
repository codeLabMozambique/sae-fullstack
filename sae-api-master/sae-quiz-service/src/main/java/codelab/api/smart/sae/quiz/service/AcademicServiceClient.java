package codelab.api.smart.sae.quiz.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class AcademicServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AcademicServiceClient.class);

    @Value("${quiz.academic-service.url:http://localhost:8085}")
    private String academicServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<SubjectInfo> getAllActiveSubjects(String jwtToken) {
        try {
            String url = academicServiceUrl + "/subject/all";
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", jwtToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<SubjectInfo[]> response = restTemplate.exchange(
                    url, java.util.Objects.requireNonNull(HttpMethod.GET), entity, SubjectInfo[].class);
            SubjectInfo[] body = response.getBody();
            return body != null ? Arrays.asList(body) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Não foi possível obter disciplinas do academic service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public static class SubjectInfo {
        private Long id;
        private String name;
        private String code;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }
}
