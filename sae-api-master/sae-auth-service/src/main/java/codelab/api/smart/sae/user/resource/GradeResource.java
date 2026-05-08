package codelab.api.smart.sae.user.resource;

import codelab.api.smart.sae.user.dto.GradeDTO;
import codelab.api.smart.sae.user.dto.SaveGradeDTO;
import codelab.api.smart.sae.user.model.UserEntity;
import codelab.api.smart.sae.user.service.GradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/grades")
public class GradeResource {

    @Autowired
    private GradeService gradeService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<GradeDTO>> getGrades(
            @RequestParam Long classroomId,
            @RequestParam Long subjectId,
            @RequestParam String period) {
        return ResponseEntity.ok(gradeService.getGrades(classroomId, subjectId, period));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('PROFESSOR')")
    public ResponseEntity<GradeDTO> saveGrade(
            @RequestBody SaveGradeDTO dto,
            Authentication auth) {
        Long professorId = ((UserEntity) auth.getPrincipal()).getId();
        return ResponseEntity.ok(gradeService.saveGrade(dto, professorId));
    }
}
