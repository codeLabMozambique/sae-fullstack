package codelab.api.smart.sae.forum.resource;

import codelab.api.smart.sae.forum.dto.request.CreateQuestionRequestDTO;
import codelab.api.smart.sae.forum.dto.response.QuestionResponseDTO;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
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

@RestController
@RequestMapping("/questions")
public class ForumQuestionResource {

    @Autowired
    private ForumQuestionService questionService;

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
            @RequestParam(required = false) String area,
            @RequestParam(required = false) QuestionType questionType,
            @RequestParam(required = false) QuestionStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(questionService.list(area, questionType, status, pageable));
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
}
