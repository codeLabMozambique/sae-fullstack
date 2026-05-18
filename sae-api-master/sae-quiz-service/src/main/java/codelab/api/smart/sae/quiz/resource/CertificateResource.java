package codelab.api.smart.sae.quiz.resource;

import codelab.api.smart.sae.quiz.dto.CertificateDTO;
import codelab.api.smart.sae.quiz.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/certificates")
public class CertificateResource {

    @Autowired
    private CertificateService certificateService;

    @GetMapping("/my")
    public ResponseEntity<List<CertificateDTO>> getMyCertificates(Authentication auth) {
        return ResponseEntity.ok(certificateService.findByStudent(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CertificateDTO> getCertificate(
            @PathVariable Long id, Authentication auth) {
        return certificateService.findById(id, auth.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
