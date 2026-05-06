package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.ClassLevelDTO;
import codelab.api.smart.sae.academic.service.ClassLevelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/class-level")
public class ClassLevelResource {

    @Autowired
    private ClassLevelService classLevelService;

    @GetMapping("/all")
    public ResponseEntity<List<ClassLevelDTO>> findAllActive() {
        return ResponseEntity.ok(classLevelService.findAllActive());
    }

    @PostMapping("/details")
    public ResponseEntity<ClassLevelDTO> findById(@RequestBody ClassLevelDTO request) {
        ClassLevelDTO dto = classLevelService.findById(request.getId());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<ClassLevelDTO> save(@RequestBody ClassLevelDTO dto) {
        return ResponseEntity.ok(classLevelService.save(dto));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/update")
    public ResponseEntity<ClassLevelDTO> update(@RequestBody ClassLevelDTO dto) {
        ClassLevelDTO updated = classLevelService.update(dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivate(@RequestBody ClassLevelDTO request) {
        classLevelService.deactivate(request.getId());
        return ResponseEntity.ok().build();
    }
}
