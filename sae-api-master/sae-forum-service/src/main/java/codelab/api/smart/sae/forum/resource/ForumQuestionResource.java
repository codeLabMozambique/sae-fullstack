package codelab.api.smart.sae.forum.resource;

import codelab.api.smart.sae.forum.dto.request.CreateQuestionRequestDTO;
import codelab.api.smart.sae.forum.dto.response.QuestionResponseDTO;
import codelab.api.smart.sae.forum.enums.DisciplinaEnum;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.service.AuthServiceClient;
import codelab.api.smart.sae.forum.service.ForumQuestionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
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

    // EP-12: Obter ou criar sala colaborativa da turma (por disciplina)
    @GetMapping("/rooms/collaborative/{disciplina}")
    public ResponseEntity<QuestionResponseDTO> getCollaborativeRoom(@PathVariable DisciplinaEnum disciplina) {
        return ResponseEntity.ok(questionService.getOrCreateCollaborativeRoom(disciplina));
    }

    // EP-13: Obter ou criar sala privada com professor (por disciplina, específica do aluno)
    @GetMapping("/rooms/expert/{disciplina}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<QuestionResponseDTO> getExpertRoom(
            @PathVariable DisciplinaEnum disciplina, Authentication auth) {
        return ResponseEntity.ok(questionService.getOrCreateExpertRoom(disciplina, auth.getName()));
    }

    // EP-15: Listar professores por disciplina (proxy para auth service)
    @GetMapping("/professors/disciplina/{disciplina}")
    public ResponseEntity<List<AuthServiceClient.ProfessorInfo>> getProfessorsByDisciplina(
            @PathVariable DisciplinaEnum disciplina) {
        return ResponseEntity.ok(authServiceClient.getProfessorsByDisciplina(disciplina));
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
}
