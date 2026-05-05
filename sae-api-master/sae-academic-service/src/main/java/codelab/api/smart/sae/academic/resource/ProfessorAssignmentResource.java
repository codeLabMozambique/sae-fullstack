package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.ProfessorAssignmentDTO;
import codelab.api.smart.sae.academic.service.ProfessorAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/professor-assignment")
public class ProfessorAssignmentResource {

    @Autowired
    private ProfessorAssignmentService professorAssignmentService;

    @GetMapping("/all")
    public ResponseEntity<List<ProfessorAssignmentDTO>> findAllActive() {
        return ResponseEntity.ok(professorAssignmentService.findAllActive());
    }

    @PostMapping("/details")
    public ResponseEntity<ProfessorAssignmentDTO> findById(@RequestBody ProfessorAssignmentDTO request) {
        ProfessorAssignmentDTO dto = professorAssignmentService.findById(request.getId());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<ProfessorAssignmentDTO> save(@RequestBody ProfessorAssignmentDTO dto) {
        return ResponseEntity.ok(professorAssignmentService.save(dto));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/update")
    public ResponseEntity<ProfessorAssignmentDTO> update(@RequestBody ProfessorAssignmentDTO dto) {
        ProfessorAssignmentDTO updated = professorAssignmentService.update(dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivate(@RequestBody ProfessorAssignmentDTO request) {
        professorAssignmentService.deactivate(request.getId());
        return ResponseEntity.ok().build();
    }
}
