package codelab.api.smart.sae.quiz.service;

import codelab.api.smart.sae.quiz.dto.*;
import codelab.api.smart.sae.quiz.model.*;
import codelab.api.smart.sae.quiz.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuizAttemptService {

    @Autowired private QuizRepository quizRepository;
    @Autowired private QuizAttemptRepository attemptRepository;
    @Autowired private QuizAttemptAnswerRepository answerRepository;
    @Autowired private QuizService quizService;

    // ── Start attempt ─────────────────────────────────────────────
    public StartAttemptResponseDTO startAttempt(Long quizId, String username) {
        QuizEntity quiz = quizRepository.findById(java.util.Objects.requireNonNull(quizId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado"));
        if (!quiz.isActive())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz não está disponível");

        QuizAttemptEntity attempt = new QuizAttemptEntity();
        attempt.setQuizId(quizId);
        attempt.setStudentUsername(username);
        attempt = java.util.Objects.requireNonNull(attemptRepository.save(attempt));

        StartAttemptResponseDTO response = new StartAttemptResponseDTO();
        response.setAttemptId(attempt.getId());
        response.setQuiz(quizService.toStudentDTO(quiz));
        return response;
    }

    // ── Submit attempt ────────────────────────────────────────────
    public QuizResultDTO submitAttempt(Long attemptId, SubmitAttemptDTO dto, String username) {
        QuizAttemptEntity attempt = attemptRepository.findById(java.util.Objects.requireNonNull(attemptId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tentativa não encontrada"));
        if (!attempt.getStudentUsername().equals(username))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");
        if (attempt.isCompleted())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tentativa já submetida");

        QuizEntity quiz = quizRepository.findById(java.util.Objects.requireNonNull(attempt.getQuizId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado"));

        Map<Long, Long> submittedAnswers = dto.getAnswers() == null ? Map.of() :
                dto.getAnswers().stream()
                        .filter(a -> a.getQuestionId() != null && a.getSelectedOptionId() != null)
                        .collect(Collectors.toMap(AttemptAnswerDTO::getQuestionId, AttemptAnswerDTO::getSelectedOptionId,
                                (a, b) -> a));

        List<QuizAttemptAnswerEntity> savedAnswers = new ArrayList<>();
        int correct = 0;

        for (QuizQuestionEntity question : quiz.getQuestions()) {
            Long selectedId = submittedAnswers.get(question.getId());
            QuizOptionEntity correctOpt = question.getOptions().stream()
                    .filter(QuizOptionEntity::isCorreta).findFirst().orElse(null);

            boolean isCorrect = selectedId != null && correctOpt != null && selectedId.equals(correctOpt.getId());
            if (isCorrect) correct++;

            QuizAttemptAnswerEntity ans = new QuizAttemptAnswerEntity();
            ans.setAttempt(attempt);
            ans.setQuestionId(question.getId());
            ans.setSelectedOptionId(selectedId);
            ans.setCorrect(isCorrect);
            savedAnswers.add(java.util.Objects.requireNonNull(answerRepository.save(ans)));
        }

        int total = quiz.getQuestions().size();
        int score = total > 0 ? (int) Math.round((double) correct / total * 100) : 0;

        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setCompleted(true);
        attempt.setTotalQuestions(total);
        attempt.setCorrectAnswers(correct);
        attempt.setScore(score);
        attemptRepository.save(java.util.Objects.requireNonNull(attempt));

        return buildResult(attempt, quiz, savedAnswers);
    }

    // ── Get result ────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public QuizResultDTO getResult(Long attemptId, String username) {
        QuizAttemptEntity attempt = attemptRepository.findById(java.util.Objects.requireNonNull(attemptId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tentativa não encontrada"));
        if (!attempt.getStudentUsername().equals(username))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");
        if (!attempt.isCompleted())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tentativa ainda não submetida");

        QuizEntity quiz = quizRepository.findById(java.util.Objects.requireNonNull(attempt.getQuizId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado"));
        List<QuizAttemptAnswerEntity> answers = answerRepository.findByAttemptId(attemptId);
        return buildResult(attempt, quiz, answers);
    }

    // ── My attempts ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<QuizSummaryDTO> getMyAttempts(String username) {
        return attemptRepository.findByStudentUsernameAndCompleted(username, true).stream()
                .map(a -> quizRepository.findById(java.util.Objects.requireNonNull(a.getQuizId())).map(q -> {
                    QuizSummaryDTO s = quizService.toSummary(q);
                    s.setMyAttempts(1);
                    s.setBestScore(a.getScore());
                    return s;
                }).orElse(null))
                .filter(s -> s != null)
                .collect(Collectors.toList());
    }

    // ── Build result ──────────────────────────────────────────────
    private QuizResultDTO buildResult(QuizAttemptEntity attempt, QuizEntity quiz, List<QuizAttemptAnswerEntity> savedAnswers) {
        Map<Long, QuizAttemptAnswerEntity> answerByQuestion = savedAnswers.stream()
                .collect(Collectors.toMap(QuizAttemptAnswerEntity::getQuestionId, a -> a, (a, b) -> a));

        List<QuestionResultDTO> questionResults = quiz.getQuestions().stream().map(q -> {
            QuizOptionEntity correctOpt = q.getOptions().stream().filter(QuizOptionEntity::isCorreta).findFirst().orElse(null);
            QuizAttemptAnswerEntity ans = answerByQuestion.get(q.getId());

            QuestionResultDTO qr = new QuestionResultDTO();
            qr.setQuestionId(q.getId());
            qr.setEnunciado(q.getEnunciado());
            qr.setCorrect(ans != null && ans.isCorrect());

            if (ans != null && ans.getSelectedOptionId() != null) {
                q.getOptions().stream().filter(o -> o.getId().equals(ans.getSelectedOptionId())).findFirst().ifPresent(sel -> {
                    qr.setSelectedOptionId(sel.getId());
                    qr.setSelectedOptionLetra(sel.getLetra());
                    qr.setSelectedOptionTexto(sel.getTexto());
                });
            }
            if (correctOpt != null) {
                qr.setCorrectOptionId(correctOpt.getId());
                qr.setCorrectOptionLetra(correctOpt.getLetra());
                qr.setCorrectOptionTexto(correctOpt.getTexto());
            }
            return qr;
        }).collect(Collectors.toList());

        long seconds = attempt.getStartedAt() != null && attempt.getSubmittedAt() != null
                ? ChronoUnit.SECONDS.between(attempt.getStartedAt(), attempt.getSubmittedAt()) : 0;

        QuizResultDTO result = new QuizResultDTO();
        result.setAttemptId(attempt.getId());
        result.setQuizId(attempt.getQuizId());
        result.setQuizTitulo(quiz.getTitulo());
        result.setScore(attempt.getScore() == null ? 0 : attempt.getScore());
        result.setCorrectAnswers(attempt.getCorrectAnswers() == null ? 0 : attempt.getCorrectAnswers());
        result.setTotalQuestions(attempt.getTotalQuestions() == null ? 0 : attempt.getTotalQuestions());
        result.setTimeSpentSeconds(seconds);
        result.setQuestionResults(questionResults);
        return result;
    }
}
