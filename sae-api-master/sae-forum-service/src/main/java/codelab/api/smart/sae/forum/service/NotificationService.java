package codelab.api.smart.sae.forum.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyNewQuestion(Long questionId, String area, String titulo) {
        messagingTemplate.convertAndSend(
            "/topic/questions/" + java.util.Objects.requireNonNull(area),
            Map.of("event", "NEW_QUESTION", "id", java.util.Objects.requireNonNull(questionId), "summary", java.util.Objects.requireNonNull(titulo))
        );
    }

    public void notifyNewAnswer(Long questionId, String type) {
        messagingTemplate.convertAndSend(
            "/topic/answers/" + java.util.Objects.requireNonNull(questionId),
            Map.of("event", "NEW_ANSWER", "id", java.util.Objects.requireNonNull(questionId), "type", java.util.Objects.requireNonNull(type))
        );
    }

    public void notifyAnswerAccepted(Long questionId, Long answerId) {
        messagingTemplate.convertAndSend(
            "/topic/answers/" + java.util.Objects.requireNonNull(questionId),
            Map.of("event", "ANSWER_ACCEPTED", "id", java.util.Objects.requireNonNull(answerId), "questionId", java.util.Objects.requireNonNull(questionId))
        );
    }

    public void notifyAnswerValidated(Long questionId, Long answerId) {
        messagingTemplate.convertAndSend(
            "/topic/validations/" + java.util.Objects.requireNonNull(questionId),
            Map.of("event", "ANSWER_VALIDATED", "id", java.util.Objects.requireNonNull(answerId), "questionId", java.util.Objects.requireNonNull(questionId))
        );
    }

    /** Notifica a caixa de entrada pessoal do professor (nova pergunta ou follow-up do aluno). */
    public void notifyProfessorInbox(String professorUsername, Long questionId, String summary) {
        if (professorUsername == null || professorUsername.isBlank()) return;
        messagingTemplate.convertAndSend(
            "/topic/professor/" + professorUsername,
            Map.of("event", "NEW_QUESTION", "id", java.util.Objects.requireNonNull(questionId), "summary", summary != null ? summary : "")
        );
    }

    /** Notifica o aluno directamente quando o professor responde à sua pergunta. */
    public void notifyStudentInbox(String studentUsername, Long questionId) {
        if (studentUsername == null || studentUsername.isBlank()) return;
        messagingTemplate.convertAndSend(
            "/topic/student/" + studentUsername,
            Map.of("event", "NEW_ANSWER", "id", java.util.Objects.requireNonNull(questionId))
        );
    }
}
