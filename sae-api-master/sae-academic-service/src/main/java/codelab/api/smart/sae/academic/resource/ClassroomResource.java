package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.ClassroomDTO;
import codelab.api.smart.sae.academic.service.ClassroomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/classroom")
public class ClassroomResource {

    @Autowired
    private ClassroomService classroomService;

    @GetMapping("/all")
    public ResponseEntity<List<ClassroomDTO>> findAllActive() {
        return ResponseEntity.ok(classroomService.findAllActive());
    }

    @GetMapping("/by-school/{schoolId}")
    public ResponseEntity<List<ClassroomDTO>> findBySchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok(classroomService.findBySchool(schoolId));
    }

    @GetMapping("/by-class-level/{classLevelId}")
    public ResponseEntity<List<ClassroomDTO>> findByClassLevel(
            @PathVariable Long classLevelId,
            @RequestParam(required = false) Long schoolId) {
        if (schoolId != null) {
            return ResponseEntity.ok(classroomService.findBySchoolAndClassLevel(schoolId, classLevelId));
        }
        return ResponseEntity.ok(classroomService.findByClassLevel(classLevelId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassroomDTO> findByIdGet(@PathVariable Long id) {
        ClassroomDTO dto = classroomService.findById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping("/details")
    public ResponseEntity<ClassroomDTO> findById(@RequestBody ClassroomDTO request) {
        ClassroomDTO dto = classroomService.findById(request.getId());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<ClassroomDTO> save(@RequestBody ClassroomDTO dto) {
        return ResponseEntity.ok(classroomService.save(dto));
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/update")
    public ResponseEntity<ClassroomDTO> update(@RequestBody ClassroomDTO dto) {
        ClassroomDTO updated = classroomService.update(dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivate(@RequestBody ClassroomDTO request) {
        classroomService.deactivate(request.getId());
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PutMapping("/set-director")
    public ResponseEntity<ClassroomDTO> setDirector(@RequestBody Map<String, Long> body) {
        ClassroomDTO dto = classroomService.setDirector(body.get("classroomId"), body.get("directorId"));
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @GetMapping("/by-director")
    public ResponseEntity<ClassroomDTO> findByDirector(@RequestParam Long directorId) {
        ClassroomDTO dto = classroomService.findByDirectorId(directorId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }
}
