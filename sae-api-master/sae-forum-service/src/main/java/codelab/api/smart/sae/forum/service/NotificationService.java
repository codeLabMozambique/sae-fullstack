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
            "/topic/questions/" + area,
            Map.of("event", "NEW_QUESTION", "id", questionId, "summary", titulo)
        );
    }

    public void notifyNewAnswer(Long questionId, String type) {
        messagingTemplate.convertAndSend(
            "/topic/answers/" + questionId,
            Map.of("event", "NEW_ANSWER", "id", questionId, "type", type)
        );
    }

    public void notifyAnswerAccepted(Long questionId, Long answerId) {
        messagingTemplate.convertAndSend(
            "/topic/answers/" + questionId,
            Map.of("event", "ANSWER_ACCEPTED", "id", answerId, "questionId", questionId)
        );
    }

    public void notifyAnswerValidated(Long questionId, Long answerId) {
        messagingTemplate.convertAndSend(
            "/topic/validations/" + questionId,
            Map.of("event", "ANSWER_VALIDATED", "id", answerId, "questionId", questionId)
        );
    }
}
