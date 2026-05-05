package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.service.ContentService;
import codelab.api.smart.sae.content.service.ProfessorContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;

@RestController
@RequestMapping("/api/professor/contents")
public class ProfessorContentResource {

    @Autowired
    private ProfessorContentService professorContentService;

    @Autowired
    private ContentService contentService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Content> upload(@RequestPart("file") MultipartFile file,
                                          @RequestPart("metadata") Content metadata,
                                          Principal principal,
                                          HttpServletRequest request) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        
        String token = request.getHeader("Authorization");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(professorContentService.uploadContent(file, metadata, principal.getName(), token));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        
        Content content = contentService.getById(id);
        
        // Verifica se e o dono
        if (!principal.getName().equals(content.getUploadedBy())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem permissão para apagar este conteúdo");
        }
        
        contentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
