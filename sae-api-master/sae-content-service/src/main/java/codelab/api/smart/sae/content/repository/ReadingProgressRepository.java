package codelab.api.smart.sae.content.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import codelab.api.smart.sae.content.model.ReadingProgress;

@Repository
public interface ReadingProgressRepository extends MongoRepository<ReadingProgress, String> {

    Optional<ReadingProgress> findByUserIdAndContentId(String userId, String contentId);

    List<ReadingProgress> findByUserId(String userId, Sort sort);
}
