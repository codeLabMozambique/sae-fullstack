package codelab.api.smart.sae.forum.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class AuthServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceClient.class);

    @Value("${forum.auth-service.url:http://localhost:8081}")
    private String authServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    
    public String[] getProfessorSpecializations(String professorUsername) {
        try {
            String url = authServiceUrl + "/users/professor/" + professorUsername + "/specializations";
            return restTemplate.getForObject(url, String[].class);
        } catch (Exception e) {
            return new String[]{"Erro ao consultar especializações"};
        }
    }

    public boolean canProfessorAnswerArea(String professorUsername, codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina) {
        try {
            String url = authServiceUrl + "/users/professor/" + professorUsername + "/specializations";
            log.info("Checking specialization for '{}' at URL: {}", professorUsername, url);
            
            String[] specializations = restTemplate.getForObject(url, String[].class);
            log.info("Auth service returned specializations: {}", (Object) specializations);
            
            String normalizedArea = normalize(disciplina.name());
            for (String spec : specializations) {
                String normalizedSpec = normalize(spec);
                log.info("Comparing normalized spec '{}' with normalized area '{}'", normalizedSpec, normalizedArea);
                if (normalizedSpec.contains(normalizedArea) || normalizedArea.contains(normalizedSpec)) {
                    log.info("Match found!");
                    return true;
                }
            }
            log.warn("No match found for professor '{}' in area '{}'. Specializations: {}", 
                professorUsername, disciplina.name(), Arrays.toString(specializations));
            return false;
        } catch (Exception e) {
            log.warn("Auth service unavailable or error for '{}'. Allowing as fallback. Error: {}",
                professorUsername, e.getMessage());
            return true;
        }
    }

    public List<ProfessorInfo> getProfessorsByDisciplina(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina) {
        try {
            String url = authServiceUrl + "/users/professors/by-discipline?disciplina=" + disciplina.name();
            ProfessorInfo[] result = restTemplate.getForObject(url, ProfessorInfo[].class);
            return result != null ? Arrays.asList(result) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Could not fetch professors for disciplina '{}': {}", disciplina, e.getMessage());
            return Collections.emptyList();
        }
    }

    public static class ProfessorInfo {
        private String username;
        private String fullname;
        private boolean online;
        private String specialization;

        public String getUsername()       { return username; }
        public String getFullname()       { return fullname; }
        public boolean isOnline()         { return online; }
        public String getSpecialization() { return specialization; }

        public void setUsername(String v)       { this.username = v; }
        public void setFullname(String v)       { this.fullname = v; }
        public void setOnline(boolean v)        { this.online = v; }
        public void setSpecialization(String v) { this.specialization = v; }
    }

    private String normalize(String input) {
        if (input == null) return "";
        // 1. Para minúsculas e remove espaços nas extremidades
        String str = input.trim().toLowerCase();
        // 2. Decompõe caracteres acentuados (ex: á -> a + ´)
        str = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        // 3. Remove os acentos (diacríticos)
        str = str.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        // 4. Mantém apenas letras e números (remove pontuação, espaços duplos, etc)
        return str.replaceAll("[^a-z0-9]", "");
    }
}
