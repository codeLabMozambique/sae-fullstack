package codelab.api.smart.sae.forum.scheduler;

import codelab.api.smart.sae.forum.enums.ValidationStatus;
import codelab.api.smart.sae.forum.model.CollaborativeAnswerEntity;
import codelab.api.smart.sae.forum.repository.CollaborativeAnswerRepository;
import codelab.api.smart.sae.forum.repository.ForumQuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class PendingAnswersScheduler {

    private static final Logger log = LoggerFactory.getLogger(PendingAnswersScheduler.class);

    @Autowired private CollaborativeAnswerRepository collaborativeAnswerRepository;
    @Autowired private ForumQuestionRepository questionRepository;
    @Autowired private JavaMailSender mailSender;

    @Value("${forum.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${forum.mail.from:noreply@sae.edu}")
    private String mailFrom;

    @Value("${forum.mail.base-url:http://localhost:5173}")
    private String baseUrl;

    @Scheduled(cron = "0 0 8 * * *")
    public void sendPendingAnswersSummary() {
        if (!mailEnabled) {
            log.info("Scheduler de e-mail desactivado (forum.mail.enabled=false)");
            return;
        }

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<CollaborativeAnswerEntity> pending = collaborativeAnswerRepository
            .findByValidationStatusAndCreatedAtAfter(ValidationStatus.PENDENTE, since);

        if (pending.isEmpty()) {
            log.info("Sem respostas pendentes nas últimas 24h — nenhum e-mail enviado");
            return;
        }

        // Group by question area for targeted notification
        Map<Long, List<CollaborativeAnswerEntity>> byQuestion = pending.stream()
            .collect(Collectors.groupingBy(CollaborativeAnswerEntity::getQuestionId));

        StringBuilder body = new StringBuilder();
        body.append("Respostas colaborativas pendentes de validação nas últimas 24 horas:\n\n");

        byQuestion.forEach((questionId, answers) -> {
            questionRepository.findById(questionId).ifPresent(q -> {
                body.append("Pergunta: ").append(q.getTitulo()).append("\n");
                body.append("Área: ").append(q.getDisciplina()).append("\n");
                answers.forEach(a ->
                    body.append("  • ").append(a.getAnsweredBy())
                        .append(" — ").append(baseUrl).append("/app/forum/questions/").append(questionId)
                        .append("\n")
                );
                body.append("\n");
            });
        });

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(mailFrom); // Em produção: lista de professores
            message.setSubject("Respostas pendentes de validação — SAE Forum");
            message.setText(body.toString());
            mailSender.send(message);
            log.info("E-mail de resumo enviado com {} respostas pendentes", pending.size());
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail de resumo: {}", e.getMessage());
        }
    }
}
