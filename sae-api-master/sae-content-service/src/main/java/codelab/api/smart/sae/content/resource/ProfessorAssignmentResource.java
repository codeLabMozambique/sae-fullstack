package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.dto.AssignmentDTO;
import codelab.api.smart.sae.content.dto.SubmissionDTO;
import codelab.api.smart.sae.content.service.AssignmentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Endpoints para o professor gerir tarefas (assignments) e avaliar submissões.
 */
@RestController
@RequestMapping("/api/professor/assignments")
public class ProfessorAssignmentResource {

    @Autowired private AssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<AssignmentDTO> create(
            @RequestBody Map<String, Object> payload,
            Principal principal,
            HttpServletRequest req) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        String token = req.getHeader("Authorization");
        AssignmentDTO d = assignmentService.createAssignment(payload, principal.getName(), token);
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
