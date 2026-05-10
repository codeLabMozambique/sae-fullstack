package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.StudyGoal;
import codelab.api.smart.sae.content.repository.StudyGoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StudyGoalService {

    @Autowired
    private StudyGoalRepository studyGoalRepository;

    public StudyGoal save(StudyGoal goal) {
        if (goal.getStatus() == null) goal.setStatus("ACTIVE");
        if (goal.getStartedAt() == null) goal.setStartedAt(LocalDate.now());
        return studyGoalRepository.save(goal);
    }

    public List<StudyGoal> listByUser(String userId, Boolean active) {
        if (active != null) {
            return studyGoalRepository.findByUserIdAndActive(userId, active);
        }
        return studyGoalRepository.findByUserId(userId);
    }

    public List<StudyGoal> listByUserAndStatus(String userId, String status) {
        return studyGoalRepository.findByUserIdAndStatus(userId, status);
    }

    public StudyGoal getById(String id) {
        return studyGoalRepository.findById(id).orElse(null);
    }

    public void updateProgress(String id, int pagesToAdd, int minutesToAdd) {
        StudyGoal goal = getById(id);
        if (goal == null) return;
        if ("TIME".equals(goal.getGoalUnit()) && minutesToAdd > 0) {
            int newMinutes = goal.getCurrentMinutes() + minutesToAdd;
            goal.setCurrentMinutes(newMinutes);
            if (newMinutes >= goal.getTargetMinutes() && goal.getTargetMinutes() > 0) {
                goal.setStatus("COMPLETED");
                goal.setActive(false);
            }
        } else {
            int newPages = goal.getCurrentPages() + pagesToAdd;
            goal.setCurrentPages(newPages);
            if (newPages >= goal.getTargetPages() && goal.getTargetPages() > 0) {
                goal.setStatus("COMPLETED");
                goal.setActive(false);
            }
        }
        studyGoalRepository.save(goal);
    }

    public StudyGoal pause(String id) {
        StudyGoal goal = getById(id);
        if (goal == null) return null;
        goal.setStatus("PAUSED");
        goal.setActive(false);
        return studyGoalRepository.save(goal);
    }

    public StudyGoal resume(String id) {
        StudyGoal goal = getById(id);
        if (goal == null) return null;
        goal.setStatus("ACTIVE");
        goal.setActive(true);
        return studyGoalRepository.save(goal);
    }

    public StudyGoal reset(String id) {
        StudyGoal goal = getById(id);
        if (goal == null) return null;
        goal.setCurrentPages(0);
        goal.setCurrentMinutes(0);
        goal.setStatus("ACTIVE");
        goal.setActive(true);
        goal.setStartedAt(LocalDate.now());
        return studyGoalRepository.save(goal);
    }

    public void delete(String id) {
        studyGoalRepository.deleteById(id);
    }
}
