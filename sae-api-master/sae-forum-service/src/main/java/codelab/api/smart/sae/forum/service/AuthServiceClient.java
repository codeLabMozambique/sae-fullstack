package codelab.api.smart.sae.forum.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URI;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class AuthServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceClient.class);

    @Value("${forum.auth-service.url:http://localhost:8081}")
    private String authServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Especializações do professor (legado) ────────────────────────────────

    public String[] getProfessorSpecializations(String professorUsername) {
        try {
            URI uri = UriComponentsBuilder
                    .fromUriString(authServiceUrl + "/users/professor/{u}/specializations")
                    .buildAndExpand(professorUsername).encode().toUri();
            return restTemplate.getForObject(uri, String[].class);
        } catch (Exception e) {
            log.warn("Não foi possível obter especializações do professor '{}': {}", professorUsername, e.getMessage());
            return new String[0];
        }
    }

    public boolean canProfessorAnswerArea(String professorUsername, codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina) {
        if (disciplina == null) return true;
        try {
            String[] specializations = getProfessorSpecializations(professorUsername);
            if (specializations == null || specializations.length == 0) return true;
            String normalizedArea = normalize(disciplina.name());
            for (String spec : specializations) {
                String normalizedSpec = normalize(spec);
                if (normalizedSpec.isEmpty()) continue;
                if (normalizedSpec.contains(normalizedArea) || normalizedArea.contains(normalizedSpec)) return true;
            }
            return false;
        } catch (Exception e) {
            log.warn("Auth service indisponível para professor '{}'. Fallback: true. Erro: {}", professorUsername, e.getMessage());
            return true;
        }
    }

    public List<String> getProfessorDisciplineNames(String professorUsername) {
        try {
            String[] specs = getProfessorSpecializations(professorUsername);
            if (specs == null) return Collections.emptyList();
            List<String> disciplines = new java.util.ArrayList<>();
            for (String spec : specs) {
                String normalizedSpec = normalize(spec);
                if (normalizedSpec.isEmpty()) continue;
                for (codelab.api.smart.sae.forum.enums.DisciplinaEnum d : codelab.api.smart.sae.forum.enums.DisciplinaEnum.values()) {
                    String normalizedEnum = normalize(d.name());
                    if (normalizedSpec.contains(normalizedEnum) || normalizedEnum.contains(normalizedSpec)) {
                        if (!disciplines.contains(d.name())) disciplines.add(d.name());
                        break;
                    }
                }
            }
            return disciplines;
        } catch (Exception e) {
            log.warn("Não foi possível resolver disciplinas do professor '{}': {}", professorUsername, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── ID do utilizador por username ────────────────────────────────────────

    /**
     * Devolve o userId (sae_user.id) dado um username.
     * Uses UriComponentsBuilder so query param is properly encoded (e.g. + → %2B).
     */
    @SuppressWarnings("unchecked")
    public Long getUserIdByUsername(String username) {
        try {
            URI uri = URI.create(authServiceUrl + "/users/user-id-by-username?username="
                    + username.replace("+", "%2B"));
            Map<String, Object> body = restTemplate.getForObject(uri, Map.class);
            if (body == null) return null;
            Object uid = body.get("userId");
            if (uid instanceof Number) return ((Number) uid).longValue();
            return null;
        } catch (Exception e) {
            log.warn("Não foi possível obter userId do utilizador '{}': {}", username, e.getMessage());
            return null;
        }
    }

    // ── Perfil do estudante ──────────────────────────────────────────────────

    public Long getStudentClassroomId(String username, String jwtToken) {
        try {
            URI uri = URI.create(authServiceUrl + "/users/student-profile-by-username?username="
                    + username.replace("+", "%2B"));
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", jwtToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<StudentProfileResponse> response =
                restTemplate.exchange(uri, java.util.Objects.requireNonNull(HttpMethod.GET),
                    entity, StudentProfileResponse.class);
            StudentProfileResponse bodyResp = response.getBody();
            return bodyResp != null ? bodyResp.getClassroomId() : null;
        } catch (Exception e) {
            log.warn("Não foi possível obter classroomId do estudante '{}': {}", username, e.getMessage());
            return null;
        }
    }

    public static class StudentProfileResponse {
        private Long classroomId;
        private String grade;
        public Long getClassroomId() { return classroomId; }
        public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }
        public String getGrade() { return grade; }
        public void setGrade(String grade) { this.grade = grade; }
    }

    // ── Professores por disciplina ───────────────────────────────────────────

    public List<ProfessorInfo> getProfessorsByDisciplina(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina) {
        try {
            String url = authServiceUrl + "/users/professors/by-discipline?disciplina=" + disciplina.name();
            ProfessorInfo[] result = restTemplate.getForObject(url, ProfessorInfo[].class);
            return result != null ? Arrays.asList(result) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Não foi possível obter professores para disciplina '{}': {}", disciplina, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Devolve informação de um professor dado o userId (Long).
     * Chama GET /users/professor-profile?userId=X
     */
    public ProfessorInfo getProfessorInfoByUserId(Long userId) {
        try {
            String url = authServiceUrl + "/users/professor-profile?userId=" + userId;
            return restTemplate.getForObject(url, ProfessorInfo.class);
        } catch (Exception e) {
            log.warn("Não foi possível obter info do professor userId={}: {}", userId, e.getMessage());
            return null;
        }
    }

    public static class ProfessorInfo {
        private String username;
        @JsonProperty("fullName")
        private String fullname;
        private boolean online;
        private String specialization;
        private String lastSeen;

        public String getUsername()       { return username; }
        public String getFullname()       { return fullname; }
        public boolean isOnline()         { return online; }
        public String getSpecialization() { return specialization; }
        public String getLastSeen()       { return lastSeen; }
        public void setUsername(String v)       { this.username = v; }
        public void setFullname(String v)       { this.fullname = v; }
        public void setOnline(boolean v)        { this.online = v; }
        public void setSpecialization(String v) { this.specialization = v; }
        public void setLastSeen(String v)       { this.lastSeen = v; }
    }

    public List<StudentInfo> getStudentsByClassroom(Long classroomId) {
        try {
            String url = authServiceUrl + "/users/students-by-classroom?classroomId=" + classroomId;
            StudentInfo[] result = restTemplate.getForObject(url, StudentInfo[].class);
            return result != null ? Arrays.asList(result) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Nao foi possivel obter estudantes da turma {}: {}", classroomId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public static class StudentInfo {
        private String username;
        @JsonProperty("fullName")
        private String fullName;
        public String getUsername() { return username; }
        public void setUsername(String v) { this.username = v; }
        public String getFullName() { return fullName; }
        public void setFullName(String v) { this.fullName = v; }
    }

    private String normalize(String input) {
        if (input == null) return "";
        String str = input.trim().toLowerCase();
        str = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        str = str.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return str.replaceAll("[^a-z0-9]", "");
    }
}
