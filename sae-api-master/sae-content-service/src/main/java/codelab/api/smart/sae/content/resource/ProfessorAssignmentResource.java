package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.dto.AssignmentDTO;
import codelab.api.smart.sae.content.dto.SubmissionDTO;
import codelab.api.smart.sae.content.service.AssignmentService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Endpoints para o professor gerir tarefas (assignments) e avaliar submissões.
 *
 * O endpoint de criação aceita JSON puro (sem anexo) ou multipart/form-data
 * (com um campo "metadata" em JSON + um campo "file" opcional).
 */
@RestController
@RequestMapping("/api/professor/assignments")
public class ProfessorAssignmentResource {

    @Autowired private AssignmentService assignmentService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** JSON simples (sem ficheiro). */
    @PostMapping(consumes = "application/json")
    public ResponseEntity<AssignmentDTO> createJson(
            @RequestBody Map<String, Object> payload,
            Principal principal,
            HttpServletRequest req) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        String token = req.getHeader("Authorization");
        AssignmentDTO d = assignmentService.createAssignment(payload, null, principal.getName(), token);
        return ResponseEntity.status(HttpStatus.CREATED).body(d);
    }

    /** Multipart com anexo opcional. */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<AssignmentDTO> createMultipart(
            @RequestPart("metadata") String metadataJson,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Principal principal,
            HttpServletRequest req) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(metadataJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Metadata JSON inválido: " + e.getMessage());
        }
        if (payload == null) payload = new HashMap<>();
        String token = req.getHeader("Authorization");
        AssignmentDTO d = assignmentService.createAssignment(payload, file, principal.getName(), token);
        return ResponseEntity.status(HttpStatus.CREATED).body(d);
    }

    @GetMapping
    public ResponseEntity<List<AssignmentDTO>> list(
            @RequestParam(required = false) Long classroomId,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(assignmentService.listForProfessor(principal.getName(), classroomId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentDTO> get(@PathVariable Long id, Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(assignmentService.getAssignmentForProfessor(id, principal.getName()));
    }

    /** Edita campos da tarefa — usado sobretudo para estender/reabrir o prazo. */
    @PatchMapping("/{id}")
    public ResponseEntity<AssignmentDTO> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(assignmentService.updateAssignment(id, payload, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        assignmentService.deleteAssignment(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/submissions")
    public ResponseEntity<List<SubmissionDTO>> listSubmissions(
            @PathVariable Long id, Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(assignmentService.listSubmissionsForProfessor(id, principal.getName()));
    }

    @PatchMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<SubmissionDTO> grade(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Object g = payload.get("grade");
        Double grade;
        if (g == null) {
            grade = null;
        } else if (g instanceof Number n) {
            grade = Double.valueOf(n.doubleValue());
        } else {
            grade = Double.valueOf(g.toString());
        }
        return ResponseEntity.ok(assignmentService.gradeSubmission(submissionId, grade, principal.getName()));
    }
}
