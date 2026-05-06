package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.StudyGoal;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyGoalRepository extends MongoRepository<StudyGoal, String> {
    List<StudyGoal> findByUserId(String userId);
    List<StudyGoal> findByUserIdAndActive(String userId, boolean active);
}
