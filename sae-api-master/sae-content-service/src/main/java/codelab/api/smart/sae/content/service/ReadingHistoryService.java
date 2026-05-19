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
        recordSession(userId, contentId, pagesRead, durationSeconds, "ONLINE");
    }

    public void recordSession(String userId, String contentId, int pagesRead, long durationSeconds, String accessMode) {
        Content content = contentRepository.findById(contentId).orElse(null);
        String discipline = (content != null) ? content.getDiscipline() : "N/A";
        String title = (content != null) ? content.getTitle() : contentId;

        ReadingHistory history = new ReadingHistory();
        history.setUserId(userId);
        history.setContentId(contentId);
        history.setContentTitle(title);
        history.setDiscipline(discipline);
        history.setPagesRead(pagesRead);
        history.setDurationSeconds(durationSeconds);
        history.setAccessMode(accessMode != null && accessMode.equalsIgnoreCase("OFFLINE") ? "OFFLINE" : "ONLINE");

        readingHistoryRepository.save(history);
    }

    public List<ReadingHistory> getUserHistory(String userId) {
        return readingHistoryRepository.findByUserIdOrderByReadAtDesc(userId);
    }

    public List<ReadingHistory> getFilteredHistory(String userId, String discipline, LocalDateTime from, LocalDateTime to) {
        return readingHistoryRepository.findByUserIdAndDisciplineAndReadAtBetween(userId, discipline, from, to);
    }

    public void deleteEntry(String userId, String id) {
        readingHistoryRepository.deleteByIdAndUserId(id, userId);
    }
}
