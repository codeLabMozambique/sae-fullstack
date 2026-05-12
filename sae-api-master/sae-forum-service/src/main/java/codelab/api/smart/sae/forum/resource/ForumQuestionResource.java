package codelab.api.smart.sae.forum.resource;

import codelab.api.smart.sae.forum.dto.request.CreateQuestionRequestDTO;
import codelab.api.smart.sae.forum.dto.response.ForumMemberDTO;
import codelab.api.smart.sae.forum.dto.response.ForumStatsDTO;
import codelab.api.smart.sae.forum.dto.response.ProfessorAssistanceStatsDTO;
import codelab.api.smart.sae.forum.dto.response.QuestionResponseDTO;
import codelab.api.smart.sae.forum.enums.DisciplinaEnum;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.dto.response.ExpertAnswerResponseDTO;
import codelab.api.smart.sae.forum.model.ExpertAnswerEntity;
import codelab.api.smart.sae.forum.service.AIAnswerService;
import codelab.api.smart.sae.forum.service.AuthServiceClient;
import codelab.api.smart.sae.forum.service.ForumQuestionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/questions")
public class ForumQuestionResource {

    @Autowired
    private ForumQuestionService questionService;

    @Autowired
    private AuthServiceClient authServiceClient;

    @Autowired
    private AIAnswerService aiAnswerService;

    // EP-1: Criar pergunta ESPECIALIZADO
    @PostMapping
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<QuestionResponseDTO> createSpecialized(
            @Valid @RequestBody CreateQuestionRequestDTO request,
            Authentication auth) {
        request.setQuestionType(QuestionType.ESPECIALIZADO);
        QuestionResponseDTO dto = questionService.create(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // EP-2: Listar perguntas com filtros e paginação
    @GetMapping
    public ResponseEntity<Page<QuestionResponseDTO>> list(
            @RequestParam(required = false) codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina,
            @RequestParam(required = false) QuestionType questionType,
            @RequestParam(required = false) QuestionStatus status,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(questionService.list(disciplina, questionType, status, pageable));
    }

    // EP-3: Detalhe de uma pergunta com respostas
    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getById(id));
    }

    // EP-6: Criar pergunta COLABORATIVO
    @PostMapping("/collaborative")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<QuestionResponseDTO> createCollaborative(
            @Valid @RequestBody CreateQuestionRequestDTO request,
            Authentication auth) {
        request.setQuestionType(QuestionType.COLABORATIVO);
        QuestionResponseDTO dto = questionService.create(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // EP-11: Fechar Pergunta (Somente o Autor)
    @PutMapping("/{id}/close")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<Void> closeQuestion(@PathVariable Long id, Authentication auth) {
        questionService.closeQuestionByUser(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    // EP-12a: Sala colaborativa por disciplina legada (DisciplinaEnum)
    @GetMapping("/rooms/collaborative/{disciplina}")
    public ResponseEntity<QuestionResponseDTO> getCollaborativeRoom(@PathVariable DisciplinaEnum disciplina) {
        return ResponseEntity.ok(questionService.getOrCreateCollaborativeRoom(disciplina));
    }

    // EP-12b: Sala colaborativa TURMA por subjectId + classroomId
    @GetMapping("/rooms/collaborative/subject/{subjectId}")
    public ResponseEntity<QuestionResponseDTO> getCollaborativeRoomBySubject(
            @PathVariable Long subjectId,
            @RequestParam(required = false) Long classroomId) {
        if (classroomId != null) {
            return ResponseEntity.ok(questionService.getOrCreateCollaborativeRoomBySubject(subjectId, classroomId));
        }
        return ResponseEntity.ok(questionService.getOrCreateCollaborativeRoomBySubjectBroadcast(subjectId));
    }

    // EP-13a: Sala expert por disciplina legada (DisciplinaEnum)
    @GetMapping("/rooms/expert/{disciplina}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<QuestionResponseDTO> getExpertRoom(
            @PathVariable DisciplinaEnum disciplina, Authentication auth) {
        return ResponseEntity.ok(questionService.getOrCreateExpertRoom(disciplina, auth.getName()));
    }

    // EP-13b: Sala expert TURMA por subjectId + classroomId
    @GetMapping("/rooms/expert/subject/{subjectId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<QuestionResponseDTO> getExpertRoomBySubject(
            @PathVariable Long subjectId,
            @RequestParam(required = false) Long classroomId,
            Authentication auth) {
        if (classroomId != null) {
            return ResponseEntity.ok(questionService.getOrCreateExpertRoomBySubject(subjectId, classroomId, auth.getName()));
        }
        return ResponseEntity.ok(questionService.getOrCreateExpertRoomBySubjectBroadcast(subjectId, auth.getName()));
    }

    // EP-18: Membros do fórum para autocomplete de @mention
    @GetMapping("/members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ForumMemberDTO>> getForumMembers(
            @RequestParam Long subjectId,
            @RequestParam(required = false) Long classroomId) {
        return ResponseEntity.ok(questionService.getForumMembers(subjectId, classroomId));
    }

    // EP-15: Listar professores por disciplina (proxy para auth service)
    @GetMapping("/professors/disciplina/{disciplina}")
    public ResponseEntity<List<AuthServiceClient.ProfessorInfo>> getProfessorsByDisciplina(
            @PathVariable DisciplinaEnum disciplina) {
        return ResponseEntity.ok(authServiceClient.getProfessorsByDisciplina(disciplina));
    }

    // Perguntas do utilizador autenticado (aluno ou professor)
    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<QuestionResponseDTO>> getMyQuestions(Authentication auth) {
        return ResponseEntity.ok(questionService.getMyQuestions(auth.getName()));
    }

    // EP-16: Perguntas pendentes filtradas pela especialidade do professor
    @GetMapping("/professor/pending")
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<List<QuestionResponseDTO>> getProfessorPending(Authentication auth) {
        return ResponseEntity.ok(questionService.getProfessorPending(auth.getName()));
    }

    // EP-17: Perguntas respondidas pelo professor (+ colaborativas com actividade)
    @GetMapping("/professor/answered")
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<List<QuestionResponseDTO>> getProfessorAnswered(Authentication auth) {
        return ResponseEntity.ok(questionService.getProfessorAnswered(auth.getName()));
    }

    // EP-14: Definir primeira mensagem de uma sala expert (aluno)
    @PatchMapping("/{id}/message")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateFirstMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        questionService.updateFirstMessage(id, body.getOrDefault("descricao", ""), auth.getName());
        return ResponseEntity.noContent().build();
    }

    // Estatísticas globais do fórum (para painel admin)
    @GetMapping("/stats/overview")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ForumStatsDTO> getStatsOverview() {
        return ResponseEntity.ok(questionService.getStatsOverview());
    }

    // Estatísticas de assistência de um professor específico (para painel admin)
    @GetMapping("/professor/{username}/assistance-stats")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'PROFESSOR')")
    public ResponseEntity<ProfessorAssistanceStatsDTO> getProfessorAssistanceStats(
            @PathVariable String username) {
        return ResponseEntity.ok(questionService.getProfessorAssistanceStats(username));
    }

    // Gerar resposta do Assistente IA para uma questão (quando professor indisponível)
    @PostMapping("/{id}/ai-answer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ExpertAnswerResponseDTO> requestAIAnswer(@PathVariable Long id) {
        ExpertAnswerEntity answer = aiAnswerService.generateAndSave(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(ExpertAnswerResponseDTO.from(answer));
    }
}
