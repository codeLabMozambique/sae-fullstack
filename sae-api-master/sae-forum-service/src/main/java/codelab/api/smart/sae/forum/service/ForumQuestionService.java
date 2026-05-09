package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.request.CreateQuestionRequestDTO;
import codelab.api.smart.sae.forum.dto.response.CollaborativeAnswerResponseDTO;
import codelab.api.smart.sae.forum.dto.response.ExpertAnswerResponseDTO;
import codelab.api.smart.sae.forum.dto.response.ForumStatsDTO;
import codelab.api.smart.sae.forum.dto.response.ProfessorAssistanceStatsDTO;
import codelab.api.smart.sae.forum.dto.response.QuestionResponseDTO;
import codelab.api.smart.sae.forum.enums.DisciplinaEnum;
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
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class ForumQuestionService {

    @Autowired private ForumQuestionRepository questionRepository;
    @Autowired private ExpertAnswerRepository expertAnswerRepository;
    @Autowired private CollaborativeAnswerRepository collaborativeAnswerRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private AuthServiceClient authServiceClient;

    @Transactional
    public QuestionResponseDTO create(CreateQuestionRequestDTO request, String authorUsername) {
        ForumQuestionEntity question = new ForumQuestionEntity();
        question.setTitulo(request.getTitulo().trim());
        question.setDescricao(request.getDescricao().trim());
        question.setQuestionType(request.getQuestionType());
        question.setStatus(QuestionStatus.ABERTA);
        question.setCreatedBy(authorUsername);
        question.setDisciplina(request.getDisciplina());

        question = questionRepository.save(question);

        if (QuestionType.ESPECIALIZADO.equals(request.getQuestionType())) {
            notificationService.notifyNewQuestion(question.getId(), question.getDisciplina().name(), question.getTitulo());
        }

        return QuestionResponseDTO.from(question);
    }

    public Page<QuestionResponseDTO> list(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina, QuestionType questionType, QuestionStatus status, Pageable pageable) {
        // O Hibernate 6 anexa a ordenação do Pageable à native query usando o nome do campo Java
        // (ex: "createdAt") em vez do nome da coluna DB ("created_at"), quebrando no PostgreSQL.
        // A native query já tem ORDER BY created_at DESC, por isso removemos o sort do Pageable.
        Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return questionRepository.findWithFilters(
            disciplina     != null ? disciplina.name()     : null,
            questionType   != null ? questionType.name()   : null,
            status         != null ? status.name()         : null,
            unsorted
        ).map(QuestionResponseDTO::from);
    }

    public QuestionResponseDTO getById(Long id) {
        ForumQuestionEntity question = questionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta não encontrada"));

        QuestionResponseDTO dto = QuestionResponseDTO.from(question);

        List<ExpertAnswerResponseDTO> expertAnswers =
            expertAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(id).stream()
                .map(ExpertAnswerResponseDTO::from).toList();
        List<CollaborativeAnswerResponseDTO> collabAnswers =
            collaborativeAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(id).stream()
                .map(CollaborativeAnswerResponseDTO::from).toList();

        dto.setExpertAnswers(expertAnswers);
        dto.setCollaborativeAnswers(collabAnswers);
        dto.setResponseTimeMinutes(computeResponseTime(question.getCreatedAt(), expertAnswers, collabAnswers));

        return dto;
    }

    public ForumQuestionEntity getEntityById(Long id) {
        return questionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta não encontrada"));
    }

    @Transactional
    public void closeQuestion(Long id) {
        ForumQuestionEntity question = getEntityById(id);
        question.setStatus(QuestionStatus.FECHADA);
        questionRepository.save(question);
    }

    @Transactional
    public void closeQuestionByUser(Long id, String username) {
        ForumQuestionEntity question = getEntityById(id);

        if (!question.getCreatedBy().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas o autor pode fechar esta pergunta.");
        }

        question.setStatus(QuestionStatus.FECHADA);
        questionRepository.save(question);
    }

    @Transactional
    public QuestionResponseDTO getOrCreateCollaborativeRoom(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina) {
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
                return QuestionResponseDTO.from(questionRepository.save(room));
            });
    }

    @Transactional
    public QuestionResponseDTO getOrCreateExpertRoom(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina, String studentUsername) {
        return questionRepository
            .findFirstByDisciplinaAndQuestionTypeAndCreatedByOrderByCreatedAtAsc(disciplina, QuestionType.ESPECIALIZADO, studentUsername)
            .map(QuestionResponseDTO::from)
            .orElseGet(() -> {
                ForumQuestionEntity room = new ForumQuestionEntity();
                room.setTitulo("Chat com Professor - " + displayName(disciplina));
                room.setDescricao("_");
                room.setDisciplina(disciplina);
                room.setQuestionType(QuestionType.ESPECIALIZADO);
                room.setStatus(QuestionStatus.ABERTA);
                room.setCreatedBy(studentUsername);
                return QuestionResponseDTO.from(questionRepository.save(room));
            });
    }

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
        questionRepository.save(question);
    }

    /**
     * Perguntas PENDENTES para o professor:
     * – ESPECIALIZADO: nas disciplinas do professor, sem resposta dele ainda
     * – COLABORATIVO: nas disciplinas do professor, em que o professor ainda não postou
     */
    public List<QuestionResponseDTO> getProfessorPending(String professorUsername) {
        List<DisciplinaEnum> disciplines = resolveDisciplinas(professorUsername);
        if (disciplines.isEmpty()) return List.of();

        // ESPECIALIZADO abertas sem resposta do professor
        List<ForumQuestionEntity> expert = questionRepository
            .findByQuestionTypeAndDisciplinaInAndStatus(QuestionType.ESPECIALIZADO, disciplines, QuestionStatus.ABERTA)
            .stream()
            .filter(q -> !expertAnswerRepository.existsByQuestionIdAndAnsweredBy(q.getId(), professorUsername))
            .collect(Collectors.toList());

        // COLABORATIVO sem post do professor
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

    /**
     * Perguntas RESPONDIDAS pelo professor:
     * – Questões onde o professor deu uma resposta expert
     * – COLABORATIVO das disciplinas do professor com qualquer resposta (aluno ou professor)
     */
    public List<QuestionResponseDTO> getProfessorAnswered(String professorUsername) {
        List<DisciplinaEnum> disciplines = resolveDisciplinas(professorUsername);

        // Questões em que o professor respondeu via expert answer
        List<Long> expertIds = expertAnswerRepository.findByAnsweredBy(professorUsername)
            .stream().map(ExpertAnswerEntity::getQuestionId).distinct().collect(Collectors.toList());
        List<ForumQuestionEntity> expertAnswered = expertIds.isEmpty()
            ? List.of()
            : questionRepository.findAllById(expertIds);

        // COLABORATIVO das disciplinas do professor com pelo menos uma resposta
        List<ForumQuestionEntity> collabWithAnswers = disciplines.isEmpty()
            ? List.of()
            : questionRepository.findByQuestionTypeAndDisciplinaIn(QuestionType.COLABORATIVO, disciplines)
                .stream()
                .filter(q -> collaborativeAnswerRepository.existsByQuestionId(q.getId()))
                .collect(Collectors.toList());

        // Combinar sem duplicados
        Map<Long, ForumQuestionEntity> map = new LinkedHashMap<>();
        expertAnswered.forEach(q -> map.put(q.getId(), q));
        collabWithAnswers.forEach(q -> map.put(q.getId(), q));

        List<ForumQuestionEntity> result = new ArrayList<>(map.values());
        result.sort(Comparator.comparing(ForumQuestionEntity::getCreatedAt).reversed());
        return result.stream().map(this::enrichWithAnswers).collect(Collectors.toList());
    }

    public List<QuestionResponseDTO> getMyQuestions(String username) {
        return questionRepository.findByCreatedByOrderByCreatedAtDesc(username)
            .stream().map(this::enrichWithAnswers).collect(Collectors.toList());
    }

    public ForumStatsDTO getStatsOverview() {
        List<ForumQuestionEntity> all = questionRepository.findAll();

        ForumStatsDTO stats = new ForumStatsDTO();
        stats.setTotalQuestions((long) all.size());

        stats.setTotalByDisciplina(all.stream()
            .collect(Collectors.groupingBy(q -> q.getDisciplina().name(), TreeMap::new, Collectors.counting())));

        stats.setTotalByType(all.stream()
            .collect(Collectors.groupingBy(q -> q.getQuestionType().name(), TreeMap::new, Collectors.counting())));

        stats.setTotalByStatus(all.stream()
            .collect(Collectors.groupingBy(q -> q.getStatus().name(), TreeMap::new, Collectors.counting())));

        // Média de tempo de resposta: considera só questões que têm pelo menos uma resposta
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
            .filter(t -> t != null)
            .collect(Collectors.toList());

        stats.setAvgResponseTimeMinutes(responseTimes.isEmpty()
            ? null
            : responseTimes.stream().mapToLong(Long::longValue).average().orElse(0));

        return stats;
    }

    public ProfessorAssistanceStatsDTO getProfessorAssistanceStats(String professorUsername) {
        List<codelab.api.smart.sae.forum.model.ExpertAnswerEntity> answers =
            expertAnswerRepository.findByAnsweredBy(professorUsername);

        ProfessorAssistanceStatsDTO stats = new ProfessorAssistanceStatsDTO();
        stats.setUsername(professorUsername);
        stats.setTotalAnswered((long) answers.size());
        long accepted = answers.stream().filter(a -> Boolean.TRUE.equals(a.getAccepted())).count();
        stats.setTotalAccepted(accepted);
        stats.setAcceptanceRate(answers.isEmpty() ? 0.0 : (accepted * 100.0 / answers.size()));

        // Disciplinas distintas onde o professor respondeu
        List<String> disciplinas = answers.stream()
            .map(ExpertAnswerEntity::getQuestionId)
            .distinct()
            .map(qid -> questionRepository.findById(qid).orElse(null))
            .filter(q -> q != null)
            .map(q -> q.getDisciplina().name())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        stats.setDisciplinas(disciplinas);

        // Percentagem de assistência: respostas dadas / total questões ESPECIALIZADO nas suas disciplinas
        List<DisciplinaEnum> disciplinaEnums = disciplinas.stream()
            .map(name -> { try { return DisciplinaEnum.valueOf(name); } catch (Exception e) { return null; } })
            .filter(d -> d != null)
            .collect(Collectors.toList());
        long totalEspecializado = disciplinaEnums.isEmpty() ? 0L :
            questionRepository.findByQuestionTypeAndDisciplinaIn(QuestionType.ESPECIALIZADO, disciplinaEnums).size();
        stats.setAssistancePercentage(totalEspecializado == 0 ? 0.0
            : (answers.size() * 100.0 / totalEspecializado));

        // Tempo médio de resposta desta prof em relação à criação das questões
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

    private List<DisciplinaEnum> resolveDisciplinas(String professorUsername) {
        return authServiceClient.getProfessorDisciplineNames(professorUsername)
            .stream()
            .map(name -> {
                try { return DisciplinaEnum.valueOf(name); }
                catch (IllegalArgumentException e) { return null; }
            })
            .filter(java.util.Objects::nonNull)
            .collect(Collectors.toList());
    }

    private String displayName(codelab.api.smart.sae.forum.enums.DisciplinaEnum d) {
        return switch (d) {
            case MATEMATICA -> "Matemática";
            case FISICA -> "Física";
            case QUIMICA -> "Química";
            case BIOLOGIA -> "Biologia";
            case PORTUGUES -> "Português";
            case HISTORIA -> "História";
            case GEOGRAFIA -> "Geografia";
            case INGLES -> "Inglês";
            case FILOSOFIA -> "Filosofia";
            case INFORMATICA -> "Informática";
            case GERAL -> "Geral";
        };
    }
}
