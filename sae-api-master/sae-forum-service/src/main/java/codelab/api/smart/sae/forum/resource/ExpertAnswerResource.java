package codelab.api.smart.sae.forum.resource;

import codelab.api.smart.sae.forum.dto.request.CreateExpertAnswerRequestDTO;
import codelab.api.smart.sae.forum.dto.response.ExpertAnswerResponseDTO;
import codelab.api.smart.sae.forum.service.ExpertAnswerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class ExpertAnswerResource {

    @Autowired
    private ExpertAnswerService expertAnswerService;

    // EP-4: Criar resposta de especialista
    @PostMapping("/questions/{id}/expert-answers")
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<ExpertAnswerResponseDTO> createExpertAnswer(
            @PathVariable Long id,
            @Valid @RequestBody CreateExpertAnswerRequestDTO request,
            Authentication auth) {
        ExpertAnswerResponseDTO dto = expertAnswerService.create(id, request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // EP-5: Aceitar resposta (fecha a pergunta)
    @PutMapping("/expert-answers/{id}/accept")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<ExpertAnswerResponseDTO> acceptAnswer(
            @PathVariable Long id,
            Authentication auth) {
        ExpertAnswerResponseDTO dto = expertAnswerService.acceptAnswer(id, auth.getName());
        return ResponseEntity.ok(dto);
    }
}
