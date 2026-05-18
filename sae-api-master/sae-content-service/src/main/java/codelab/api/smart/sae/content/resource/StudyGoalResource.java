package codelab.api.smart.sae.content.resource;

import codelab.api.smart.sae.content.model.StudyGoal;
import codelab.api.smart.sae.content.service.ReminderSchedulerService;
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

    @Autowired
    private ReminderSchedulerService reminderSchedulerService;

    /**
     * Dispara manualmente o sweep de lembretes — útil para testar sem esperar pelas 8h.
     * Devolve o número de emails enviados.
     */
    @PostMapping("/reminders/run-now")
    public ResponseEntity<Map<String, Object>> runRemindersNow(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        int sent = reminderSchedulerService.runReminderSweep();
        return ResponseEntity.ok(Map.of("sent", sent));
    }

    @PostMapping
    public ResponseEntity<StudyGoal> create(@RequestBody StudyGoal goal, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        goal.setUserId(principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(studyGoalService.save(goal));
    }

    @GetMapping
    public ResponseEntity<List<StudyGoal>> list(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String status,
            Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (status != null) {
            return ResponseEntity.ok(studyGoalService.listByUserAndStatus(principal.getName(), status));
        }
        return ResponseEntity.ok(studyGoalService.listByUser(principal.getName(), active));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudyGoal> get(@PathVariable String id) {
        StudyGoal goal = studyGoalService.getById(id);
        return goal != null ? ResponseEntity.ok(goal) : ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<StudyGoal> update(@PathVariable String id,
            @RequestBody StudyGoal updates, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        StudyGoal existing = studyGoalService.getById(id);
        if (existing == null || !existing.getUserId().equals(principal.getName()))
            return ResponseEntity.notFound().build();

        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getGoalUnit() != null) existing.setGoalUnit(updates.getGoalUnit());
        if (updates.getTargetPages() > 0) existing.setTargetPages(updates.getTargetPages());
        if (updates.getDailyPagesTarget() > 0) existing.setDailyPagesTarget(updates.getDailyPagesTarget());
        if (updates.getTargetMinutes() > 0) existing.setTargetMinutes(updates.getTargetMinutes());
        if (updates.getDailyMinutesTarget() > 0) existing.setDailyMinutesTarget(updates.getDailyMinutesTarget());
        if (updates.getDeadline() != null) existing.setDeadline(updates.getDeadline());
        if (updates.getDiscipline() != null) existing.setDiscipline(updates.getDiscipline());
        if (updates.getCategory() != null) existing.setCategory(updates.getCategory());
        if (updates.getContentId() != null) existing.setContentId(updates.getContentId());
        if (updates.getContentTitle() != null) existing.setContentTitle(updates.getContentTitle());
        if (updates.getContentThumbnail() != null) existing.setContentThumbnail(updates.getContentThumbnail());

        return ResponseEntity.ok(studyGoalService.save(existing));
    }

    @PostMapping("/{id}/progress")
    public ResponseEntity<Void> addProgress(@PathVariable String id,
            @RequestBody Map<String, Integer> payload) {
        studyGoalService.updateProgress(id,
            payload.getOrDefault("pages", 0),
            payload.getOrDefault("minutes", 0));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/pause")
    public ResponseEntity<StudyGoal> pause(@PathVariable String id, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        StudyGoal goal = studyGoalService.getById(id);
        if (goal == null || !goal.getUserId().equals(principal.getName()))
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(studyGoalService.pause(id));
    }

    @PutMapping("/{id}/resume")
    public ResponseEntity<StudyGoal> resume(@PathVariable String id, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        StudyGoal goal = studyGoalService.getById(id);
        if (goal == null || !goal.getUserId().equals(principal.getName()))
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(studyGoalService.resume(id));
    }

    @PutMapping("/{id}/reset")
    public ResponseEntity<StudyGoal> reset(@PathVariable String id, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        StudyGoal goal = studyGoalService.getById(id);
        if (goal == null || !goal.getUserId().equals(principal.getName()))
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(studyGoalService.reset(id));
    }

    @PutMapping("/{id}/reminder")
    public ResponseEntity<StudyGoal> setReminder(@PathVariable String id,
            @RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        StudyGoal goal = studyGoalService.getById(id);
        if (goal == null || !goal.getUserId().equals(principal.getName()))
            return ResponseEntity.notFound().build();

        goal.setReminderEmail((String) payload.get("email"));
        goal.setReminderEnabled(true);
        Object freq = payload.get("frequency");
        if (freq != null) goal.setReminderFrequency(freq.toString());
        Object days = payload.get("daysBefore");
        if (days instanceof Number) goal.setReminderDaysBefore(((Number) days).intValue());
        Object time = payload.get("time");
        if (time != null) goal.setReminderTime(time.toString());

        return ResponseEntity.ok(studyGoalService.save(goal));
    }

    @DeleteMapping("/{id}/reminder")
    public ResponseEntity<StudyGoal> removeReminder(@PathVariable String id, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        StudyGoal goal = studyGoalService.getById(id);
        if (goal == null || !goal.getUserId().equals(principal.getName()))
            return ResponseEntity.notFound().build();
        goal.setReminderEnabled(false);
        goal.setReminderEmail(null);
        return ResponseEntity.ok(studyGoalService.save(goal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        studyGoalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
