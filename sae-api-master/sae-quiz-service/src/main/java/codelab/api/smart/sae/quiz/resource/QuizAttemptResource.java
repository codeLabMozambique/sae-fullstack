package codelab.api.smart.sae.quiz.resource;

import codelab.api.smart.sae.quiz.dto.*;
import codelab.api.smart.sae.quiz.service.QuizAttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/attempts")
public class QuizAttemptResource {

    @Autowired
    private QuizAttemptService attemptService;

    @PostMapping("/start")
    public ResponseEntity<StartAttemptResponseDTO> startAttempt(
            @RequestParam Long quizId,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attemptService.startAttempt(quizId, auth.getName()));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<QuizResultDTO> submitAttempt(
            @PathVariable Long id,
            @RequestBody SubmitAttemptDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(attemptService.submitAttempt(id, dto, auth.getName()));
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<QuizResultDTO> getResult(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(attemptService.getResult(id, auth.getName()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<QuizSummaryDTO>> getMyAttempts(Authentication auth) {
        return ResponseEntity.ok(attemptService.getMyAttempts(auth.getName()));
    }
}
