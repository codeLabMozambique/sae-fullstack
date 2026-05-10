package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.ContentSection;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ContentSectionRepository extends MongoRepository<ContentSection, String> {
    List<ContentSection> findByContentIdOrderByPositionAscStartPageAsc(String contentId);
    void deleteByContentId(String contentId);
}
