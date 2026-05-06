package codelab.api.smart.sae.forum.resource;

import codelab.api.smart.sae.forum.dto.request.CreateCollaborativeAnswerRequestDTO;
import codelab.api.smart.sae.forum.dto.response.CollaborativeAnswerResponseDTO;
import codelab.api.smart.sae.forum.service.CollaborativeAnswerService;
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
@RequestMapping("/collaborative")
public class CollaborativeAnswerResource {

    @Autowired
    private CollaborativeAnswerService collaborativeAnswerService;

    // EP-7: Criar resposta colaborativa (qualquer utilizador autenticado pode participar)
    @PostMapping("/questions/{id}/answers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CollaborativeAnswerResponseDTO> createAnswer(
            @PathVariable Long id,
            @Valid @RequestBody CreateCollaborativeAnswerRequestDTO request,
            Authentication auth) {
        CollaborativeAnswerResponseDTO dto = collaborativeAnswerService.create(id, request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // EP-8: Listar respostas pendentes (PROFESSOR)
    @GetMapping("/answers/pending")
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<Page<CollaborativeAnswerResponseDTO>> listPending(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(collaborativeAnswerService.listPending(pageable));
    }

    // EP-9: Validar resposta colaborativa
    @PutMapping("/answers/{id}/validate")
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<CollaborativeAnswerResponseDTO> validate(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(collaborativeAnswerService.validate(id, auth.getName()));
    }

    // EP-10: Rejeitar resposta colaborativa
    @PutMapping("/answers/{id}/reject")
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<CollaborativeAnswerResponseDTO> reject(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(collaborativeAnswerService.reject(id, auth.getName()));
    }
}
