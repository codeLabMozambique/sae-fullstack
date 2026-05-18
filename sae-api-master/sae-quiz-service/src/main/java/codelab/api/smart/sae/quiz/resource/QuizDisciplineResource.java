package codelab.api.smart.sae.quiz.resource;

import codelab.api.smart.sae.quiz.enums.DisciplinaEnum;
import codelab.api.smart.sae.quiz.service.AcademicServiceClient;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/disciplines")
public class QuizDisciplineResource {

    @Autowired
    private AcademicServiceClient academicServiceClient;

    /**
     * Devolve as disciplinas do serviço académico com id + name + code.
     * Usado para popular dropdowns e filtrar quizzes por subjectId.
     * Fallback: enum hardcoded quando o serviço académico não responde.
     */
    @GetMapping("/all")
    public ResponseEntity<List<AcademicServiceClient.SubjectInfo>> getAllDisciplines(HttpServletRequest request) {
        String jwt = request.getHeader("Authorization");
        List<AcademicServiceClient.SubjectInfo> subjects = academicServiceClient.getAllActiveSubjects(jwt);
        if (!subjects.isEmpty()) {
            return ResponseEntity.ok(subjects);
        }
        List<AcademicServiceClient.SubjectInfo> fallback = Arrays.stream(DisciplinaEnum.values())
                .map(d -> {
                    AcademicServiceClient.SubjectInfo s = new AcademicServiceClient.SubjectInfo();
                    s.setName(d.getDisplayName());
                    s.setCode(d.name());
                    return s;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(fallback);
    }
}
