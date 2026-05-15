package codelab.api.smart.sae.quiz.service;

import codelab.api.smart.sae.quiz.dto.QuizAdminDTO;
import codelab.api.smart.sae.quiz.dto.StudyPrepRequestDTO;
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

import java.util.*;

@Service
public class StudyPrepService {

    private static final Logger log = LoggerFactory.getLogger(StudyPrepService.class);
    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-sonnet-4-6";

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
    public QuizAdminDTO generateStudyPrep(StudyPrepRequestDTO dto, String studentUsername) {
        int numQ = dto.getNumQuestions() != null ? dto.getNumQuestions() : 10;
        boolean isExam = "EXAM".equalsIgnoreCase(dto.getMode());

        String contentText = "";
        String contentTitle = dto.getDisciplina() != null ? dto.getDisciplina() : "Geral";
        int totalPages = 0;

        if (dto.getContentId() != null) {
            try {
                ContentServiceClient.ContentInfo info = contentClient.getContentInfo(dto.getContentId());
                contentTitle = info.getTitle();
                totalPages = info.getTotalPages() != null ? info.getTotalPages() : 0;
                int endPage = isExam ? totalPages : Math.min(totalPages, 60);
                contentText = contentClient.extractText(dto.getContentId(), 1, Math.max(endPage, 1));
            } catch (Exception e) {
                log.warn("Não foi possível obter conteúdo: {}", e.getMessage());
            }
        }

        List<GeneratedQuestion> questions = generateQuestions(
                contentText, contentTitle, dto.getDisciplina(), numQ, isExam, totalPages);

        QuizEntity quiz = new QuizEntity();
        String modeLabel = isExam ? "Preparação para Exame" : "Preparação para Teste";
        quiz.setTitulo(modeLabel + " — " + (dto.getDisciplina() != null ? dto.getDisciplina() : "Geral"));
        quiz.setDescricao(isExam
                ? "Quiz personalizado para preparação de exame gerado por IA com base no conteúdo da disciplina."
                : "Quiz personalizado para preparação de teste gerado por IA com base no conteúdo recente da disciplina.");

        String disc = dto.getDisciplina() != null ? dto.getDisciplina().toUpperCase() : "GERAL";
        try { quiz.setDisciplina(DisciplinaEnum.valueOf(disc)); }
        catch (IllegalArgumentException e) { quiz.setDisciplina(DisciplinaEnum.GERAL); }

        quiz.setTempoLimiteMinutos(isExam ? 45 : 20);
        quiz.setCreatedBy(studentUsername);
        quiz.setContentId(dto.getContentId());
        quiz.setAiGenerated(true);
        quiz.setActive(true);
        quiz.setQuizType("STUDY_PREP");
        quiz = Objects.requireNonNull(quizRepository.save(quiz));

        int order = 1;
        for (GeneratedQuestion gq : questions) {
            QuizQuestionEntity q = new QuizQuestionEntity();
            q.setQuiz(quiz);
            q.setEnunciado(gq.enunciado);
            q.setOrdemNumero(order++);
            q.setExplicacao(gq.explicacao);
            q = Objects.requireNonNull(questionRepository.save(q));
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
            String text, String title, String disc, int numQ, boolean isExam, int totalPages) {
        if (apiKey != null && !apiKey.isBlank()) {
            try { return callClaude(text, title, disc, numQ, isExam, totalPages); }
            catch (Exception e) { log.error("Claude API error no StudyPrep: {}", e.getMessage()); }
        }
        return fallback(disc, numQ);
    }

    private List<GeneratedQuestion> callClaude(
            String text, String title, String disc, int numQ, boolean isExam, int totalPages) throws Exception {

        String truncated = text.length() > 10000 ? text.substring(0, 10000) : text;
        String modeInstructions = isExam
                ? "Cria questões abrangentes para um EXAME FINAL. Inclui questões de análise, síntese e aplicação de conceitos. Abrange todos os temas do conteúdo."
                : "Cria questões para um TESTE NORMAL. Foca nos conceitos mais recentes e fundamentais do conteúdo.";

        String pageRef = totalPages > 0
                ? " Na explicação, indica a página do livro onde o estudante pode encontrar mais informação (ex: 'Ver página 23.')."
                : "";

        String prompt = String.format(
            "És um professor experiente de %s em Moçambique a preparar os seus alunos para avaliações.\n\n" +
            "%s\n\n" +
            "Com base no conteúdo do livro \"%s\":\n%s\n\n" +
            "Gera exactamente %d questões de escolha múltipla (4 opções A/B/C/D, 1 correcta).\n" +
            "Para cada questão:\n" +
            "- O enunciado deve ser claro e pedagogicamente correcto\n" +
            "- A explicação deve justificar a resposta correcta em 1-2 frases%s\n" +
            "- As opções erradas devem ser plausíveis (não obviamente erradas)\n\n" +
            "Responde APENAS com JSON válido:\n" +
            "{\"questions\":[{\"enunciado\":\"...\",\"explicacao\":\"...\",\"options\":[" +
            "{\"letra\":\"A\",\"texto\":\"...\",\"correta\":true}," +
            "{\"letra\":\"B\",\"texto\":\"...\",\"correta\":false}," +
            "{\"letra\":\"C\",\"texto\":\"...\",\"correta\":false}," +
            "{\"letra\":\"D\",\"texto\":\"...\",\"correta\":false}]}]}",
            disc != null ? disc : "Geral", modeInstructions, title, truncated, numQ, pageRef);

        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("x-api-key", apiKey);
        h.set("anthropic-version", "2023-06-01");

        Map<String, Object> body = Map.of(
            "model", MODEL, "max_tokens", 6000,
            "messages", List.of(Map.of("role", "user", "content", prompt)));

        ResponseEntity<Map<String, Object>> resp = rest.exchange(
            ANTHROPIC_URL, HttpMethod.POST, new HttpEntity<>(body, h),
            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

        Map<String, Object> responseBody = resp.getBody();
        if (responseBody == null) throw new RuntimeException("Resposta vazia da API Anthropic");
        List<?> content = (List<?>) responseBody.get("content");
        String json = (String) ((Map<?, ?>) content.get(0)).get("text");
        json = json.trim();
        if (json.startsWith("```")) json = json.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();

        JsonNode root = objectMapper.readTree(json);
        List<GeneratedQuestion> result = new ArrayList<>();
        for (JsonNode qn : root.get("questions")) {
            GeneratedQuestion gq = new GeneratedQuestion();
            gq.enunciado = qn.get("enunciado").asText();
            gq.explicacao = qn.has("explicacao") ? qn.get("explicacao").asText() : null;
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
        List<GeneratedQuestion> result = new ArrayList<>();
        String[] topics = {"conceitos fundamentais", "aplicações práticas", "definições", "análise crítica"};
        for (int i = 0; i < numQ; i++) {
            GeneratedQuestion gq = new GeneratedQuestion();
            gq.enunciado  = "Questão de preparação " + (i + 1) + " sobre " + topics[i % 4] + " de " + disc + "?";
            gq.explicacao = "Esta é a explicação da resposta correcta para a questão " + (i + 1) + ".";
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
        String explicacao;
        List<GeneratedOption> options;
    }

    private static class GeneratedOption {
        String letra;
        String texto;
        boolean correta;
    }
}
