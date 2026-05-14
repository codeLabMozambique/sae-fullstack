package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.SectionProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface SectionProgressRepository extends MongoRepository<SectionProgress, String> {
    Optional<SectionProgress> findByUserIdAndSectionId(String userId, String sectionId);
    List<SectionProgress> findByUserIdAndContentId(String userId, String contentId);
    List<SectionProgress> findByUserId(String userId);
}
