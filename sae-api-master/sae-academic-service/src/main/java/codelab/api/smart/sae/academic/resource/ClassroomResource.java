package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.ClassroomDTO;
import codelab.api.smart.sae.academic.service.ClassroomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/classroom")
public class ClassroomResource {

    @Autowired
    private ClassroomService classroomService;

    @GetMapping("/all")
    public ResponseEntity<List<ClassroomDTO>> findAllActive() {
        return ResponseEntity.ok(classroomService.findAllActive());
    }

    @PostMapping("/details")
    public ResponseEntity<ClassroomDTO> findById(@RequestBody ClassroomDTO request) {
        ClassroomDTO dto = classroomService.findById(request.getId());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<ClassroomDTO> save(@RequestBody ClassroomDTO dto) {
        return ResponseEntity.ok(classroomService.save(dto));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/update")
    public ResponseEntity<ClassroomDTO> update(@RequestBody ClassroomDTO dto) {
        ClassroomDTO updated = classroomService.update(dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivate(@RequestBody ClassroomDTO request) {
        classroomService.deactivate(request.getId());
        return ResponseEntity.ok().build();
    }
}
