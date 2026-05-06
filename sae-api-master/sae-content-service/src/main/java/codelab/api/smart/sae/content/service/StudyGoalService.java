package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.StudyGoal;
import codelab.api.smart.sae.content.repository.StudyGoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudyGoalService {

    @Autowired
    private StudyGoalRepository studyGoalRepository;

    public StudyGoal save(StudyGoal goal) {
        return studyGoalRepository.save(goal);
    }

    public List<StudyGoal> listByUser(String userId, Boolean active) {
        if (active != null) {
            return studyGoalRepository.findByUserIdAndActive(userId, active);
        }
        return studyGoalRepository.findByUserId(userId);
    }

    public StudyGoal getById(String id) {
        return studyGoalRepository.findById(id).orElse(null);
    }

    public void updateProgress(String id, int pagesToAdd) {
        StudyGoal goal = getById(id);
        if (goal != null) {
            goal.setCurrentPages(goal.getCurrentPages() + pagesToAdd);
            studyGoalRepository.save(goal);
        }
    }

    public void delete(String id) {
        studyGoalRepository.deleteById(id);
    }
}
