package codelab.api.smart.sae.forum.resource;

import codelab.api.smart.sae.forum.enums.DisciplinaEnum;
import codelab.api.smart.sae.forum.service.AcademicServiceClient;
import codelab.api.smart.sae.forum.service.AuthServiceClient;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/disciplines")
public class ForumDisciplineResource {

    private static final Logger log = LoggerFactory.getLogger(ForumDisciplineResource.class);

    @Autowired
    private AuthServiceClient authServiceClient;

    @Autowired
    private AcademicServiceClient academicServiceClient;

    /**
     * Retorna as disciplinas permitidas para o estudante autenticado,
     * com base no seu nível de ensino e grupo (A/B/C para 11ª/12ª classe).
     * Professores e admins recebem todas as disciplinas activas.
     */
    @GetMapping("/for-me")
    public ResponseEntity<List<String>> getDisciplinesForMe(HttpServletRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String jwt = request.getHeader("Authorization");

        boolean isProfessorOrAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PROFESSOR") || a.getAuthority().equals("ADMIN"));

        if (isProfessorOrAdmin) {
            List<AcademicServiceClient.SubjectInfo> all = academicServiceClient.getAllActiveSubjects(jwt);
            return ResponseEntity.ok(mapToEnumNames(all));
        }

        Long classroomId = authServiceClient.getStudentClassroomId(username, jwt);
        if (classroomId == null) {
            log.warn("classroomId não encontrado para '{}' — devolvendo todas as disciplinas", username);
            return ResponseEntity.ok(allDisciplineNames());
        }

        List<AcademicServiceClient.SubjectInfo> subjects = academicServiceClient.getSubjectsForClassroom(classroomId, jwt);
        if (subjects.isEmpty()) {
            log.warn("Sem disciplinas no academic service para classroom {} — fallback total", classroomId);
            return ResponseEntity.ok(allDisciplineNames());
        }

        return ResponseEntity.ok(mapToEnumNames(subjects));
    }

    private List<String> mapToEnumNames(List<AcademicServiceClient.SubjectInfo> subjects) {
        List<String> result = new ArrayList<>();
        for (AcademicServiceClient.SubjectInfo s : subjects) {
            String enumName = resolveEnumName(s);
            if (enumName != null && !result.contains(enumName)) {
                result.add(enumName);
            }
        }
        if (result.isEmpty()) return allDisciplineNames();
        return result;
    }

    private String resolveEnumName(AcademicServiceClient.SubjectInfo s) {
        // 1. Tenta pelo campo code (ex: "MATEMATICA")
        if (s.getCode() != null && !s.getCode().isBlank()) {
            String code = s.getCode().trim().toUpperCase();
            try {
                DisciplinaEnum.valueOf(code);
                return code;
            } catch (IllegalArgumentException ignored) {}
        }
        // 2. Fallback: normaliza o nome e compara com enum values
        String normalizedName = normalize(s.getName());
        for (DisciplinaEnum d : DisciplinaEnum.values()) {
            if (normalize(d.name()).equals(normalizedName)) return d.name();
        }
        return null;
    }

    private String normalize(String input) {
        if (input == null) return "";
        String str = input.trim().toLowerCase();
        str = Normalizer.normalize(str, Normalizer.Form.NFD);
        str = str.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return str.replaceAll("[^a-z0-9]", "");
    }

    private List<String> allDisciplineNames() {
        return Arrays.stream(DisciplinaEnum.values())
                .map(Enum::name)
                .collect(Collectors.toList());
    }
}
