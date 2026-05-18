package codelab.api.smart.sae.quiz.service;

import codelab.api.smart.sae.quiz.dto.*;
import codelab.api.smart.sae.quiz.enums.DisciplinaEnum;
import codelab.api.smart.sae.quiz.model.*;
import codelab.api.smart.sae.quiz.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuizService {

    @Autowired private QuizRepository quizRepository;
    @Autowired private QuizQuestionRepository questionRepository;
    @Autowired private QuizOptionRepository optionRepository;
    @Autowired private QuizAttemptRepository attemptRepository;

    // ── List ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<QuizSummaryDTO> listQuizzes(String disciplinaStr, Long subjectId, boolean adminView, String username) {
        List<QuizEntity> quizzes;
        if (subjectId != null) {
            quizzes = adminView ? quizRepository.findBySubjectId(subjectId) : quizRepository.findBySubjectIdAndActiveTrue(subjectId);
        } else if (disciplinaStr != null && !disciplinaStr.isBlank()) {
            try {
                DisciplinaEnum d = DisciplinaEnum.valueOf(disciplinaStr.toUpperCase());
                quizzes = adminView ? quizRepository.findByDisciplina(d) : quizRepository.findByDisciplinaAndActiveTrue(d);
            } catch (IllegalArgumentException e) {
                quizzes = adminView ? quizRepository.findAll() : quizRepository.findByActiveTrue();
            }
        } else {
            quizzes = adminView ? quizRepository.findAll() : quizRepository.findByActiveTrue();
        }

        return quizzes.stream().map(q -> {
            QuizSummaryDTO dto = toSummary(q);
            if (username != null) {
                List<QuizAttemptEntity> attempts = attemptRepository
                        .findByQuizIdAndStudentUsernameAndCompleted(q.getId(), username, true);
                dto.setMyAttempts(attempts.size());
                dto.setBestScore(attempts.stream()
                        .mapToInt(a -> a.getScore() == null ? 0 : a.getScore())
                        .max().stream().boxed().findFirst().orElse(null));
            }
            return dto;
        }).collect(Collectors.toList());
    }

    // ── Get quiz for student (no correct answers) ────────────────
    @Transactional(readOnly = true)
    public QuizDTO getForStudent(Long id) {
        QuizEntity q = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado"));
        return toStudentDTO(q);
    }

    // ── Get quiz for admin/professor (with correct answers) ───────
    @Transactional(readOnly = true)
    public QuizAdminDTO getForAdmin(Long id) {
        QuizEntity q = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado"));
        return toAdminDTO(q);
    }

    // ── Create ────────────────────────────────────────────────────
    public QuizAdminDTO create(CreateQuizDTO dto, String createdBy) {
        QuizEntity quiz = new QuizEntity();
        quiz.setTitulo(dto.getTitulo());
        quiz.setDescricao(dto.getDescricao());
        quiz.setSubjectId(dto.getSubjectId());
        quiz.setSubjectName(dto.getSubjectName());
        quiz.setDisciplina(parseDisciplina(dto.getDisciplina()));
        quiz.setTempoLimiteMinutos(dto.getTempoLimiteMinutos());
        quiz.setThumbnailUrl(dto.getThumbnailUrl());
        quiz.setThumbnailType(dto.getThumbnailType());
        quiz.setCreatedBy(createdBy);
        return toAdminDTO(java.util.Objects.requireNonNull(quizRepository.save(quiz)));
    }

    // ── Update ────────────────────────────────────────────────────
    public QuizAdminDTO update(Long id, CreateQuizDTO dto, String username) {
        QuizEntity quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado"));
        quiz.setTitulo(dto.getTitulo());
        quiz.setDescricao(dto.getDescricao());
        quiz.setSubjectId(dto.getSubjectId());
        quiz.setSubjectName(dto.getSubjectName());
        quiz.setDisciplina(parseDisciplina(dto.getDisciplina()));
        quiz.setTempoLimiteMinutos(dto.getTempoLimiteMinutos());
        quiz.setThumbnailUrl(dto.getThumbnailUrl());
        quiz.setThumbnailType(dto.getThumbnailType());
        return toAdminDTO(java.util.Objects.requireNonNull(quizRepository.save(quiz)));
    }

    // ── Delete ────────────────────────────────────────────────────
    public void delete(Long id) {
        if (!quizRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado");
        quizRepository.deleteById(id);
    }

    // ── Toggle active ─────────────────────────────────────────────
    public QuizSummaryDTO toggleActive(Long id) {
        QuizEntity quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado"));
        quiz.setActive(!quiz.isActive());
        return toSummary(java.util.Objects.requireNonNull(quizRepository.save(quiz)));
    }

    // ── Add question ──────────────────────────────────────────────
    public QuizAdminDTO addQuestion(Long quizId, CreateQuestionDTO dto) {
        QuizEntity quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz não encontrado"));

        QuizQuestionEntity q = new QuizQuestionEntity();
        q.setQuiz(quiz);
        q.setEnunciado(dto.getEnunciado());
        q.setOrdemNumero(quiz.getQuestions().size() + 1);
        q.setMediaUrl(dto.getMediaUrl());
        q.setMediaType(dto.getMediaType());
        q = java.util.Objects.requireNonNull(questionRepository.save(q));

        for (CreateOptionDTO optDto : dto.getOptions()) {
            QuizOptionEntity opt = new QuizOptionEntity();
            opt.setQuestion(q);
            opt.setTexto(optDto.getTexto());
            opt.setLetra(optDto.getLetra().toUpperCase());
            opt.setCorreta(optDto.isCorreta());
            java.util.Objects.requireNonNull(optionRepository.save(opt));
        }

        return toAdminDTO(quizRepository.findById(quizId).get());
    }

    // ── Delete question ───────────────────────────────────────────
    public void deleteQuestion(Long quizId, Long questionId) {
        QuizQuestionEntity q = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Questão não encontrada"));
        if (!q.getQuiz().getId().equals(quizId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Questão não pertence a este quiz");
        questionRepository.deleteById(questionId);
    }

    // ── Mappers ───────────────────────────────────────────────────
    public QuizSummaryDTO toSummary(QuizEntity q) {
        QuizSummaryDTO dto = new QuizSummaryDTO();
        dto.setId(q.getId());
        dto.setTitulo(q.getTitulo());
        dto.setDescricao(q.getDescricao());
        dto.setSubjectId(q.getSubjectId());
        dto.setSubjectName(q.getSubjectName());
        if (q.getDisciplina() != null) {
            dto.setDisciplina(q.getDisciplina().name());
            dto.setDisciplinaLabel(q.getDisciplina().getDisplayName());
        } else if (q.getSubjectName() != null) {
            dto.setDisciplina(q.getSubjectName());
            dto.setDisciplinaLabel(q.getSubjectName());
        }
        dto.setQuestionCount(q.getQuestions().size());
        dto.setTempoLimiteMinutos(q.getTempoLimiteMinutos());
        dto.setActive(q.isActive());
        dto.setCreatedBy(q.getCreatedBy());
        dto.setCreatedAt(q.getCreatedAt());
        dto.setContentId(q.getContentId());
        dto.setStartPage(q.getStartPage());
        dto.setEndPage(q.getEndPage());
        dto.setAiGenerated(q.isAiGenerated());
        dto.setSectionId(q.getSectionId());
        dto.setQuizType(q.getQuizType());
        dto.setThumbnailUrl(q.getThumbnailUrl());
        dto.setThumbnailType(q.getThumbnailType());
        return dto;
    }

    public QuizDTO toStudentDTO(QuizEntity q) {
        QuizDTO dto = new QuizDTO();
        dto.setId(q.getId());
        dto.setTitulo(q.getTitulo());
        dto.setDescricao(q.getDescricao());
        dto.setSubjectId(q.getSubjectId());
        dto.setSubjectName(q.getSubjectName());
        if (q.getDisciplina() != null) {
            dto.setDisciplina(q.getDisciplina().name());
            dto.setDisciplinaLabel(q.getDisciplina().getDisplayName());
        } else if (q.getSubjectName() != null) {
            dto.setDisciplina(q.getSubjectName());
            dto.setDisciplinaLabel(q.getSubjectName());
        }
        dto.setTempoLimiteMinutos(q.getTempoLimiteMinutos());
        dto.setQuestions(q.getQuestions().stream().map(question -> {
            QuizQuestionDTO qd = new QuizQuestionDTO();
            qd.setId(question.getId());
            qd.setEnunciado(question.getEnunciado());
            qd.setOrdemNumero(question.getOrdemNumero() == null ? 0 : question.getOrdemNumero());
            qd.setMediaUrl(question.getMediaUrl());
            qd.setMediaType(question.getMediaType());
            qd.setExplicacao(question.getExplicacao());
            qd.setOptions(question.getOptions().stream().map(opt -> {
                QuizOptionDTO od = new QuizOptionDTO();
                od.setId(opt.getId());
                od.setTexto(opt.getTexto());
                od.setLetra(opt.getLetra());
                return od;
            }).collect(Collectors.toList()));
            return qd;
        }).collect(Collectors.toList()));
        return dto;
    }

    public QuizAdminDTO toAdminDTO(QuizEntity q) {
        QuizAdminDTO dto = new QuizAdminDTO();
        dto.setId(q.getId());
        dto.setTitulo(q.getTitulo());
        dto.setDescricao(q.getDescricao());
        dto.setSubjectId(q.getSubjectId());
        dto.setSubjectName(q.getSubjectName());
        if (q.getDisciplina() != null) {
            dto.setDisciplina(q.getDisciplina().name());
            dto.setDisciplinaLabel(q.getDisciplina().getDisplayName());
        } else if (q.getSubjectName() != null) {
            dto.setDisciplina(q.getSubjectName());
            dto.setDisciplinaLabel(q.getSubjectName());
        }
        dto.setTempoLimiteMinutos(q.getTempoLimiteMinutos());
        dto.setActive(q.isActive());
        dto.setCreatedBy(q.getCreatedBy());
        dto.setCreatedAt(q.getCreatedAt());
        dto.setContentId(q.getContentId());
        dto.setStartPage(q.getStartPage());
        dto.setEndPage(q.getEndPage());
        dto.setAiGenerated(q.isAiGenerated());
        dto.setSectionId(q.getSectionId());
        dto.setQuizType(q.getQuizType());
        dto.setThumbnailUrl(q.getThumbnailUrl());
        dto.setThumbnailType(q.getThumbnailType());
        dto.setQuestions(q.getQuestions().stream().map(question -> {
            QuizQuestionAdminDTO qd = new QuizQuestionAdminDTO();
            qd.setId(question.getId());
            qd.setEnunciado(question.getEnunciado());
            qd.setOrdemNumero(question.getOrdemNumero() == null ? 0 : question.getOrdemNumero());
            qd.setMediaUrl(question.getMediaUrl());
            qd.setMediaType(question.getMediaType());
            qd.setExplicacao(question.getExplicacao());
            qd.setOptions(question.getOptions().stream().map(opt -> {
                QuizOptionAdminDTO od = new QuizOptionAdminDTO();
                od.setId(opt.getId());
                od.setTexto(opt.getTexto());
                od.setLetra(opt.getLetra());
                od.setCorreta(opt.isCorreta());
                return od;
            }).collect(Collectors.toList()));
            return qd;
        }).collect(Collectors.toList()));
        return dto;
    }

    private DisciplinaEnum parseDisciplina(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return DisciplinaEnum.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return DisciplinaEnum.GERAL;
        }
    }
}
