package codelab.api.smart.sae.quiz.resource;

import codelab.api.smart.sae.quiz.dto.*;
import codelab.api.smart.sae.quiz.service.OralTestService;
import codelab.api.smart.sae.quiz.service.QuizGenerationService;
import codelab.api.smart.sae.quiz.service.QuizService;
import codelab.api.smart.sae.quiz.service.StudyPrepService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quizzes")
public class QuizResource {

    @Autowired
    private QuizService quizService;

    @Autowired private QuizGenerationService quizGenerationService;
    @Autowired private StudyPrepService studyPrepService;
    @Autowired private OralTestService oralTestService;

    @GetMapping
    public ResponseEntity<List<QuizSummaryDTO>> list(
            @RequestParam(required = false) String disciplina,
            Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMIN") || a.getAuthority().equals("PROFESSOR"));
        String username = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(quizService.listQuizzes(disciplina, isAdmin, username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizDTO> getForStudent(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getForStudent(id));
    }

    @GetMapping("/{id}/manage")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<QuizAdminDTO> getForAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getForAdmin(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<QuizAdminDTO> create(
            @Valid @RequestBody CreateQuizDTO dto,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.create(dto, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<QuizAdminDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateQuizDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(quizService.update(id, dto, auth.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        quizService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<QuizSummaryDTO> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.toggleActive(id));
    }

    @PostMapping("/{id}/questions")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<QuizAdminDTO> addQuestion(
            @PathVariable Long id,
            @Valid @RequestBody CreateQuestionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.addQuestion(id, dto));
    }

    @DeleteMapping("/{id}/questions/{qid}")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long id,
            @PathVariable Long qid) {
        quizService.deleteQuestion(id, qid);
        return ResponseEntity.noContent().build();
    }

    /** Gera um quiz com IA a partir de um intervalo de páginas de um livro da biblioteca */
    @PostMapping("/generate-from-content")
    public ResponseEntity<QuizAdminDTO> generateFromContent(
            @RequestBody GenerateFromContentDTO dto,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizGenerationService.generateFromContent(dto, auth.getName()));
    }

    /** Gera um quiz personalizado de preparação para teste ou exame */
    @PostMapping("/study-prep")
    public ResponseEntity<QuizAdminDTO> studyPrep(
            @RequestBody StudyPrepRequestDTO dto,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studyPrepService.generateStudyPrep(dto, auth.getName()));
    }

    /** Gera um teste oral de Inglês */
    @PostMapping("/oral-test/generate")
    public ResponseEntity<QuizAdminDTO> generateOralTest(
            @RequestBody OralTestRequestDTO dto,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(oralTestService.generateOralTest(dto, auth.getName()));
    }

    /** Avalia as respostas orais em 5 dimensões */
    @PostMapping("/oral-test/evaluate")
    public ResponseEntity<OralTestResultDTO> evaluateOralTest(
            @RequestBody OralTestEvaluateDTO dto) {
        return ResponseEntity.ok(oralTestService.evaluateOralTest(dto));
    }
}
