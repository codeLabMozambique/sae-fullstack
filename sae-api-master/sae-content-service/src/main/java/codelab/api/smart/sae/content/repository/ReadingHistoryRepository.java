package codelab.api.smart.sae.content.repository;

import codelab.api.smart.sae.content.model.ReadingHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReadingHistoryRepository extends MongoRepository<ReadingHistory, String> {
    List<ReadingHistory> findByUserIdOrderByReadAtDesc(String userId);
    List<ReadingHistory> findByUserIdAndDisciplineAndReadAtBetween(String userId, String discipline, LocalDateTime from, LocalDateTime to);
}
