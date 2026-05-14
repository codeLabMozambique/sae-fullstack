package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.ContentSection;
import codelab.api.smart.sae.content.repository.ContentSectionRepository;
import codelab.api.smart.sae.content.service.ContentSectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contents/{contentId}/sections")
public class ContentSectionResource {

    @Autowired private ContentSectionService sectionService;
    @Autowired private ContentSectionRepository sectionRepository;

    /** Lista secções — público (coberto pela regra GET /api/contents/**) */
    @GetMapping
    public ResponseEntity<List<ContentSection>> list(@PathVariable String contentId) {
        return ResponseEntity.ok(sectionService.getSections(contentId));
    }

    /** Extrai texto de um intervalo de páginas — público */
    @GetMapping("/text")
    public ResponseEntity<Map<String, Object>> extractText(
            @PathVariable String contentId,
            @RequestParam int startPage,
            @RequestParam int endPage) {
        String text = sectionService.extractTextFromContent(contentId, startPage, endPage);
        return ResponseEntity.ok(Map.of(
                "contentId", contentId,
                "startPage", startPage,
                "endPage", endPage,
                "text", text,
                "charCount", text.length()
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<ContentSection> create(
            @PathVariable String contentId,
            @RequestBody ContentSection section) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sectionService.createSection(contentId, section));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<ContentSection> update(
            @PathVariable String contentId,
            @PathVariable String id,
            @RequestBody ContentSection section) {
        return ResponseEntity.ok(sectionService.updateSection(contentId, id, section));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable String contentId,
            @PathVariable String id) {
        sectionService.deleteSection(contentId, id);
        return ResponseEntity.noContent().build();
    }

    /** Liga um quiz gerado por IA a esta secção */
    @PatchMapping("/{id}/quiz")
    @PreAuthorize("hasAnyAuthority('PROFESSOR','ADMIN')")
    public ResponseEntity<ContentSection> linkQuiz(
            @PathVariable String contentId,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        ContentSection section = sectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Secção não encontrada"));
        if (!section.getContentId().equals(contentId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Secção não pertence ao conteúdo");
        Long quizId = body.containsKey("quizId") ? ((Number) body.get("quizId")).longValue() : null;
        section.setQuizId(quizId);
        return ResponseEntity.ok(sectionRepository.save(section));
    }
}
