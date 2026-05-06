package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.service.AdminContentService;
import codelab.api.smart.sae.content.service.ContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/contents")
public class AdminContentResource {

    @Autowired
    private AdminContentService adminContentService;

    @Autowired
    private ContentService contentService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Content> upload(
            @RequestPart("file") MultipartFile file,
            @RequestPart("metadata") Content metadata,
            Principal principal) {
        String adminUser = (principal != null) ? principal.getName() : "admin";
        return ResponseEntity.status(HttpStatus.CREATED).body(adminContentService.uploadContent(file, metadata, adminUser));
    }

    @PostMapping(value = "/batch", consumes = "multipart/form-data")
    public ResponseEntity<List<Content>> batchUpload(
            @RequestPart("files") List<MultipartFile> files,
            Principal principal) {
        String adminUser = (principal != null) ? principal.getName() : "admin";
        return ResponseEntity.status(HttpStatus.CREATED).body(adminContentService.batchUpload(files, adminUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Principal principal) {
        String username = (principal != null) ? principal.getName() : "admin";
        contentService.delete(id, username);
        return ResponseEntity.noContent().build();
    }
}
