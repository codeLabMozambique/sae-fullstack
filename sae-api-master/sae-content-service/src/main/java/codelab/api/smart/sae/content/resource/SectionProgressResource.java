package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.ContentSection;
import codelab.api.smart.sae.content.model.SectionProgress;
import codelab.api.smart.sae.content.repository.ContentSectionRepository;
import codelab.api.smart.sae.content.repository.SectionProgressRepository;
import codelab.api.smart.sae.content.security.JwtPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user/section-progress")
public class SectionProgressResource {

    @Autowired private SectionProgressRepository progressRepo;
    @Autowired private ContentSectionRepository sectionRepo;

    /** Lista o progresso de todas as secções de um livro para o utilizador autenticado */
    @GetMapping
    public ResponseEntity<List<SectionProgress>> list(@RequestParam String contentId) {
        String userId = JwtPrincipal.currentUserIdOrThrow();
        return ResponseEntity.ok(progressRepo.findByUserIdAndContentId(userId, contentId));
    }

    /** Regista ou actualiza o resultado de um quiz de secção */
    @PostMapping("/{sectionId}/complete")
    public ResponseEntity<SectionProgress> complete(
            @PathVariable String sectionId,
            @RequestBody Map<String, Object> body) {

        String userId = JwtPrincipal.currentUserIdOrThrow();

        int score           = body.containsKey("score")           ? ((Number) body.get("score")).intValue()           : 0;
        int totalQuestions  = body.containsKey("totalQuestions")  ? ((Number) body.get("totalQuestions")).intValue()  : 0;
        int correctAnswers  = body.containsKey("correctAnswers")  ? ((Number) body.get("correctAnswers")).intValue()  : 0;
        Long quizAttemptId  = body.containsKey("quizAttemptId")  ? ((Number) body.get("quizAttemptId")).longValue()  : null;
        String contentId    = body.containsKey("contentId")       ? (String) body.get("contentId")                    : null;

        SectionProgress sp = progressRepo.findByUserIdAndSectionId(userId, sectionId)
                .orElseGet(() -> {
                    SectionProgress n = new SectionProgress();
                    n.setUserId(userId);
                    n.setSectionId(sectionId);
                    n.setContentId(contentId);
                    return n;
                });

        sp.setScore(score);
        sp.setTotalQuestions(totalQuestions);
        sp.setCorrectAnswers(correctAnswers);
        sp.setCompleted(true);
        sp.setQuizAttemptId(quizAttemptId);
        sp.setCompletedAt(LocalDateTime.now());

        return ResponseEntity.ok(progressRepo.save(sp));
    }

    /** Liga um quizId a uma secção (professor/admin) */
    @PatchMapping("/sections/{sectionId}/quiz")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<ContentSection> linkQuiz(
            @PathVariable String sectionId,
            @RequestBody Map<String, Object> body) {

        Long quizId = body.containsKey("quizId") ? ((Number) body.get("quizId")).longValue() : null;
        ContentSection section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Secção não encontrada"));
        section.setQuizId(quizId);
        return ResponseEntity.ok(sectionRepo.save(section));
    }

    /** Obtém o progresso de uma secção específica para o utilizador autenticado */
    @GetMapping("/{sectionId}")
    public ResponseEntity<?> getOne(@PathVariable String sectionId) {
        String userId = JwtPrincipal.currentUserIdOrThrow();
        Optional<SectionProgress> sp = progressRepo.findByUserIdAndSectionId(userId, sectionId);
        return sp.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(Map.of("completed", false, "score", 0)));
    }
}
