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
        Content content = contentService.getById(id);
        String url = content.getFileUrl();
        String fileName = url.replace("/api/contents/", "").replace("/read", "").replace("/file", "");
        
        java.io.InputStream is = fileStorageService.getFile(fileName);
        
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(new org.springframework.core.io.InputStreamResource(is));
    }
}
