package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.SubjectDTO;
import codelab.api.smart.sae.academic.service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subject")
public class SubjectResource {

    @Autowired
    private SubjectService subjectService;

    @GetMapping("/all")
    public ResponseEntity<List<SubjectDTO>> findAllActive() {
        return ResponseEntity.ok(subjectService.findAllActive());
    }

    @PostMapping("/details")
    public ResponseEntity<SubjectDTO> findById(@RequestBody SubjectDTO request) {
        SubjectDTO dto = subjectService.findById(request.getId());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<SubjectDTO> save(@RequestBody SubjectDTO dto) {
        return ResponseEntity.ok(subjectService.save(dto));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/update")
    public ResponseEntity<SubjectDTO> update(@RequestBody SubjectDTO dto) {
        SubjectDTO updated = subjectService.update(dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivate(@RequestBody SubjectDTO request) {
        subjectService.deactivate(request.getId());
        return ResponseEntity.ok().build();
    }
}
