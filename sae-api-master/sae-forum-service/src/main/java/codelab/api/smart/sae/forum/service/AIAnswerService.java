package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.model.ExpertAnswerEntity;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.ExpertAnswerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AIAnswerService {

    private static final Logger log = LoggerFactory.getLogger(AIAnswerService.class);
    private static final String AI_BOT = "assistente-ia";

    @Value("${ai.service.url:http://localhost:8086}")
    private String aiServiceUrl;

    private final RestTemplate rest = new RestTemplate();

    @Autowired private ExpertAnswerRepository expertAnswerRepository;
    @Autowired private ForumQuestionService questionService;
    @Autowired private NotificationService notificationService;

    @Transactional
    public ExpertAnswerEntity generateAndSave(Long questionId) {
        ForumQuestionEntity q = questionService.getEntityById(questionId);
        ExpertAnswerEntity answer = new ExpertAnswerEntity();
        answer.setQuestionId(questionId);
        answer.setAnsweredBy(AI_BOT);
        answer.setConteudo(generateResponse(q));
        answer.setAccepted(false);
        answer.setAiGenerated(true);
        answer = expertAnswerRepository.save(answer);
        notificationService.notifyNewAnswer(questionId, "EXPERT");
        return answer;
    }

    private String generateResponse(ForumQuestionEntity q) {
        try {
            return callAiService(q);
        } catch (Exception e) {
            log.warn("AI service call failed for question {}: {}", q.getId(), e.getMessage());
            return buildFallbackResponse(q);
        }
    }

    private String callAiService(ForumQuestionEntity q) {
        String disc = q.getDisciplina() != null ? q.getDisciplina().name() : "Geral";
        String message = String.format(
            "Sou um aluno com uma dúvida académica.\n\nDisciplina: %s\nTítulo: %s\nDescrição: %s\n\n" +
            "Por favor responde de forma clara, pedagógica e estruturada.",
            disc, q.getTitulo(), q.getDescricao());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "session_id", "forum-ai-" + UUID.randomUUID(),
            "message", message,
            "subject", disc
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> response = rest.postForObject(
            aiServiceUrl + "/api/v1/chat",
            new HttpEntity<>(body, headers),
            Map.class
        );

        if (response != null && response.containsKey("response")) {
            return (String) response.get("response");
        }
        return buildFallbackResponse(q);
    }

    private String buildFallbackResponse(ForumQuestionEntity q) {
        String disc = q.getDisciplina() != null ? q.getDisciplina().name() : "esta disciplina";
        return String.format(
            "Olá! Sou o Assistente IA do smartSAE. Analisei a tua dúvida sobre **%s** " +
            "na disciplina de **%s**.\n\n" +
            "O teu professor está temporariamente indisponível, mas podes:\n\n" +
            "1. Rever os apontamentos da aula sobre este tema\n" +
            "2. Consultar o livro de texto na secção correspondente na Biblioteca Digital\n" +
            "3. Pesquisar exemplos resolvidos semelhantes\n\n" +
            "Assim que o professor ficar disponível, irá responder detalhadamente. " +
            "Continua a estudar!",
            q.getTitulo(), disc);
    }
}
