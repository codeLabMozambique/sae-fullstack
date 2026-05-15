package codelab.api.smart.sae.academic.resource;

import codelab.api.smart.sae.academic.dto.CurriculumEntryDTO;
import codelab.api.smart.sae.academic.service.CurriculumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/curriculum")
public class CurriculumResource {

    @Autowired
    private CurriculumService curriculumService;

    /** Lista disciplinas do currículo de uma escola para um nível + grupo opcional */
    @GetMapping
    public ResponseEntity<List<CurriculumEntryDTO>> findBySchoolAndLevelAndGroup(
            @RequestParam Long schoolId,
            @RequestParam Long classLevelId,
            @RequestParam(required = false) Long groupId) {
        return ResponseEntity.ok(curriculumService.findBySchoolAndLevelAndGroup(schoolId, classLevelId, groupId));
    }

    /** Lista todas as entradas de um nível numa escola (todos os grupos) */
    @GetMapping("/by-level/{classLevelId}")
    public ResponseEntity<List<CurriculumEntryDTO>> findBySchoolAndLevel(
            @RequestParam Long schoolId,
            @PathVariable Long classLevelId) {
        return ResponseEntity.ok(curriculumService.findBySchoolAndLevel(schoolId, classLevelId));
    }

    /** Adiciona uma disciplina ao currículo de uma escola/nível/grupo */
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @PostMapping("/add")
    public ResponseEntity<?> addEntry(@RequestBody Map<String, Long> body) {
        Long schoolId     = body.get("schoolId");
        Long classLevelId = body.get("classLevelId");
        Long subjectId    = body.get("subjectId");
        Long groupId      = body.get("groupId");      // pode ser null
        if (schoolId == null || classLevelId == null || subjectId == null)
            return ResponseEntity.badRequest().body("schoolId, classLevelId e subjectId são obrigatórios.");
        try {
            return ResponseEntity.ok(curriculumService.addEntry(schoolId, classLevelId, subjectId, groupId));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Remove uma entrada do currículo pelo id */
    @PreAuthorize("hasAnyAuthority('ADMIN','SCHOOL_ADMIN')")
    @DeleteMapping("/{entryId}")
    public ResponseEntity<?> removeEntry(@PathVariable Long entryId) {
        try {
            curriculumService.removeEntry(entryId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
