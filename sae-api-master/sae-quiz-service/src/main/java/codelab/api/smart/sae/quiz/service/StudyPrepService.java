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
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class StudyPrepService {

    private static final Logger log = LoggerFactory.getLogger(StudyPrepService.class);
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini";

    @Value("${openai.api.key:}")
    private String apiKey;

    private final RestTemplate rest;

    public StudyPrepService() {
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
                contentText, contentTitle, dto.getDisciplina(), numQ, isExam, totalPages,
                dto.getForumContext());

        QuizEntity quiz = new QuizEntity();
        String modeLabel = isExam ? "Preparação para Exame" : "Preparação para Teste";
        quiz.setTitulo(modeLabel + " — " + (dto.getDisciplina() != null ? dto.getDisciplina() : "Geral"));
        quiz.setDescricao(isExam
                ? "Quiz personalizado para preparação de exame, gerado por IA com base nos conteúdos da disciplina."
                : "Quiz personalizado para preparação de teste, gerado por IA com base nos conteúdos recentes da disciplina.");

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
            String text, String title, String disc, int numQ, boolean isExam,
            int totalPages, String forumContext) {
        if (apiKey != null && !apiKey.isBlank()) {
            try { return callOpenAI(text, title, disc, numQ, isExam, totalPages, forumContext); }
            catch (Exception e) { log.error("Erro na API OpenAI (StudyPrep): {}", e.getMessage()); }
        }
        log.warn("Chave OpenAI não configurada — a usar questões de exemplo. Adiciona a chave em application.yml.");
        return fallback(disc, numQ);
    }

    private List<GeneratedQuestion> callOpenAI(
            String text, String title, String disc, int numQ, boolean isExam,
            int totalPages, String forumContext) throws Exception {

        String truncated = text.length() > 12000 ? text.substring(0, 12000) : text;

        String modeInstructions = isExam
                ? "Cria questões abrangentes para um EXAME FINAL. Inclui questões de análise, síntese e aplicação de conceitos. Abrange todos os temas do programa."
                : "Cria questões para um TESTE NORMAL. Foca nos conceitos mais recentes e fundamentais do programa.";

        String pageRef = totalPages > 0
                ? " Na explicação, indica a página do livro onde o estudante pode encontrar mais informação (ex.: «Ver página 23.»)."
                : "";

        String forumSection = "";
        if (forumContext != null && !forumContext.isBlank()) {
            forumSection = "\n\nDúvidas e respostas reais dos alunos no fórum desta disciplina (usa como referência adicional para identificar tópicos onde os alunos têm dificuldades):\n"
                    + forumContext.substring(0, Math.min(forumContext.length(), 3000));
        }

        // Seed de aleatoriedade para garantir questões diferentes em cada geração
        String seed = "Sessão " + System.currentTimeMillis() % 100000;

        String systemPrompt = "És um professor experiente de " + (disc != null ? disc : "Geral")
                + " em Moçambique, especializado no programa do INDE (Instituto Nacional do Desenvolvimento da Educação). "
                + "Escreves sempre em português europeu (de Portugal), com ortografia correcta, acentuação completa e gramática rigorosa. "
                + "Nunca uses expressões brasileiras. Geras questões pedagógicas, claras e com nível de dificuldade adequado ao ensino secundário moçambicano.";

        String userPrompt = String.format(
                "%s\n\n" +
                "Conteúdo do livro «%s»:\n%s%s\n\n" +
                "(%s) Gera EXACTAMENTE %d questões de escolha múltipla diferentes (4 opções A/B/C/D, exactamente 1 correcta cada). " +
                "As questões devem ser variadas: evita repetir a mesma estrutura. " +
                "As opções erradas devem ser plausíveis e pedagogicamente relevantes (não podem ser obviamente incorrectas). " +
                "Para cada questão, inclui uma explicação clara (1-2 frases) de porquê a resposta está correcta.%s\n\n" +
                "Responde APENAS com JSON válido, sem texto adicional:\n" +
                "{\"questions\":[{\"enunciado\":\"...\",\"explicacao\":\"...\",\"options\":[" +
                "{\"letra\":\"A\",\"texto\":\"...\",\"correta\":true}," +
                "{\"letra\":\"B\",\"texto\":\"...\",\"correta\":false}," +
                "{\"letra\":\"C\",\"texto\":\"...\",\"correta\":false}," +
                "{\"letra\":\"D\",\"texto\":\"...\",\"correta\":false}]}]}",
                modeInstructions, title, truncated, forumSection, seed, numQ, pageRef);

        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", MODEL);
        body.put("max_tokens", 6000);
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
        List<GeneratedQuestion> result = new ArrayList<>();
        String d = disc != null ? disc : "Geral";
        String[] topics = {
            "conceitos fundamentais de " + d,
            "aplicações práticas de " + d,
            "definições e terminologia de " + d,
            "análise e interpretação em " + d
        };
        for (int i = 0; i < numQ; i++) {
            GeneratedQuestion gq = new GeneratedQuestion();
            gq.enunciado  = "Questão de preparação " + (i + 1) + " sobre " + topics[i % 4] + ".";
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
