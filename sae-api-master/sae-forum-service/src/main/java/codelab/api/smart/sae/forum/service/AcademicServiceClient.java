package codelab.api.smart.sae.forum.service;

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
import java.util.stream.Collectors;

@Service
public class AcademicServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AcademicServiceClient.class);

    @Value("${forum.academic-service.url:http://localhost:8085}")
    private String academicServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Disciplinas de uma turma ─────────────────────────────────────────────

    public List<SubjectInfo> getSubjectsForClassroom(Long classroomId, String jwtToken) {
        try {
            String url = academicServiceUrl + "/subject/by-classroom?classroomId=" + classroomId;
            HttpHeaders headers = new HttpHeaders();
            if (jwtToken != null) headers.set("Authorization", jwtToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<SubjectInfo[]> response =
                restTemplate.exchange(url, java.util.Objects.requireNonNull(HttpMethod.GET), entity, SubjectInfo[].class);
            SubjectInfo[] body = response.getBody();
            return body != null ? Arrays.asList(body) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Não foi possível obter disciplinas do academic service para classroom {}: {}", classroomId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<SubjectInfo> getAllActiveSubjects(String jwtToken) {
        try {
            String url = academicServiceUrl + "/subject/all";
            HttpHeaders headers = new HttpHeaders();
            if (jwtToken != null) headers.set("Authorization", jwtToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<SubjectInfo[]> response =
                restTemplate.exchange(url, java.util.Objects.requireNonNull(HttpMethod.GET), entity, SubjectInfo[].class);
            SubjectInfo[] body = response.getBody();
            return body != null ? Arrays.asList(body) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Não foi possível obter todas as disciplinas do academic service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Professores por turma + disciplina (TURMA scope) ────────────────────

    /**
     * Devolve os IDs dos professores que leccionam a disciplina nessa turma.
     * Chama GET /professor-assignment/by-classroom-subject?classroomId=X&subjectId=Y
     */
    public List<Long> getProfessorIdsByClassroomAndSubject(Long classroomId, Long subjectId) {
        try {
            String url = academicServiceUrl + "/professor-assignment/by-classroom-subject"
                       + "?classroomId=" + classroomId + "&subjectId=" + subjectId;
            Long[] ids = restTemplate.getForObject(url, Long[].class);
            return ids != null ? Arrays.asList(ids) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Não foi possível obter professorIds por classroom {} e subject {}: {}", classroomId, subjectId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Devolve os IDs dos professores que leccionam essa disciplina (em qualquer turma).
     * Chama GET /professor-assignment/by-subject?subjectId=X
     */
    public List<Long> getProfessorIdsBySubject(Long subjectId) {
        try {
            String url = academicServiceUrl + "/professor-assignment/by-subject?subjectId=" + subjectId;
            Long[] ids = restTemplate.getForObject(url, Long[].class);
            return ids != null ? Arrays.asList(ids) : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Não foi possível obter professorIds por subject {}: {}", subjectId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Devolve os IDs dos subjects (disciplinas) atribuídos a um professor.
     * Chama GET /professor-assignment/professor/{professorId} (já existe)
     * e extrai os subjectIds.
     */
    public List<Long> getSubjectIdsByProfessorId(Long professorId) {
        try {
            String url = academicServiceUrl + "/professor-assignment/professor/" + professorId;
            AssignmentDetailInfo[] details = restTemplate.getForObject(url, AssignmentDetailInfo[].class);
            if (details == null) return Collections.emptyList();
            return Arrays.stream(details)
                .map(AssignmentDetailInfo::getSubjectId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Não foi possível obter subjectIds do professor {}: {}", professorId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<String> getSubjectNamesByProfessorId(Long professorId) {
        try {
            String url = academicServiceUrl + "/professor-assignment/professor/" + professorId;
            AssignmentDetailInfo[] details = restTemplate.getForObject(url, AssignmentDetailInfo[].class);
            if (details == null) return Collections.emptyList();
            return Arrays.stream(details)
                .map(AssignmentDetailInfo::getSubjectName)
                .filter(java.util.Objects::nonNull)
                .filter(n -> !n.isBlank())
                .distinct()
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Não foi possível obter subjectNames do professor {}: {}", professorId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public String getSubjectNameById(Long subjectId) {
        try {
            String url = academicServiceUrl + "/subject/" + subjectId;
            SubjectInfo info = restTemplate.getForObject(url, SubjectInfo.class);
            return info != null ? info.getName() : null;
        } catch (Exception e) {
            log.warn("Não foi possível obter nome da disciplina {}: {}", subjectId, e.getMessage());
            return null;
        }
    }

    public String getSchoolNameByProfessorId(Long professorId) {
        try {
            AssignmentDetailInfo[] details = restTemplate.getForObject(
                academicServiceUrl + "/professor-assignment/professor/" + professorId,
                AssignmentDetailInfo[].class);
            if (details == null || details.length == 0) return null;
            Long classroomId = Arrays.stream(details)
                .map(AssignmentDetailInfo::getClassroomId)
                .filter(java.util.Objects::nonNull).findFirst().orElse(null);
            if (classroomId == null) return null;
            ClassroomInfo classroom = restTemplate.getForObject(
                academicServiceUrl + "/classroom/" + classroomId, ClassroomInfo.class);
            if (classroom == null || classroom.getSchoolId() == null) return null;
            SchoolInfo school = restTemplate.getForObject(
                academicServiceUrl + "/school/" + classroom.getSchoolId(), SchoolInfo.class);
            return school != null ? school.getName() : null;
        } catch (Exception e) {
            log.warn("Não foi possível obter schoolName do professor {}: {}", professorId, e.getMessage());
            return null;
        }
    }

    // ── Inner DTOs ───────────────────────────────────────────────────────────

    public static class SubjectInfo {
        private Long id;
        private String name;
        private String code;
        private String description;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class ClassroomInfo {
        private Long id;
        private Long schoolId;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
    }

    public static class SchoolInfo {
        private Long id;
        private String name;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class AssignmentDetailInfo {
        private Long id;
        private Long professorId;
        private Long classroomId;
        private Long subjectId;
        private String subjectName;
        private String classroomName;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getProfessorId() { return professorId; }
        public void setProfessorId(Long v) { this.professorId = v; }
        public Long getClassroomId() { return classroomId; }
        public void setClassroomId(Long v) { this.classroomId = v; }
        public Long getSubjectId() { return subjectId; }
        public void setSubjectId(Long v) { this.subjectId = v; }
        public String getSubjectName() { return subjectName; }
        public void setSubjectName(String v) { this.subjectName = v; }
        public String getClassroomName() { return classroomName; }
        public void setClassroomName(String v) { this.classroomName = v; }
    }
}
