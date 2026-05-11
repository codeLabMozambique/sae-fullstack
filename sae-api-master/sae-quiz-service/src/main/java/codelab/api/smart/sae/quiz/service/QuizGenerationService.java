package codelab.api.smart.sae.quiz.service;

import codelab.api.smart.sae.quiz.dto.GenerateFromContentDTO;
import codelab.api.smart.sae.quiz.dto.QuizAdminDTO;
import codelab.api.smart.sae.quiz.enums.DisciplinaEnum;
import codelab.api.smart.sae.quiz.model.QuizEntity;
import codelab.api.smart.sae.quiz.model.QuizOptionEntity;
import codelab.api.smart.sae.quiz.model.QuizQuestionEntity;
import codelab.api.smart.sae.quiz.repository.QuizOptionRepository;
import codelab.api.smart.sae.quiz.repository.QuizQuestionRepository;
import codelab.api.smart.sae.quiz.repository.QuizRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class QuizGenerationService {

    private static final Logger log = LoggerFactory.getLogger(QuizGenerationService.class);
    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-haiku-4-5-20251001";

    @Value("${anthropic.api.key:}")
    private String apiKey;

    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired private ContentServiceClient contentClient;
    @Autowired private QuizRepository quizRepository;
    @Autowired private QuizQuestionRepository questionRepository;
    @Autowired private QuizOptionRepository optionRepository;
    @Autowired private QuizService quizService;

    @Transactional
    public QuizAdminDTO generateFromContent(GenerateFromContentDTO dto, String createdBy) {
        int startPage = dto.getStartPage() != null ? dto.getStartPage() : 1;
        int endPage   = dto.getEndPage()   != null ? dto.getEndPage()   : startPage + 20;
        int numQ      = dto.getNumQuestions() != null ? dto.getNumQuestions() : 10;

        ContentServiceClient.ContentInfo info = contentClient.getContentInfo(dto.getContentId());
        String text = contentClient.extractText(dto.getContentId(), startPage, endPage);

        List<GeneratedQuestion> questions = generateQuestions(text, info.getTitle(),
                dto.getDisciplina(), numQ);

        QuizEntity quiz = new QuizEntity();
        String secLabel = dto.getSectionName() != null
                ? " — " + dto.getSectionName()
                : " (pág. " + startPage + "–" + endPage + ")";
        quiz.setTitulo(info.getTitle() + secLabel);
        quiz.setDescricao("Quiz gerado por IA • páginas " + startPage + "–" + endPage);

        String disc = dto.getDisciplina() != null ? dto.getDisciplina().toUpperCase()
                : (info.getDiscipline() != null ? info.getDiscipline().toUpperCase() : "GERAL");
        try { quiz.setDisciplina(DisciplinaEnum.valueOf(disc)); }
        catch (IllegalArgumentException e) { quiz.setDisciplina(DisciplinaEnum.GERAL); }

        quiz.setTempoLimiteMinutos(dto.getTempoLimiteMinutos() != null ? dto.getTempoLimiteMinutos() : 15);
        quiz.setCreatedBy(createdBy);
        quiz.setContentId(dto.getContentId());
        quiz.setStartPage(startPage);
        quiz.setEndPage(endPage);
        quiz.setAiGenerated(true);
        quiz.setActive(true);
        quiz = java.util.Objects.requireNonNull(quizRepository.save(quiz));

        int order = 1;
        for (GeneratedQuestion gq : questions) {
            QuizQuestionEntity q = new QuizQuestionEntity();
            q.setQuiz(quiz);
            q.setEnunciado(gq.enunciado);
            q.setOrdemNumero(order++);
            q = java.util.Objects.requireNonNull(questionRepository.save(q));
            for (GeneratedOption go : gq.options) {
                QuizOptionEntity opt = new QuizOptionEntity();
                opt.setQuestion(q);
                opt.setTexto(go.texto);
                opt.setLetra(go.letra);
                opt.setCorreta(go.correta);
                optionRepository.save(opt);
            }
        }

        return quizService.toAdminDTO(quizRepository.findById(quiz.getId()).orElseThrow());
    }

    private List<GeneratedQuestion> generateQuestions(String text, String title, String disc, int numQ) {
        if (apiKey != null && !apiKey.isBlank()) {
            try { return callClaude(text, title, disc, numQ); }
            catch (Exception e) { log.error("Claude API error: {}", e.getMessage()); }
        }
        return fallback(disc, numQ);
    }

    private List<GeneratedQuestion> callClaude(String text, String title, String disc, int numQ) throws Exception {
        String truncated = text.length() > 8000 ? text.substring(0, 8000) : text;
        String prompt = String.format(
            "És um professor de %s em Moçambique. Com base no texto abaixo, gera exactamente %d questões " +
            "de escolha múltipla (4 opções A/B/C/D, exactamente 1 correcta cada).\n\n" +
            "Texto do livro \"%s\":\n%s\n\n" +
            "Responde APENAS com JSON válido no formato:\n" +
            "{\"questions\":[{\"enunciado\":\"...\",\"options\":[" +
            "{\"letra\":\"A\",\"texto\":\"...\",\"correta\":true}," +
            "{\"letra\":\"B\",\"texto\":\"...\",\"correta\":false}," +
            "{\"letra\":\"C\",\"texto\":\"...\",\"correta\":false}," +
            "{\"letra\":\"D\",\"texto\":\"...\",\"correta\":false}]}]}",
            disc != null ? disc : "Geral", numQ, title, truncated);

        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("x-api-key", apiKey);
        h.set("anthropic-version", "2023-06-01");

        Map<String, Object> body = Map.of(
            "model", MODEL, "max_tokens", 4096,
            "messages", List.of(Map.of("role", "user", "content", prompt)));

        ResponseEntity<Map<String, Object>> resp = rest.exchange(
            ANTHROPIC_URL, HttpMethod.POST, new HttpEntity<>(body, h), 
            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

        Map<String, Object> responseBody = resp.getBody();
        if (responseBody == null) throw new RuntimeException("Empty response from Anthropic API");
        List<?> content = (List<?>) responseBody.get("content");
        String json = (String) ((Map<?, ?>) content.get(0)).get("text");
        json = json.trim();
        if (json.startsWith("```")) json = json.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();

        JsonNode root = objectMapper.readTree(json);
        List<GeneratedQuestion> result = new ArrayList<>();
        for (JsonNode qn : root.get("questions")) {
            GeneratedQuestion gq = new GeneratedQuestion();
            gq.enunciado = qn.get("enunciado").asText();
            gq.options = new ArrayList<>();
            for (JsonNode on : qn.get("options")) {
                GeneratedOption go = new GeneratedOption();
                go.letra   = on.get("letra").asText();
                go.texto   = on.get("texto").asText();
                go.correta = on.get("correta").asBoolean();
                gq.options.add(go);
            }
            result.add(gq);
        }
        return result;
    }

    private List<GeneratedQuestion> fallback(String disc, int numQ) {
        String[] topics = {"conceitos fundamentais", "aplicações práticas", "definições", "exemplos teóricos"};
        List<GeneratedQuestion> result = new ArrayList<>();
        for (int i = 0; i < numQ; i++) {
            GeneratedQuestion gq = new GeneratedQuestion();
            gq.enunciado = "Questão " + (i + 1) + " sobre " + topics[i % 4] + " de " + disc + "?";
            gq.options = new ArrayList<>();
            String[] lets = {"A", "B", "C", "D"};
            for (int j = 0; j < 4; j++) {
                GeneratedOption go = new GeneratedOption();
                go.letra   = lets[j];
                go.texto   = "Opção " + lets[j] + " da questão " + (i + 1);
                go.correta = (j == 0);
                gq.options.add(go);
            }
            result.add(gq);
        }
        return result;
    }

    private static class GeneratedQuestion {
        String enunciado;
        List<GeneratedOption> options;
    }

    private static class GeneratedOption {
        String letra;
        String texto;
        boolean correta;
    }
}
