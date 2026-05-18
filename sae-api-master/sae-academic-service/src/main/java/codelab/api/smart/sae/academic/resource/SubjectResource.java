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

    @GetMapping("/by-school/{schoolId}")
    public ResponseEntity<List<SubjectDTO>> findBySchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok(subjectService.findBySchool(schoolId));
    }

    @GetMapping("/by-school/{schoolId}/by-class-level/{classLevelId}")
    public ResponseEntity<List<SubjectDTO>> findBySchoolAndClassLevel(
            @PathVariable Long schoolId, @PathVariable Long classLevelId) {
        return ResponseEntity.ok(subjectService.findBySchoolAndClassLevel(schoolId, classLevelId));
    }

    @GetMapping("/by-class-level/{classLevelId}")
    public ResponseEntity<List<SubjectDTO>> findByClassLevel(@PathVariable Long classLevelId) {
        return ResponseEntity.ok(subjectService.findByClassLevel(classLevelId));
    }

    @GetMapping("/by-class-level/{classLevelId}/with-group")
    public ResponseEntity<List<SubjectDTO>> findByClassLevelAndGroup(
            @PathVariable Long classLevelId,
            @RequestParam(required = false) Long groupId) {
        return ResponseEntity.ok(subjectService.findByClassLevelAndGroup(classLevelId, groupId));
    }

    @GetMapping("/by-classroom")
    public ResponseEntity<List<SubjectDTO>> findByClassroom(
            @RequestParam @org.springframework.lang.NonNull Long classroomId) {
        return ResponseEntity.ok(subjectService.findByClassroomId(classroomId));
    }

    @PostMapping("/details")
    public ResponseEntity<SubjectDTO> findById(@RequestBody SubjectDTO request) {
        SubjectDTO dto = subjectService.findById(request.getId());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<SubjectDTO> save(@RequestBody SubjectDTO dto) {
        return ResponseEntity.ok(subjectService.save(dto));
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/update")
    public ResponseEntity<SubjectDTO> update(@RequestBody SubjectDTO dto) {
        SubjectDTO updated = subjectService.update(dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivate(@RequestBody SubjectDTO request) {
        subjectService.deactivate(request.getId());
        return ResponseEntity.ok().build();
    }
}
