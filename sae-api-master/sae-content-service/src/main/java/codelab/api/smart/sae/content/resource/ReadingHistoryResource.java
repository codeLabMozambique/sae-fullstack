package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.ReadingHistory;
import codelab.api.smart.sae.content.service.ReadingHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/history")
public class ReadingHistoryResource {

    @Autowired
    private ReadingHistoryService readingHistoryService;

    @PostMapping
    public ResponseEntity<Void> record(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        String contentId = (String) payload.get("contentId");
        int pagesRead = (int) payload.getOrDefault("pagesRead", 0);
        long durationSeconds = ((Number) payload.getOrDefault("durationSeconds", 0)).longValue();
        
        readingHistoryService.recordSession(principal.getName(), contentId, pagesRead, durationSeconds);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping
    public ResponseEntity<List<ReadingHistory>> getHistory(
            @RequestParam(required = false) String discipline,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Principal principal) {
        
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (discipline != null && from != null && to != null) {
            return ResponseEntity.ok(readingHistoryService.getFilteredHistory(principal.getName(), discipline, from, to));
        }
        
        return ResponseEntity.ok(readingHistoryService.getUserHistory(principal.getName()));
    }
}
