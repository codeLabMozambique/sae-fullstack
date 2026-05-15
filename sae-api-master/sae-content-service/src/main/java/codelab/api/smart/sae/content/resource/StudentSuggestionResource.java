package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.dto.ReadingSuggestionDTO;
import codelab.api.smart.sae.content.service.ReadingSuggestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student/suggestions")
public class StudentSuggestionResource {

    @Autowired private ReadingSuggestionService suggestionService;

    @GetMapping
    public ResponseEntity<List<ReadingSuggestionDTO>> list(
            @RequestParam(required = false) String classroomIds,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        List<Long> ids = parseIds(classroomIds);
        return ResponseEntity.ok(suggestionService.listForStudent(ids));
    }

    private List<Long> parseIds(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> { try { return Long.valueOf(s); } catch (Exception e) { return null; } })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }
}
