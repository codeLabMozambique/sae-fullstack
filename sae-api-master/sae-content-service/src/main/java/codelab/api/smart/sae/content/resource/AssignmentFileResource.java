package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.jpa.Assignment;
import codelab.api.smart.sae.content.model.jpa.Submission;
import codelab.api.smart.sae.content.service.AssignmentService;
import codelab.api.smart.sae.content.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.security.Principal;

/**
 * Endpoint neutro para descarregar o ficheiro de uma submissão.
 *
 * Acesso restrito ao:
 *   • estudante dono da submissão, OU
 *   • professor que criou a tarefa correspondente
 * (verificado no AssignmentService.requireSubmissionForFileAccess).
 */
@RestController
@RequestMapping("/api/assignments")
public class AssignmentFileResource {

    @Autowired private AssignmentService assignmentService;
    @Autowired private FileStorageService fileStorageService;

    @GetMapping("/submissions/{submissionId}/file")
    public ResponseEntity<InputStreamResource> downloadSubmissionFile(
            @PathVariable Long submissionId,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        boolean isProf = hasAuthority("PROFESSOR") || hasAuthority("ADMIN");
        Submission s = assignmentService.requireSubmissionForFileAccess(
                submissionId, principal.getName(), isProf);

        InputStream is = fileStorageService.getFile(s.getFileName());
        String dispositionName = s.getFileOriginalName() != null ? s.getFileOriginalName() : s.getFileName();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + dispositionName + "\"")
                .body(new InputStreamResource(is));
    }

    /**
     * Descarrega o ficheiro de apoio da tarefa (livro/documento que o professor anexou).
     * Acesso a qualquer utilizador autenticado — o filtro de segurança garante isso.
     */
    @GetMapping("/{assignmentId}/file")
    public ResponseEntity<InputStreamResource> downloadAssignmentFile(
            @PathVariable Long assignmentId,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Assignment a = assignmentService.getAssignmentEntity(assignmentId);
        if (a.getFileName() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa sem ficheiro de apoio");
        }
        InputStream is = fileStorageService.getFile(a.getFileName());
        String dispositionName = a.getFileOriginalName() != null ? a.getFileOriginalName() : a.getFileName();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + dispositionName + "\"")
                .body(new InputStreamResource(is));
    }

    private boolean hasAuthority(String name) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if (name.equalsIgnoreCase(ga.getAuthority())) return true;
        }
        return false;
    }
}
