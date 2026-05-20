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
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class QuizGenerationService {

    private static final Logger log = LoggerFactory.getLogger(QuizGenerationService.class);
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini";

    @Value("${openai.api.key:}")
    private String apiKey;

    private final RestTemplate rest;

    public QuizGenerationService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(60_000);
        this.rest = new RestTemplate(factory);
    }
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
                dto.getDisciplina(), numQ, startPage, endPage);

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

        if (dto.getSectionId() != null) {
            quiz.setSectionId(dto.getSectionId());
            quiz.setQuizType("SECTION");
        }

        quiz = java.util.Objects.requireNonNull(quizRepository.save(quiz));

        int order = 1;
        for (GeneratedQuestion gq : questions) {
            QuizQuestionEntity q = new QuizQuestionEntity();
            q.setQuiz(quiz);
            q.setEnunciado(gq.enunciado);
            q.setOrdemNumero(order++);
            q.setExplicacao(gq.explicacao);
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

    private List<GeneratedQuestion> generateQuestions(
            String text, String title, String disc, int numQ, int startPage, int endPage) {
        if (apiKey != null && !apiKey.isBlank()) {
            try { return callOpenAI(text, title, disc, numQ, startPage, endPage); }
            catch (Exception e) { log.error("Erro na API OpenAI (GenerateFromContent): {}", e.getMessage()); }
        }
        log.warn("Chave OpenAI não configurada — a usar questões de exemplo.");
        return fallback(disc, numQ);
    }

    private List<GeneratedQuestion> callOpenAI(
            String text, String title, String disc, int numQ, int startPage, int endPage) throws Exception {

        String truncated = text.length() > 10000 ? text.substring(0, 10000) : text;
        String seed = "Sessão " + System.currentTimeMillis() % 100000;

        String systemPrompt = "És um professor experiente de " + (disc != null ? disc : "Geral")
                + " em Moçambique, especializado no programa do INDE (Instituto Nacional do Desenvolvimento da Educação). "
                + "Escreves sempre em português europeu (de Portugal), com ortografia correcta, acentuação completa e gramática rigorosa. "
                + "Nunca uses expressões brasileiras. Geras questões pedagógicas, claras e adequadas ao ensino secundário moçambicano.";

        String userPrompt = String.format(
                "Com base no texto abaixo (páginas %d–%d do livro «%s»), gera EXACTAMENTE %d questões de escolha múltipla diferentes "
                + "(4 opções A/B/C/D, exactamente 1 correcta cada). "
                + "(%s) As questões devem ser variadas, com diferentes estruturas. "
                + "As opções erradas devem ser plausíveis e pedagogicamente relevantes. "
                + "Para cada questão, inclui uma explicação clara (1-2 frases) de porquê a resposta está correcta, "
                + "indicando a página onde o aluno pode aprofundar o tema.\n\n"
                + "Texto:\n%s\n\n"
                + "Responde APENAS com JSON válido, sem texto adicional:\n"
                + "{\"questions\":[{\"enunciado\":\"...\",\"explicacao\":\"...\",\"options\":["
                + "{\"letra\":\"A\",\"texto\":\"...\",\"correta\":true},"
                + "{\"letra\":\"B\",\"texto\":\"...\",\"correta\":false},"
                + "{\"letra\":\"C\",\"texto\":\"...\",\"correta\":false},"
                + "{\"letra\":\"D\",\"texto\":\"...\",\"correta\":false}]}]}",
                startPage, endPage, title, numQ, seed, truncated);

        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", MODEL);
        body.put("max_tokens", 5000);
        body.put("temperature", 0.85);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user",   "content", userPrompt)
        ));

        ResponseEntity<Map<String, Object>> resp = rest.exchange(
                OPENAI_URL, HttpMethod.POST, new HttpEntity<>(body, h),
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

        Map<String, Object> responseBody = resp.getBody();
        if (responseBody == null) throw new RuntimeException("Resposta vazia da API OpenAI");

        List<?> choices = (List<?>) responseBody.get("choices");
        Map<?, ?> choice = (Map<?, ?>) choices.get(0);
        Map<?, ?> message = (Map<?, ?>) choice.get("message");
        String json = ((String) message.get("content")).trim();
        if (json.startsWith("```")) json = json.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();

        JsonNode root = objectMapper.readTree(json);
        List<GeneratedQuestion> result = new ArrayList<>();
        for (JsonNode qn : root.get("questions")) {
            GeneratedQuestion gq = new GeneratedQuestion();
            gq.enunciado  = qn.get("enunciado").asText();
            gq.explicacao = qn.has("explicacao") ? qn.get("explicacao").asText() : null;
            gq.options    = new ArrayList<>();
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
        String d = disc != null ? disc : "Geral";
        String[] topics = {
            "conceitos fundamentais de " + d,
            "aplicações práticas de " + d,
            "definições e terminologia de " + d,
            "exemplos teóricos de " + d
        };
        List<GeneratedQuestion> result = new ArrayList<>();
        for (int i = 0; i < numQ; i++) {
            GeneratedQuestion gq = new GeneratedQuestion();
            gq.enunciado  = "Questão " + (i + 1) + " sobre " + topics[i % 4] + ".";
            gq.explicacao = "A opção A é a correcta. Configura a chave OpenAI para geres questões reais.";
            gq.options    = new ArrayList<>();
            String[] lets = {"A", "B", "C", "D"};
            for (int j = 0; j < 4; j++) {
                GeneratedOption go = new GeneratedOption();
                go.letra   = lets[j];
                go.texto   = j == 0 ? "Resposta correcta (exemplo)" : "Opção " + lets[j] + " (exemplo)";
                go.correta = (j == 0);
                gq.options.add(go);
            }
            result.add(gq);
        }
        return result;
    }

    private static class GeneratedQuestion {
        String enunciado;
        String explicacao;
        List<GeneratedOption> options;
    }

    private static class GeneratedOption {
        String letra;
        String texto;
        boolean correta;
    }
}
