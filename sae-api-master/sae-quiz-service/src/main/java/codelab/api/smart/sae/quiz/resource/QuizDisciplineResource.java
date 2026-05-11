package codelab.api.smart.sae.quiz.resource;

import codelab.api.smart.sae.quiz.enums.DisciplinaEnum;
import codelab.api.smart.sae.quiz.service.AcademicServiceClient;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
public class QuizDisciplineResource {

    @Autowired
    private AcademicServiceClient academicServiceClient;

    @GetMapping("/all")
    public ResponseEntity<List<String>> getAllDisciplines(HttpServletRequest request) {
        String jwt = request.getHeader("Authorization");
        List<AcademicServiceClient.SubjectInfo> subjects = academicServiceClient.getAllActiveSubjects(jwt);

        if (subjects.isEmpty()) {
            return ResponseEntity.ok(allDisciplineNames());
        }

        List<String> result = new ArrayList<>();
        for (AcademicServiceClient.SubjectInfo s : subjects) {
            String enumName = resolveEnumName(s);
            if (enumName != null && !result.contains(enumName)) result.add(enumName);
        }
        return ResponseEntity.ok(result.isEmpty() ? allDisciplineNames() : result);
    }

    private String resolveEnumName(AcademicServiceClient.SubjectInfo s) {
        if (s.getCode() != null && !s.getCode().isBlank()) {
            String code = s.getCode().trim().toUpperCase();
            try { DisciplinaEnum.valueOf(code); return code; }
            catch (IllegalArgumentException ignored) {}
        }
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
        return Arrays.stream(DisciplinaEnum.values()).map(Enum::name).collect(Collectors.toList());
    }
}
