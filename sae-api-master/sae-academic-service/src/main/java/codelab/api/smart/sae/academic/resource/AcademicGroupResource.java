package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.AcademicGroupDTO;
import codelab.api.smart.sae.academic.service.AcademicGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/academic-group")
public class AcademicGroupResource {

    @Autowired
    private AcademicGroupService academicGroupService;

    @GetMapping("/all")
    public ResponseEntity<List<AcademicGroupDTO>> findAllActive() {
        return ResponseEntity.ok(academicGroupService.findAllActive());
    }

    @GetMapping("/by-school/{schoolId}")
    public ResponseEntity<List<AcademicGroupDTO>> findBySchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok(academicGroupService.findBySchool(schoolId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademicGroupDTO> findById(@PathVariable Long id) {
        AcademicGroupDTO dto = academicGroupService.findById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<AcademicGroupDTO> save(@RequestBody AcademicGroupDTO dto) {
        return ResponseEntity.ok(academicGroupService.save(dto));
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/update")
    public ResponseEntity<AcademicGroupDTO> update(@RequestBody AcademicGroupDTO dto) {
        AcademicGroupDTO updated = academicGroupService.update(dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivate(@RequestBody AcademicGroupDTO request) {
        academicGroupService.deactivate(request.getId());
        return ResponseEntity.ok().build();
    }
}
