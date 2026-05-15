package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.Attachment;
import codelab.api.smart.sae.content.service.AttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.security.Principal;
import java.util.List;

/**
 * Upload genérico para qualquer utilizador autenticado.
 * Aceita qualquer tipo de ficheiro (PDF, imagens, docs, áudio, etc.).
 * Útil para anexos em chat, fórum, mensagens — qualquer contexto.
 *
 * Limite: 25 MB por ficheiro.
 */
@RestController
@RequestMapping("/api/user/uploads")
public class AttachmentResource {

    @Autowired
    private AttachmentService attachmentService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Attachment> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String context,
            @RequestParam(required = false) String contextId,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Attachment saved = attachmentService.upload(file, principal.getName(), context, contextId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InputStreamResource> stream(@PathVariable String id) {
        Attachment a = attachmentService.getById(id);
        InputStream is = attachmentService.stream(a);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(a.getContentType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + a.getOriginalName() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(new InputStreamResource(is));
    }

    @GetMapping("/{id}/info")
    public ResponseEntity<Attachment> info(@PathVariable String id) {
        return ResponseEntity.ok(attachmentService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<Attachment>> listMine(
            @RequestParam(required = false) String context,
            @RequestParam(required = false) String contextId,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if (context != null && contextId != null) {
            return ResponseEntity.ok(attachmentService.listByContext(context, contextId));
        }
        return ResponseEntity.ok(attachmentService.listByUser(principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       Principal principal,
                                       Authentication auth) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
        attachmentService.delete(id, principal.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
