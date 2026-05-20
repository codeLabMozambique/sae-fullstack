package codelab.api.smart.sae.forum.scheduler;

import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.ExpertAnswerRepository;
import codelab.api.smart.sae.forum.repository.ForumQuestionRepository;
import codelab.api.smart.sae.forum.service.AIAnswerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A cada hora verifica perguntas ESPECIALIZADAS abertas sem resposta de
 * professor há mais de N horas e gera automaticamente uma resposta via IA.
 */
@Component
public class ForumAiScheduler {

    private static final Logger log = LoggerFactory.getLogger(ForumAiScheduler.class);

    @Value("${forum.ai.auto-answer.enabled:true}")
    private boolean autoAnswerEnabled;

    @Value("${forum.ai.auto-answer.delay-hours:2}")
    private int delayHours;

    @Autowired private ForumQuestionRepository questionRepository;
    @Autowired private ExpertAnswerRepository expertAnswerRepository;
    @Autowired private AIAnswerService aiAnswerService;

    @Scheduled(fixedDelayString = "${forum.ai.auto-answer.check-interval-ms:3600000}")
    public void autoAnswerPendingQuestions() {
        if (!autoAnswerEnabled) return;

        LocalDateTime cutoff = LocalDateTime.now().minusHours(delayHours);

        List<ForumQuestionEntity> unanswered = questionRepository
            .findByQuestionTypeAndStatus(QuestionType.ESPECIALIZADO, QuestionStatus.ABERTA)
            .stream()
            .filter(q -> q.getCreatedAt() != null && q.getCreatedAt().isBefore(cutoff))
            .filter(q -> !expertAnswerRepository.existsByQuestionId(q.getId()))
            .toList();

        if (unanswered.isEmpty()) {
            log.debug("Nenhuma pergunta sem resposta após {}h", delayHours);
            return;
        }

        log.info("Auto-resposta IA: {} perguntas sem resposta há mais de {}h", unanswered.size(), delayHours);
        for (ForumQuestionEntity q : unanswered) {
            try {
                aiAnswerService.generateAndSave(q.getId());
                log.info("Resposta IA gerada para pergunta id={} titulo={}", q.getId(), q.getTitulo());
            } catch (Exception e) {
                log.error("Falha ao gerar resposta IA para pergunta id={}: {}", q.getId(), e.getMessage());
            }
        }
    }
}
