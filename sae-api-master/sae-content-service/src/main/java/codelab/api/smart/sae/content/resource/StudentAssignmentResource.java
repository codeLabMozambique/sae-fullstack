package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.dto.AssignmentDTO;
import codelab.api.smart.sae.content.dto.SubmissionDTO;
import codelab.api.smart.sae.content.service.AssignmentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Endpoints para o aluno listar tarefas das suas turmas e submeter trabalhos.
 *
 * As turmas do aluno chegam como query param `classroomIds=1,2,3` — o frontend
 * obtém-as via auth-service / perfil do utilizador antes de chamar este endpoint.
 */
@RestController
@RequestMapping("/api/student/assignments")
public class StudentAssignmentResource {

    @Autowired private AssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<List<AssignmentDTO>> list(
            @RequestParam(required = false) String classroomIds,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(
                assignmentService.listForStudent(parseIds(classroomIds), principal.getName())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentDTO> get(
            @PathVariable Long id,
            @RequestParam(required = false) String classroomIds,
            Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(
                assignmentService.getForStudent(id, parseIds(classroomIds), principal.getName())
        );
    }

    @PostMapping(value = "/{id}/submit", consumes = "multipart/form-data")
    public ResponseEntity<SubmissionDTO> submit(
            @PathVariable Long id,
            @RequestPart(required = false) String comment,
            @RequestPart(required = false) MultipartFile file,
            @RequestParam(required = false) String classroomIds,
            Principal principal,
            HttpServletRequest req) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        String token = req.getHeader("Authorization");
        SubmissionDTO d = assignmentService.submit(
                id, comment, file, parseIds(classroomIds), principal.getName(), token);
        return ResponseEntity.status(HttpStatus.CREATED).body(d);
    }

    @GetMapping("/submissions/mine")
    public ResponseEntity<List<SubmissionDTO>> mySubmissions(Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(assignmentService.listMySubmissions(principal.getName()));
    }

    private List<Long> parseIds(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try { return Long.valueOf(s); } catch (NumberFormatException e) { return null; }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }
}
