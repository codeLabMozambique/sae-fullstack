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
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AIAnswerService {

    private static final Logger log = LoggerFactory.getLogger(AIAnswerService.class);
    private static final String AI_BOT = "assistente-ia";
    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-haiku-4-5-20251001";

    @Value("${anthropic.api.key:}")
    private String apiKey;

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
        if (apiKey != null && !apiKey.isBlank()) return callClaude(q);
        String disc = q.getDisciplina() != null ? q.getDisciplina().name() : "esta disciplina";
        return String.format(
            "Ola! Sou o Assistente IA do smartSAE. Analisei a tua duvida sobre **%s** " +
            "na disciplina de **%s**.\n\n" +
            "O teu professor esta temporariamente indisponivel, mas podes:\n\n" +
            "1. Rever os apontamentos da aula sobre este tema\n" +
            "2. Consultar o livro de texto na seccao correspondente\n" +
            "3. Pesquisar exemplos resolvidos semelhantes na biblioteca digital\n\n" +
            "Assim que o professor ficar disponivel, ira responder detalhadamente. " +
            "Continua a estudar!",
            q.getTitulo(), disc);
    }

    private String callClaude(ForumQuestionEntity q) {
        try {
            String prompt = String.format(
                "Es um assistente educativo do smartSAE de Mocambique. " +
                "Disciplina: %s. Titulo da duvida: %s. Descricao: %s. " +
                "Responde de forma clara, pedagogica e estruturada em portugues. " +
                "Indica quando o aluno deve consultar o professor para aprofundar.",
                q.getDisciplina() != null ? q.getDisciplina().name() : "Geral",
                q.getTitulo(), q.getDescricao());

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("x-api-key", apiKey);
            h.set("anthropic-version", "2023-06-01");

            Map<String, Object> body = Map.of(
                "model", MODEL,
                "max_tokens", 1024,
                "messages", List.of(Map.of("role", "user", "content", prompt)));

            ResponseEntity<Map<String, Object>> resp = rest.exchange(
                ANTHROPIC_URL, HttpMethod.POST, new HttpEntity<>(body, h), 
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

            Map<String, Object> responseBody = resp.getBody();
            if (responseBody == null) return "Nao foi possivel gerar uma resposta automatica.";
            
            List<?> content = (List<?>) responseBody.get("content");
            if (content != null && !content.isEmpty())
                return (String) ((Map<?, ?>) content.get(0)).get("text");

        } catch (Exception e) {
            log.error("Anthropic API error: {}", e.getMessage());
        }
        return "Nao foi possivel gerar uma resposta automatica. Aguarda a resposta do teu professor.";
    }
}
