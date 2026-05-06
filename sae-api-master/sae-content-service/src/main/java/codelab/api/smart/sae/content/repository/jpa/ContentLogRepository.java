package codelab.api.smart.sae.content.repository.jpa;

import codelab.api.smart.sae.content.model.jpa.ContentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentLogRepository extends JpaRepository<ContentLog, Long> {
    List<ContentLog> findByContentId(String contentId);
    List<ContentLog> findByUserUsername(String username);
}
