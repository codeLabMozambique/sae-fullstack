package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.request.CreateQuestionRequestDTO;
import codelab.api.smart.sae.forum.dto.response.CollaborativeAnswerResponseDTO;
import codelab.api.smart.sae.forum.dto.response.ExpertAnswerResponseDTO;
import codelab.api.smart.sae.forum.dto.response.ForumMemberDTO;
import codelab.api.smart.sae.forum.dto.response.ForumStatsDTO;
import codelab.api.smart.sae.forum.dto.response.ProfessorAssistanceStatsDTO;
import codelab.api.smart.sae.forum.dto.response.QuestionResponseDTO;
import codelab.api.smart.sae.forum.enums.DisciplinaEnum;
import codelab.api.smart.sae.forum.enums.ForumScope;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.model.ExpertAnswerEntity;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.CollaborativeAnswerRepository;
import codelab.api.smart.sae.forum.repository.ExpertAnswerRepository;
import codelab.api.smart.sae.forum.repository.ForumQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class ForumQuestionService {

    @Autowired private ForumQuestionRepository questionRepository;
    @Autowired private ExpertAnswerRepository expertAnswerRepository;
    @Autowired private CollaborativeAnswerRepository collaborativeAnswerRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private AuthServiceClient authServiceClient;
    @Autowired private AcademicServiceClient academicServiceClient;

    // ── Criar pergunta ───────────────────────────────────────────────────────

    @Transactional
    public QuestionResponseDTO create(CreateQuestionRequestDTO request, String authorUsername) {
        ForumQuestionEntity question = new ForumQuestionEntity();
        question.setTitulo(request.getTitulo().trim());
        question.setDescricao(request.getDescricao().trim());
        question.setQuestionType(request.getQuestionType());
        question.setStatus(QuestionStatus.ABERTA);
        question.setCreatedBy(authorUsername);

        // Novo modelo
        question.setForumScope(request.getForumScope());
        question.setSubjectId(request.getSubjectId());
        question.setClassroomId(request.getClassroomId());
        question.setSchoolId(request.getSchoolId());
        question.setMentionedProfessorUsername(request.getMentionedProfessorUsername());

        // Legado (compatibilidade)
        question.setDisciplina(request.getDisciplina());

        question = Objects.requireNonNull(questionRepository.save(question));

        if (QuestionType.ESPECIALIZADO.equals(request.getQuestionType())) {
            String area = request.getSubjectId() != null
                ? "subject-" + request.getSubjectId()
                : (request.getDisciplina() != null ? request.getDisciplina().name() : "GERAL");
            notificationService.notifyNewQuestion(question.getId(), area, question.getTitulo());
        }

        return QuestionResponseDTO.from(question);
    }

    // ── Listar / detalhe ─────────────────────────────────────────────────────

    public Page<QuestionResponseDTO> list(DisciplinaEnum disciplina, QuestionType questionType,
                                          QuestionStatus status, Pageable pageable) {
        Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return questionRepository.findWithFilters(
            disciplina   != null ? disciplina.name()   : null,
            questionType != null ? questionType.name() : null,
            status       != null ? status.name()       : null,
            unsorted
        ).map(QuestionResponseDTO::from);
    }

    public QuestionResponseDTO getById(Long id) {
        ForumQuestionEntity question = questionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta não encontrada"));
        return enrichWithAnswers(question);
    }

    public ForumQuestionEntity getEntityById(Long id) {
        return questionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta não encontrada"));
    }

    // ── Fechar pergunta ──────────────────────────────────────────────────────

    @Transactional
    public void closeQuestion(Long id) {
        ForumQuestionEntity question = getEntityById(id);
        question.setStatus(QuestionStatus.FECHADA);
        questionRepository.save(Objects.requireNonNull(question));
    }

    @Transactional
    public void closeQuestionByUser(Long id, String username) {
        ForumQuestionEntity question = getEntityById(id);
        if (!question.getCreatedBy().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas o autor pode fechar esta pergunta.");
        }
        question.setStatus(QuestionStatus.FECHADA);
        questionRepository.save(Objects.requireNonNull(question));
    }

    // ── Salas colaborativas por subjectId (novo modelo) ─────────────────────

    /** TURMA: sala colaborativa específica de uma turma + disciplina */
    @Transactional
    public QuestionResponseDTO getOrCreateCollaborativeRoomBySubject(Long subjectId, Long classroomId) {
        return questionRepository
            .findFirstBySubjectIdAndClassroomIdAndQuestionTypeOrderByCreatedAtAsc(
                subjectId, classroomId, QuestionType.COLABORATIVO)
            .map(QuestionResponseDTO::from)
            .orElseGet(() -> {
                ForumQuestionEntity room = new ForumQuestionEntity();
                room.setTitulo("Chat da Turma - Disciplina #" + subjectId);
                room.setDescricao("Sala de chat colaborativo para a turma");
                room.setSubjectId(subjectId);
                room.setClassroomId(classroomId);
                room.setForumScope(ForumScope.TURMA);
                room.setQuestionType(QuestionType.COLABORATIVO);
                room.setStatus(QuestionStatus.ABERTA);
                room.setCreatedBy("system");
                return QuestionResponseDTO.from(Objects.requireNonNull(questionRepository.save(room)));
            });
    }

    /** DISCIPLINA: sala colaborativa broadcast (sem turma específica) */
    @Transactional
    public QuestionResponseDTO getOrCreateCollaborativeRoomBySubjectBroadcast(Long subjectId) {
        return questionRepository
            .findFirstBySubjectIdAndQuestionTypeAndClassroomIdIsNullOrderByCreatedAtAsc(
                subjectId, QuestionType.COLABORATIVO)
            .map(QuestionResponseDTO::from)
            .orElseGet(() -> {
                ForumQuestionEntity room = new ForumQuestionEntity();
                room.setTitulo("Chat Global - Disciplina #" + subjectId);
                room.setDescricao("Sala de chat colaborativo geral para a disciplina");
                room.setSubjectId(subjectId);
                room.setForumScope(ForumScope.DISCIPLINA);
                room.setQuestionType(QuestionType.COLABORATIVO);
                room.setStatus(QuestionStatus.ABERTA);
                room.setCreatedBy("system");
                return QuestionResponseDTO.from(Objects.requireNonNull(questionRepository.save(room)));
            });
    }

    // ── Salas expert (1-on-1) por subjectId (novo modelo) ───────────────────

    /** TURMA: sala expert do aluno numa turma + disciplina */
    @Transactional
    public QuestionResponseDTO getOrCreateExpertRoomBySubject(Long subjectId, Long classroomId, String studentUsername) {
        return questionRepository
            .findFirstBySubjectIdAndClassroomIdAndQuestionTypeAndCreatedByOrderByCreatedAtAsc(
                subjectId, classroomId, QuestionType.ESPECIALIZADO, studentUsername)
            .map(QuestionResponseDTO::from)
            .orElseGet(() -> {
                ForumQuestionEntity room = new ForumQuestionEntity();
                room.setTitulo("Chat com Professor - Disciplina #" + subjectId);
                room.setDescricao("_");
                room.setSubjectId(subjectId);
                room.setClassroomId(classroomId);
                room.setForumScope(ForumScope.TURMA);
                room.setQuestionType(QuestionType.ESPECIALIZADO);
                room.setStatus(QuestionStatus.ABERTA);
                room.setCreatedBy(studentUsername);
                return QuestionResponseDTO.from(Objects.requireNonNull(questionRepository.save(room)));
            });
    }

    /** DISCIPLINA: sala expert broadcast do aluno (sem turma) */
    @Transactional
    public QuestionResponseDTO getOrCreateExpertRoomBySubjectBroadcast(Long subjectId, String studentUsername) {
        return questionRepository
            .findFirstBySubjectIdAndQuestionTypeAndCreatedByAndClassroomIdIsNullOrderByCreatedAtAsc(
                subjectId, QuestionType.ESPECIALIZADO, studentUsername)
            .map(QuestionResponseDTO::from)
            .orElseGet(() -> {
                ForumQuestionEntity room = new ForumQuestionEntity();
                room.setTitulo("Chat com Professor - Disciplina #" + subjectId);
                room.setDescricao("_");
                room.setSubjectId(subjectId);
                room.setForumScope(ForumScope.DISCIPLINA);
                room.setQuestionType(QuestionType.ESPECIALIZADO);
                room.setStatus(QuestionStatus.ABERTA);
                room.setCreatedBy(studentUsername);
                return QuestionResponseDTO.from(Objects.requireNonNull(questionRepository.save(room)));
            });
    }

    // ── Salas legado por DisciplinaEnum ──────────────────────────────────────

    @Transactional
    public QuestionResponseDTO getOrCreateCollaborativeRoom(DisciplinaEnum disciplina) {
        return questionRepository
            .findFirstByDisciplinaAndQuestionTypeOrderByCreatedAtAsc(disciplina, QuestionType.COLABORATIVO)
            .map(QuestionResponseDTO::from)
            .orElseGet(() -> {
                ForumQuestionEntity room = new ForumQuestionEntity();
                room.setTitulo("Chat da Turma - " + displayName(disciplina));
                room.setDescricao("Sala de chat colaborativo para " + displayName(disciplina));
                room.setDisciplina(disciplina);
                room.setQuestionType(QuestionType.COLABORATIVO);
                room.setStatus(QuestionStatus.ABERTA);
                room.setCreatedBy("system");
                return QuestionResponseDTO.from(Objects.requireNonNull(questionRepository.save(room)));
            });
    }

    @Transactional
    public QuestionResponseDTO getOrCreateExpertRoom(DisciplinaEnum disciplina, String studentUsername) {
        return questionRepository
            .findFirstByDisciplinaAndQuestionTypeAndCreatedByOrderByCreatedAtAsc(
                disciplina, QuestionType.ESPECIALIZADO, studentUsername)
            .map(QuestionResponseDTO::from)
            .orElseGet(() -> {
                ForumQuestionEntity room = new ForumQuestionEntity();
                room.setTitulo("Chat com Professor - " + displayName(disciplina));
                room.setDescricao("_");
                room.setDisciplina(disciplina);
                room.setQuestionType(QuestionType.ESPECIALIZADO);
                room.setStatus(QuestionStatus.ABERTA);
                room.setCreatedBy(studentUsername);
                return QuestionResponseDTO.from(Objects.requireNonNull(questionRepository.save(room)));
            });
    }

    // ── Primeira mensagem da sala expert ─────────────────────────────────────

    @Transactional
    public void updateFirstMessage(Long id, String descricao, String username) {
        ForumQuestionEntity question = getEntityById(id);
        if (!question.getCreatedBy().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas o autor pode editar esta mensagem.");
        }
        if (!"_".equals(question.getDescricao())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mensagem inicial já foi definida.");
        }
        if (descricao == null || descricao.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mensagem não pode estar vazia.");
        }
        question.setDescricao(descricao.trim());
        questionRepository.save(Objects.requireNonNull(question));
    }

    // ── Membros do fórum para @mention ───────────────────────────────────────

    /**
     * Devolve a lista de professores do fórum para autocomplete do @mention.
     * Para TURMA: professores atribuídos à turma + disciplina.
     * Para DISCIPLINA (ou sem classroomId): todos os professores da disciplina.
     */
    public List<ForumMemberDTO> getForumMembers(Long subjectId, Long classroomId) {
        List<Long> professorIds = classroomId != null
            ? academicServiceClient.getProfessorIdsByClassroomAndSubject(classroomId, subjectId)
            : academicServiceClient.getProfessorIdsBySubject(subjectId);

        return professorIds.stream()
            .map(authServiceClient::getProfessorInfoByUserId)
            .filter(Objects::nonNull)
            .map(info -> new ForumMemberDTO(
                info.getUsername(),
                info.getFullname(),
                "PROFESSOR",
                info.isOnline()
            ))
            .collect(Collectors.toList());
    }

    // ── Inbox do professor ────────────────────────────────────────────────────

    public List<QuestionResponseDTO> getProfessorPending(String professorUsername) {
        List<Long> subjectIds = resolveSubjectIds(professorUsername);

        if (subjectIds.isEmpty()) {
            // Fallback legado
            List<DisciplinaEnum> disciplines = resolveDisciplinasLegacy(professorUsername);
            if (disciplines.isEmpty()) return List.of();
            return buildPendingFromDisciplinas(disciplines, professorUsername);
        }

        List<ForumQuestionEntity> expert = questionRepository
            .findByQuestionTypeAndSubjectIdInAndStatus(
                QuestionType.ESPECIALIZADO, subjectIds, QuestionStatus.ABERTA)
            .stream()
            .filter(q -> !expertAnswerRepository.existsByQuestionIdAndAnsweredBy(q.getId(), professorUsername))
            .collect(Collectors.toList());

        List<ForumQuestionEntity> collab = questionRepository
            .findByQuestionTypeAndSubjectIdIn(QuestionType.COLABORATIVO, subjectIds)
            .stream()
            .filter(q -> !collaborativeAnswerRepository.existsByQuestionIdAndAnsweredBy(q.getId(), professorUsername))
            .collect(Collectors.toList());

        List<ForumQuestionEntity> combined = new ArrayList<>(expert);
        combined.addAll(collab);
        combined.sort(Comparator.comparing(ForumQuestionEntity::getCreatedAt).reversed());
        return combined.stream().map(this::enrichWithAnswers).collect(Collectors.toList());
    }

    public List<QuestionResponseDTO> getProfessorAnswered(String professorUsername) {
        List<Long> subjectIds = resolveSubjectIds(professorUsername);

        List<Long> expertIds = expertAnswerRepository.findByAnsweredBy(professorUsername)
            .stream().map(ExpertAnswerEntity::getQuestionId).distinct().collect(Collectors.toList());
        List<ForumQuestionEntity> expertAnswered = expertIds.isEmpty()
            ? List.of()
            : questionRepository.findAllById(expertIds);

        List<ForumQuestionEntity> collabWithAnswers;
        if (!subjectIds.isEmpty()) {
            collabWithAnswers = questionRepository
                .findByQuestionTypeAndSubjectIdIn(QuestionType.COLABORATIVO, subjectIds)
                .stream()
                .filter(q -> collaborativeAnswerRepository.existsByQuestionId(q.getId()))
                .collect(Collectors.toList());
        } else {
            // Fallback legado
            List<DisciplinaEnum> disciplines = resolveDisciplinasLegacy(professorUsername);
            collabWithAnswers = disciplines.isEmpty() ? List.of()
                : questionRepository.findByQuestionTypeAndDisciplinaIn(QuestionType.COLABORATIVO, disciplines)
                    .stream()
                    .filter(q -> collaborativeAnswerRepository.existsByQuestionId(q.getId()))
                    .collect(Collectors.toList());
        }

        Map<Long, ForumQuestionEntity> map = new LinkedHashMap<>();
        expertAnswered.forEach(q -> map.put(q.getId(), q));
        collabWithAnswers.forEach(q -> map.put(q.getId(), q));

        List<ForumQuestionEntity> result = new ArrayList<>(map.values());
        result.sort(Comparator.comparing(ForumQuestionEntity::getCreatedAt).reversed());
        return result.stream().map(this::enrichWithAnswers).collect(Collectors.toList());
    }

    // ── Perguntas do aluno ────────────────────────────────────────────────────

    public List<QuestionResponseDTO> getMyQuestions(String username) {
        return questionRepository.findByCreatedByOrderByCreatedAtDesc(username)
            .stream().map(this::enrichWithAnswers).collect(Collectors.toList());
    }

    // ── Estatísticas ─────────────────────────────────────────────────────────

    public ForumStatsDTO getStatsOverview() {
        List<ForumQuestionEntity> all = questionRepository.findAll();

        ForumStatsDTO stats = new ForumStatsDTO();
        stats.setTotalQuestions((long) all.size());

        stats.setTotalByDisciplina(all.stream()
            .filter(q -> q.getDisciplina() != null)
            .collect(Collectors.groupingBy(q -> q.getDisciplina().name(), TreeMap::new, Collectors.counting())));

        stats.setTotalByType(all.stream()
            .collect(Collectors.groupingBy(q -> q.getQuestionType().name(), TreeMap::new, Collectors.counting())));

        stats.setTotalByStatus(all.stream()
            .collect(Collectors.groupingBy(q -> q.getStatus().name(), TreeMap::new, Collectors.counting())));

        List<Long> responseTimes = all.stream()
            .map(q -> {
                List<ExpertAnswerResponseDTO> ea =
                    expertAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(q.getId()).stream()
                        .map(ExpertAnswerResponseDTO::from).collect(Collectors.toList());
                List<CollaborativeAnswerResponseDTO> ca =
                    collaborativeAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(q.getId()).stream()
                        .map(CollaborativeAnswerResponseDTO::from).collect(Collectors.toList());
                return computeResponseTime(q.getCreatedAt(), ea, ca);
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        stats.setAvgResponseTimeMinutes(responseTimes.isEmpty()
            ? null
            : responseTimes.stream().mapToLong(Long::longValue).average().orElse(0));

        return stats;
    }

    public ProfessorAssistanceStatsDTO getProfessorAssistanceStats(String professorUsername) {
        List<ExpertAnswerEntity> answers = expertAnswerRepository.findByAnsweredBy(professorUsername);

        ProfessorAssistanceStatsDTO stats = new ProfessorAssistanceStatsDTO();
        stats.setUsername(professorUsername);
        stats.setTotalAnswered((long) answers.size());
        long accepted = answers.stream().filter(a -> Boolean.TRUE.equals(a.getAccepted())).count();
        stats.setTotalAccepted(accepted);
        stats.setAcceptanceRate(answers.isEmpty() ? 0.0 : (accepted * 100.0 / answers.size()));

        List<String> disciplinas = answers.stream()
            .map(ExpertAnswerEntity::getQuestionId)
            .distinct()
            .map(qid -> questionRepository.findById(qid).orElse(null))
            .filter(Objects::nonNull)
            .filter(q -> q.getDisciplina() != null)
            .map(q -> q.getDisciplina().name())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        stats.setDisciplinas(disciplinas);

        List<DisciplinaEnum> disciplinaEnums = disciplinas.stream()
            .map(name -> { try { return DisciplinaEnum.valueOf(name); } catch (Exception e) { return null; } })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
        long totalEspecializado = disciplinaEnums.isEmpty() ? 0L :
            questionRepository.findByQuestionTypeAndDisciplinaIn(QuestionType.ESPECIALIZADO, disciplinaEnums).size();
        stats.setAssistancePercentage(totalEspecializado == 0 ? 0.0
            : (answers.size() * 100.0 / totalEspecializado));

        double avgTime = answers.stream()
            .mapToLong(a -> {
                ForumQuestionEntity q = questionRepository.findById(a.getQuestionId()).orElse(null);
                if (q == null) return 0L;
                return Duration.between(q.getCreatedAt(), a.getCreatedAt()).toMinutes();
            })
            .filter(t -> t >= 0)
            .average()
            .orElse(0.0);
        stats.setAvgResponseTimeMinutes(answers.isEmpty() ? null : avgTime);

        return stats;
    }

    // ── Helpers privados ─────────────────────────────────────────────────────

    /** Resolve subjectIds do professor via auth service + academic service */
    private List<Long> resolveSubjectIds(String professorUsername) {
        try {
            Long userId = authServiceClient.getUserIdByUsername(professorUsername);
            if (userId == null) return List.of();
            return academicServiceClient.getSubjectIdsByProfessorId(userId);
        } catch (Exception e) {
            return List.of();
        }
    }

    /** Legado: resolve DisciplinaEnum via specialization text-matching */
    private List<DisciplinaEnum> resolveDisciplinasLegacy(String professorUsername) {
        return authServiceClient.getProfessorDisciplineNames(professorUsername)
            .stream()
            .map(name -> {
                try { return DisciplinaEnum.valueOf(name); }
                catch (IllegalArgumentException e) { return null; }
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    private List<QuestionResponseDTO> buildPendingFromDisciplinas(List<DisciplinaEnum> disciplines, String professorUsername) {
        List<ForumQuestionEntity> expert = questionRepository
            .findByQuestionTypeAndDisciplinaInAndStatus(QuestionType.ESPECIALIZADO, disciplines, QuestionStatus.ABERTA)
            .stream()
            .filter(q -> !expertAnswerRepository.existsByQuestionIdAndAnsweredBy(q.getId(), professorUsername))
            .collect(Collectors.toList());

        List<ForumQuestionEntity> collab = questionRepository
            .findByQuestionTypeAndDisciplinaIn(QuestionType.COLABORATIVO, disciplines)
            .stream()
            .filter(q -> !collaborativeAnswerRepository.existsByQuestionIdAndAnsweredBy(q.getId(), professorUsername))
            .collect(Collectors.toList());

        List<ForumQuestionEntity> combined = new ArrayList<>(expert);
        combined.addAll(collab);
        combined.sort(Comparator.comparing(ForumQuestionEntity::getCreatedAt).reversed());
        return combined.stream().map(this::enrichWithAnswers).collect(Collectors.toList());
    }

    private QuestionResponseDTO enrichWithAnswers(ForumQuestionEntity q) {
        QuestionResponseDTO dto = QuestionResponseDTO.from(q);
        List<ExpertAnswerResponseDTO> expertAnswers =
            expertAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(q.getId()).stream()
                .map(ExpertAnswerResponseDTO::from).collect(Collectors.toList());
        List<CollaborativeAnswerResponseDTO> collabAnswers =
            collaborativeAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(q.getId()).stream()
                .map(CollaborativeAnswerResponseDTO::from).collect(Collectors.toList());
        dto.setExpertAnswers(expertAnswers);
        dto.setCollaborativeAnswers(collabAnswers);
        dto.setResponseTimeMinutes(computeResponseTime(q.getCreatedAt(), expertAnswers, collabAnswers));
        return dto;
    }

    private Long computeResponseTime(LocalDateTime questionCreatedAt,
                                     List<ExpertAnswerResponseDTO> expertAnswers,
                                     List<CollaborativeAnswerResponseDTO> collabAnswers) {
        LocalDateTime firstAt = null;
        if (!expertAnswers.isEmpty()) firstAt = expertAnswers.get(0).getCreatedAt();
        if (!collabAnswers.isEmpty()) {
            LocalDateTime collabFirst = collabAnswers.get(0).getCreatedAt();
            firstAt = (firstAt == null || collabFirst.isBefore(firstAt)) ? collabFirst : firstAt;
        }
        return firstAt != null ? Duration.between(questionCreatedAt, firstAt).toMinutes() : null;
    }

    private String displayName(DisciplinaEnum d) {
        return switch (d) {
            case MATEMATICA -> "Matemática";
            case FISICA     -> "Física";
            case QUIMICA    -> "Química";
            case BIOLOGIA   -> "Biologia";
            case PORTUGUES  -> "Português";
            case HISTORIA   -> "História";
            case GEOGRAFIA  -> "Geografia";
            case INGLES     -> "Inglês";
            case FILOSOFIA  -> "Filosofia";
            case INFORMATICA -> "Informática";
            case GERAL      -> "Geral";
        };
    }
}
