package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.StudyGoal;
import codelab.api.smart.sae.content.service.StudyGoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/goals")
public class StudyGoalResource {

    @Autowired
    private StudyGoalService studyGoalService;

    @PostMapping
    public ResponseEntity<StudyGoal> create(@RequestBody StudyGoal goal, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        goal.setUserId(principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(studyGoalService.save(goal));
    }

    @GetMapping
    public ResponseEntity<List<StudyGoal>> list(@RequestParam(required = false) Boolean active, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(studyGoalService.listByUser(principal.getName(), active));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudyGoal> get(@PathVariable String id) {
        return ResponseEntity.ok(studyGoalService.getById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<StudyGoal> update(@PathVariable String id, @RequestBody StudyGoal updates) {
        StudyGoal existing = studyGoalService.getById(id);
        if (existing == null) return ResponseEntity.notFound().build();
        
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getTargetPages() > 0) existing.setTargetPages(updates.getTargetPages());
        existing.setActive(updates.isActive());
        
        return ResponseEntity.ok(studyGoalService.save(existing));
    }

    @PostMapping("/{id}/progress")
    public ResponseEntity<Void> addProgress(@PathVariable String id, @RequestBody Map<String, Integer> payload) {
        studyGoalService.updateProgress(id, payload.getOrDefault("pages", 0));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        studyGoalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
