package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.model.ReadingHistory;
import codelab.api.smart.sae.content.repository.ContentRepository;
import codelab.api.smart.sae.content.repository.ReadingHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReadingHistoryService {

    @Autowired
    private ReadingHistoryRepository readingHistoryRepository;

    @Autowired
    private ContentRepository contentRepository;

    public void recordSession(String userId, String contentId, int pagesRead, long durationSeconds) {
        Content content = contentRepository.findById(contentId).orElse(null);
        String discipline = (content != null) ? content.getDiscipline() : "N/A";

        ReadingHistory history = new ReadingHistory();
        history.setUserId(userId);
        history.setContentId(contentId);
        history.setDiscipline(discipline);
        history.setPagesRead(pagesRead);
        history.setDurationSeconds(durationSeconds);
        
        readingHistoryRepository.save(history);
    }

    public List<ReadingHistory> getUserHistory(String userId) {
        return readingHistoryRepository.findByUserIdOrderByReadAtDesc(userId);
    }

    public List<ReadingHistory> getFilteredHistory(String userId, String discipline, LocalDateTime from, LocalDateTime to) {
        return readingHistoryRepository.findByUserIdAndDisciplineAndReadAtBetween(userId, discipline, from, to);
    }
}
