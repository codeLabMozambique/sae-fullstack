package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.dto.ReadingSuggestionDTO;
import codelab.api.smart.sae.content.service.ReadingSuggestionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/professor/suggestions")
public class ProfessorSuggestionResource {

    @Autowired private ReadingSuggestionService suggestionService;

    @PostMapping
    public ResponseEntity<List<ReadingSuggestionDTO>> create(
            @RequestBody Map<String, Object> payload,
            Principal principal,
            HttpServletRequest req) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        String token = req.getHeader("Authorization");
        return ResponseEntity.status(HttpStatus.CREATED).body(
                suggestionService.create(payload, principal.getName(), token));
    }

    @GetMapping
    public ResponseEntity<List<ReadingSuggestionDTO>> listMine(Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(suggestionService.listMine(principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        suggestionService.delete(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
