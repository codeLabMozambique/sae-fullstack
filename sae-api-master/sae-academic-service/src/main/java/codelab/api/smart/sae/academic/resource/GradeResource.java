package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.GradeDTO;
import codelab.api.smart.sae.academic.service.GradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/grades")
public class GradeResource {

    @Autowired
    private GradeService gradeService;

    @GetMapping
    public ResponseEntity<List<GradeDTO>> list(
            @RequestParam Long classroomId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam String academicYear) {
        if (subjectId != null) {
            return ResponseEntity.ok(gradeService.findByClassroomAndSubject(classroomId, subjectId, academicYear));
        }
        return ResponseEntity.ok(gradeService.findByClassroom(classroomId, academicYear));
    }

    @PostMapping
    public ResponseEntity<GradeDTO> save(@RequestBody GradeDTO dto) {
        return ResponseEntity.ok(gradeService.save(dto));
    }
}
