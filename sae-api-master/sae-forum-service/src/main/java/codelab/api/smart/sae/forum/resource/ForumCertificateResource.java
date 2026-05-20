package codelab.api.smart.sae.forum.resource;

import codelab.api.smart.sae.forum.dto.response.ProfessorCertificateDTO;
import codelab.api.smart.sae.forum.service.ProfessorCertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/certificates")
public class ForumCertificateResource {

    @Autowired
    private ProfessorCertificateService certificateService;

    // Professor: ver os seus próprios certificados
    @GetMapping("/mine")
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<List<ProfessorCertificateDTO>> getMyCertificates(Authentication auth) {
        return ResponseEntity.ok(certificateService.getMyCertificates(auth.getName()));
    }

    // Professor: tornar um certificado público
    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<ProfessorCertificateDTO> publish(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(certificateService.publish(id, auth.getName()));
    }

    // Admin: ver certificados de um professor específico
    @GetMapping("/professor/{username}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SCHOOL_ADMIN')")
    public ResponseEntity<List<ProfessorCertificateDTO>> getByProfessor(
            @PathVariable String username) {
        return ResponseEntity.ok(certificateService.getCertificatesByProfessor(username));
    }

    // Admin: publicar / retirar certificado de um professor
    @PutMapping("/{id}/admin-publish")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SCHOOL_ADMIN')")
    public ResponseEntity<ProfessorCertificateDTO> adminPublish(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean makePublic = Boolean.TRUE.equals(body.get("isPublic"));
        return ResponseEntity.ok(certificateService.adminPublish(id, makePublic));
    }

    // Admin: listar todos os certificados
    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SCHOOL_ADMIN')")
    public ResponseEntity<List<ProfessorCertificateDTO>> getAll() {
        return ResponseEntity.ok(certificateService.getAllCertificates());
    }

    // Público: listar certificados publicados
    @GetMapping("/public")
    public ResponseEntity<List<ProfessorCertificateDTO>> getPublic() {
        return ResponseEntity.ok(certificateService.getPublicCertificates());
    }
}
