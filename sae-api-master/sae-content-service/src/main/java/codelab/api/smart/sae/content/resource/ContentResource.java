package codelab.api.smart.sae.content.resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.service.ContentService;

@RestController
@RequestMapping("/api/contents")
public class ContentResource {

    @Autowired
    private ContentService contentService;

    @Autowired
    private codelab.api.smart.sae.content.service.FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<Page<Content>> list(
            @RequestParam(required = false) String discipline,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long classroomId,
            @RequestParam(required = false) String uploadedBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(contentService.list(discipline, level, classroomId, uploadedBy, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Content>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(contentService.search(q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Content> getById(@PathVariable String id) {
        return ResponseEntity.ok(contentService.getById(id));
    }

    @GetMapping("/{id}/read")
    public ResponseEntity<org.springframework.core.io.InputStreamResource> readFile(@PathVariable String id) {
        // Tenta primeiro como Content document (caminho normal)
        try {
            Content content = contentService.getById(id);
            String url = content.getFileUrl();
            String fileName = url.replace("/api/contents/", "").replace("/read", "").replace("/file", "").replace("/files/", "");
            return serveFile(fileName, org.springframework.http.MediaType.APPLICATION_PDF);
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            // Fallback: trata `id` como nome de ficheiro no MinIO (thumbnails antigos)
            return serveFile(id, guessMediaType(id));
        }
    }

    /**
     * Endpoint dedicado para servir ficheiros directamente pelo nome (sem lookup no Mongo).
     * Usado por thumbnails e qualquer ficheiro guardado pelo nome no MinIO.
     */
    @GetMapping("/files/{fileName}")
    public ResponseEntity<org.springframework.core.io.InputStreamResource> readByFileName(@PathVariable String fileName) {
        return serveFile(fileName, guessMediaType(fileName));
    }

    private ResponseEntity<org.springframework.core.io.InputStreamResource> serveFile(
            String fileName, org.springframework.http.MediaType mediaType) {
        try {
            java.io.InputStream is = fileStorageService.getFile(fileName);
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + fileName + "\"")
                    .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(new org.springframework.core.io.InputStreamResource(is));
        } catch (RuntimeException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Ficheiro não encontrado: " + fileName);
        }
    }

    private org.springframework.http.MediaType guessMediaType(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return org.springframework.http.MediaType.IMAGE_JPEG;
        if (n.endsWith(".png"))  return org.springframework.http.MediaType.IMAGE_PNG;
        if (n.endsWith(".webp")) return org.springframework.http.MediaType.parseMediaType("image/webp");
        if (n.endsWith(".gif"))  return org.springframework.http.MediaType.IMAGE_GIF;
        return org.springframework.http.MediaType.APPLICATION_PDF;
    }
}
