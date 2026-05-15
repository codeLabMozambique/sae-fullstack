package codelab.api.smart.sae.quiz.service;

import codelab.api.smart.sae.quiz.dto.*;
import codelab.api.smart.sae.quiz.enums.DisciplinaEnum;
import codelab.api.smart.sae.quiz.model.QuizEntity;
import codelab.api.smart.sae.quiz.model.QuizQuestionEntity;
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
public class OralTestService {

    private static final Logger log = LoggerFactory.getLogger(OralTestService.class);
    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-sonnet-4-6";

    @Value("${anthropic.api.key:}")
    private String apiKey;

    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired private QuizRepository quizRepository;
    @Autowired private QuizQuestionRepository questionRepository;
    @Autowired private QuizService quizService;

    @Transactional
    public QuizAdminDTO generateOralTest(OralTestRequestDTO dto, String username) {
        int numQ = dto.getNumQuestions() != null ? dto.getNumQuestions() : 5;
        String level = dto.getLevel() != null ? dto.getLevel() : "intermediate";

        List<String> topics = generateTopics(numQ, level);

        QuizEntity quiz = new QuizEntity();
        quiz.setTitulo("Teste Oral de Inglês — Preparação");
        quiz.setDescricao("Sessão de preparação para teste oral de Inglês gerada por IA. "
                + "Responde por voz a cada tópico em Inglês.");
        quiz.setDisciplina(DisciplinaEnum.INGLES);
        quiz.setTempoLimiteMinutos(20);
        quiz.setCreatedBy(username);
        quiz.setActive(true);
        quiz.setQuizType("ORAL_TEST");
        quiz = quizRepository.save(quiz);

        int order = 1;
        for (String topic : topics) {
            QuizQuestionEntity q = new QuizQuestionEntity();
            q.setQuiz(quiz);
            q.setEnunciado(topic);
            q.setOrdemNumero(order++);
            q.setExplicacao("Answer this question in English, speaking naturally and clearly.");
            questionRepository.save(q);
        }

        return quizService.toAdminDTO(quizRepository.findById(quiz.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public OralTestResultDTO evaluateOralTest(OralTestEvaluateDTO dto) {
        QuizEntity quiz = quizRepository.findById(dto.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz não encontrado"));

        Map<Long, String> questionTexts = new HashMap<>();
        for (QuizQuestionEntity q : quiz.getQuestions()) {
            questionTexts.put(q.getId(), q.getEnunciado());
        }

        if (dto.getResponses() == null || dto.getResponses().isEmpty()) {
            return buildEmptyResult();
        }

        return evaluateWithClaude(dto.getResponses(), questionTexts);
    }

    private List<String> generateTopics(int num, String level) {
        if (apiKey == null || apiKey.isBlank()) {
            return getFallbackTopics(num);
        }
        try {
            String prompt = String.format(
                "You are an English language teacher for Mozambican high school students. "
                + "Generate %d open-ended conversation topics/questions for an English oral test at %s level. "
                + "Topics should encourage students to speak for 1-2 minutes each. "
                + "Include a mix of: personal experience questions, opinion questions, describe-and-explain questions, "
                + "and situational/hypothetical questions. "
                + "Respond ONLY with a JSON array of strings. Example: [\"question 1\", \"question 2\"]",
                num, level
            );

            String raw = callClaude(prompt, 800);
            JsonNode node = objectMapper.readTree(extractJson(raw));
            List<String> result = new ArrayList<>();
            if (node.isArray()) {
                for (JsonNode n : node) result.add(n.asText());
            }
            if (!result.isEmpty()) return result;
        } catch (Exception e) {
            log.warn("Failed to generate oral test topics via Claude: {}", e.getMessage());
        }
        return getFallbackTopics(num);
    }

    private OralTestResultDTO evaluateWithClaude(List<OralResponseDTO> responses, Map<Long, String> topics) {
        if (apiKey == null || apiKey.isBlank()) {
            return buildFallbackResult(responses, topics);
        }
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("You are an English language examiner evaluating oral test responses from Mozambican high school students.\n\n");
            sb.append("Evaluate the following transcribed spoken responses in English.\n\n");

            for (OralResponseDTO r : responses) {
                String topic = topics.getOrDefault(r.getQuestionId(), "Unknown topic");
                sb.append("TOPIC: ").append(topic).append("\n");
                sb.append("STUDENT RESPONSE: ").append(
                    r.getTranscription() == null || r.getTranscription().isBlank()
                        ? "[No response provided]"
                        : r.getTranscription()
                ).append("\n\n");
            }

            sb.append("Evaluate across 5 dimensions for EACH response and provide an OVERALL evaluation.\n");
            sb.append("Dimensions: Grammar Accuracy, Vocabulary Richness, Fluency & Coherence, ");
            sb.append("Pronunciation & Intonation (based on word choice and sentence structure), Relevance & Completeness.\n\n");
            sb.append("Respond ONLY with valid JSON in this exact structure:\n");
            sb.append("{\n");
            sb.append("  \"overallScore\": <0-100>,\n");
            sb.append("  \"level\": \"BASICO\" | \"ACEITAVEL\" | \"SUPERPREPARADO\",\n");
            sb.append("  \"generalSuggestions\": \"...\",\n");
            sb.append("  \"dimensions\": [\n");
            sb.append("    { \"name\": \"Precisão Gramatical\", \"score\": <0-100>, \"feedback\": \"...\", \"suggestions\": [\"...\"] },\n");
            sb.append("    { \"name\": \"Riqueza Vocabular\", \"score\": <0-100>, \"feedback\": \"...\", \"suggestions\": [\"...\"] },\n");
            sb.append("    { \"name\": \"Fluência e Coerência\", \"score\": <0-100>, \"feedback\": \"...\", \"suggestions\": [\"...\"] },\n");
            sb.append("    { \"name\": \"Pronúncia e Entoação\", \"score\": <0-100>, \"feedback\": \"...\", \"suggestions\": [\"...\"] },\n");
            sb.append("    { \"name\": \"Relevância e Completude\", \"score\": <0-100>, \"feedback\": \"...\", \"suggestions\": [\"...\"] }\n");
            sb.append("  ],\n");
            sb.append("  \"questionFeedback\": [\n");
            sb.append("    { \"questionId\": <id>, \"topic\": \"...\", \"transcription\": \"...\", \"score\": <0-100>, \"feedback\": \"...\", \"improvedVersion\": \"...\" }\n");
            sb.append("  ]\n");
            sb.append("}");

            String raw = callClaude(sb.toString(), 2000);
            String json = extractJson(raw);
            JsonNode node = objectMapper.readTree(json);

            OralTestResultDTO result = new OralTestResultDTO();
            result.setOverallScore(node.path("overallScore").asInt(0));
            result.setLevel(node.path("level").asText("BASICO"));
            result.setGeneralSuggestions(node.path("generalSuggestions").asText(""));

            List<OralDimensionResultDTO> dims = new ArrayList<>();
            JsonNode dimsNode = node.path("dimensions");
            if (dimsNode.isArray()) {
                for (JsonNode d : dimsNode) {
                    OralDimensionResultDTO dim = new OralDimensionResultDTO();
                    dim.setName(d.path("name").asText());
                    dim.setScore(d.path("score").asInt(0));
                    dim.setFeedback(d.path("feedback").asText(""));
                    List<String> sugs = new ArrayList<>();
                    JsonNode sugsNode = d.path("suggestions");
                    if (sugsNode.isArray()) for (JsonNode s : sugsNode) sugs.add(s.asText());
                    dim.setSuggestions(sugs);
                    dims.add(dim);
                }
            }
            result.setDimensions(dims);

            List<OralQuestionFeedbackDTO> qFeedbacks = new ArrayList<>();
            JsonNode qNode = node.path("questionFeedback");
            if (qNode.isArray()) {
                for (JsonNode q : qNode) {
                    OralQuestionFeedbackDTO qf = new OralQuestionFeedbackDTO();
                    qf.setQuestionId(q.path("questionId").asLong());
                    qf.setTopic(q.path("topic").asText(""));
                    qf.setTranscription(q.path("transcription").asText(""));
                    qf.setScore(q.path("score").asInt(0));
                    qf.setFeedback(q.path("feedback").asText(""));
                    qf.setImprovedVersion(q.path("improvedVersion").asText(""));
                    qFeedbacks.add(qf);
                }
            }
            result.setQuestionFeedback(qFeedbacks);
            return result;

        } catch (Exception e) {
            log.error("Failed to evaluate oral test via Claude: {}", e.getMessage());
            return buildFallbackResult(responses, topics);
        }
    }

    private String callClaude(String prompt, int maxTokens) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", MODEL);
        body.put("max_tokens", maxTokens);
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        ResponseEntity<String> resp = rest.exchange(
                ANTHROPIC_URL, HttpMethod.POST,
                new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
                String.class);

        JsonNode root = objectMapper.readTree(resp.getBody());
        return root.path("content").get(0).path("text").asText();
    }

    private String extractJson(String text) {
        int start = text.indexOf('[');
        int startObj = text.indexOf('{');
        if (startObj >= 0 && (start < 0 || startObj < start)) start = startObj;
        int end = text.lastIndexOf(']');
        int endObj = text.lastIndexOf('}');
        if (endObj >= 0 && (end < 0 || endObj > end)) end = endObj;
        if (start >= 0 && end >= start) return text.substring(start, end + 1);
        return text;
    }

    private List<String> getFallbackTopics(int num) {
        List<String> all = List.of(
            "Describe your daily routine and how you manage your time between studies and personal activities.",
            "What do you think are the most important qualities a good student should have? Explain your reasoning.",
            "Talk about a person who has influenced your life positively. Who are they and what did they do?",
            "What are your plans and ambitions for the future? What career would you like to pursue and why?",
            "Describe a memorable experience or trip you have had. What made it special?",
            "What do you think about the role of technology in modern education? Is it helpful or harmful?",
            "Talk about a social problem that affects your community. What solutions would you propose?",
            "Describe your favorite book, film, or music and explain why it is meaningful to you."
        );
        List<String> shuffled = new ArrayList<>(all);
        Collections.shuffle(shuffled);
        return shuffled.subList(0, Math.min(num, shuffled.size()));
    }

    private OralTestResultDTO buildFallbackResult(List<OralResponseDTO> responses, Map<Long, String> topics) {
        OralTestResultDTO r = new OralTestResultDTO();
        r.setOverallScore(0);
        r.setLevel("BASICO");
        r.setGeneralSuggestions("Não foi possível avaliar automaticamente. O professor deve rever as gravações.");

        List<OralDimensionResultDTO> dims = new ArrayList<>();
        for (String name : List.of("Precisão Gramatical", "Riqueza Vocabular", "Fluência e Coerência",
                "Pronúncia e Entoação", "Relevância e Completude")) {
            OralDimensionResultDTO d = new OralDimensionResultDTO();
            d.setName(name);
            d.setScore(0);
            d.setFeedback("Avaliação não disponível.");
            d.setSuggestions(List.of());
            dims.add(d);
        }
        r.setDimensions(dims);

        List<OralQuestionFeedbackDTO> qf = new ArrayList<>();
        for (OralResponseDTO resp : responses) {
            OralQuestionFeedbackDTO f = new OralQuestionFeedbackDTO();
            f.setQuestionId(resp.getQuestionId());
            f.setTopic(topics.getOrDefault(resp.getQuestionId(), ""));
            f.setTranscription(resp.getTranscription());
            f.setScore(0);
            f.setFeedback("Avaliação manual necessária.");
            qf.add(f);
        }
        r.setQuestionFeedback(qf);
        return r;
    }

    private OralTestResultDTO buildEmptyResult() {
        OralTestResultDTO r = new OralTestResultDTO();
        r.setOverallScore(0);
        r.setLevel("BASICO");
        r.setGeneralSuggestions("Nenhuma resposta fornecida.");
        r.setDimensions(List.of());
        r.setQuestionFeedback(List.of());
        return r;
    }
}
