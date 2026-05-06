package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.SchoolFullDTO;
import codelab.api.smart.sae.academic.dto.SchoolDTO;
import codelab.api.smart.sae.academic.service.SchoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/school")
public class SchoolResource {

    @Autowired
    private SchoolService schoolService;

    @GetMapping("/all")
    public ResponseEntity<List<SchoolDTO>> findAllActive() {
        return ResponseEntity.ok(schoolService.findAllActive());
    }

    @PostMapping("/details")
    public ResponseEntity<SchoolDTO> findById(@RequestBody SchoolDTO request) {
        SchoolDTO dto = schoolService.findById(request.getId());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping("/full-details")
    public ResponseEntity<SchoolFullDTO> findFullById(@RequestBody SchoolDTO request) {
        SchoolFullDTO dto = schoolService.findFullById(request.getId());
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<SchoolDTO> save(@RequestBody SchoolDTO dto) {
        return ResponseEntity.ok(schoolService.save(dto));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/update")
    public ResponseEntity<SchoolDTO> update(@RequestBody SchoolDTO dto) {
        SchoolDTO updated = schoolService.update(dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivate(@RequestBody SchoolDTO request) {
        schoolService.deactivate(request.getId());
        return ResponseEntity.ok().build();
    }
}
