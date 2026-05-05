package codelab.api.smart.sae.content.resource;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import codelab.api.smart.sae.content.dto.ReadingProgressUpsertDTO;
import codelab.api.smart.sae.content.dto.ReadingProgressView;
import codelab.api.smart.sae.content.security.JwtPrincipal;
import codelab.api.smart.sae.content.service.ReadingProgressService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/user/progress")
public class ReadingProgressResource {

    @Autowired
    private ReadingProgressService progressService;

    @PutMapping("/{contentId}")
    public ResponseEntity<ReadingProgressView> upsert(
            @PathVariable String contentId,
            @Valid @RequestBody ReadingProgressUpsertDTO body) {
        String userId = JwtPrincipal.currentUserIdOrThrow();
        return ResponseEntity.ok(progressService.upsert(userId, contentId, body));
    }

    @GetMapping("/{contentId}")
    public ResponseEntity<ReadingProgressView> getByContent(@PathVariable String contentId) {
        String userId = JwtPrincipal.currentUserIdOrThrow();
        return ResponseEntity.ok(progressService.getByContent(userId, contentId));
    }

    @GetMapping
    public ResponseEntity<List<ReadingProgressView>> list(
            @RequestParam(name = "sort", required = false, defaultValue = "lastReadAt,desc") String sort) {
        String userId = JwtPrincipal.currentUserIdOrThrow();
        return ResponseEntity.ok(progressService.listForUser(userId, sort));
    }
}
