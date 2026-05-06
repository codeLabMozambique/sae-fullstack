package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.Favorite;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends MongoRepository<Favorite, String> {
    List<Favorite> findByUserId(String userId);
    Optional<Favorite> findByUserIdAndContentId(String userId, String contentId);
    void deleteByUserIdAndContentId(String userId, String contentId);
    boolean existsByUserIdAndContentId(String userId, String contentId);
}
