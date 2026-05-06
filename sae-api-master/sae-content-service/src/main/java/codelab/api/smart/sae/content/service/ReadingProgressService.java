package codelab.api.smart.sae.content.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import codelab.api.smart.sae.content.dto.ReadingProgressUpsertDTO;
import codelab.api.smart.sae.content.dto.ReadingProgressView;
import codelab.api.smart.sae.content.model.Content;
import codelab.api.smart.sae.content.model.ReadingProgress;
import codelab.api.smart.sae.content.repository.ContentRepository;
import codelab.api.smart.sae.content.repository.ReadingProgressRepository;

@Service
public class ReadingProgressService {

    @Autowired
    private ReadingProgressRepository progressRepository;

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private EventPublisherService eventPublisherService;

    public ReadingProgressView upsert(String userId, String contentId, ReadingProgressUpsertDTO request) {
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteúdo não encontrado"));

        Integer totalPages = content.getTotalPages();
        if (totalPages != null && request.getCurrentPage() != null && request.getCurrentPage() > totalPages) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "currentPage (" + request.getCurrentPage() + ") excede totalPages (" + totalPages + ")");
        }

        ReadingProgress progress = progressRepository
                .findByUserIdAndContentId(userId, contentId)
                .orElseGet(() -> {
                    ReadingProgress p = new ReadingProgress();
                    p.setUserId(userId);
                    p.setContentId(contentId);
                    p.setCreatedAt(LocalDateTime.now());
                    p.setTotalReadingTimeSeconds(0L);
                    return p;
                });

        // Merge rule (per spec): keep the highest currentPage seen
        int incoming = request.getCurrentPage();
        int kept = progress.getCurrentPage() == null ? incoming : Math.max(progress.getCurrentPage(), incoming);
        progress.setCurrentPage(kept);
        progress.setTotalPages(totalPages);

        if (totalPages != null && totalPages > 0) {
            double pct = (kept * 100.0) / totalPages;
            progress.setPercentageComplete(Math.min(100.0, Math.round(pct * 100.0) / 100.0));
        }

        long delta = request.getReadingTimeSecondsDelta() == null ? 0L : request.getReadingTimeSecondsDelta();
        long total = progress.getTotalReadingTimeSeconds() == null ? 0L : progress.getTotalReadingTimeSeconds();
        progress.setTotalReadingTimeSeconds(total + delta);
        progress.setLastReadAt(LocalDateTime.now());

        ReadingProgress saved = progressRepository.save(progress);
        
        // Publicar Evento de Progresso
        eventPublisherService.publishReadingProgress(userId, contentId, saved.getCurrentPage());
        
        return ReadingProgressView.of(saved, content);
    }

    public ReadingProgressView getByContent(String userId, String contentId) {
        ReadingProgress progress = progressRepository.findByUserIdAndContentId(userId, contentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Sem progresso registado para este conteúdo"));
        Content content = contentRepository.findById(contentId).orElse(null);
        return ReadingProgressView.of(progress, content);
    }

    public List<ReadingProgressView> listForUser(String userId, String sortBy) {
        Sort sort = parseSort(sortBy);
        List<ReadingProgress> progresses = progressRepository.findByUserId(userId, sort);
        if (progresses.isEmpty()) return List.of();

        List<String> contentIds = progresses.stream().map(ReadingProgress::getContentId).distinct().toList();
        var contentsById = contentRepository.findAllById(contentIds).stream()
                .collect(Collectors.toMap(Content::getId, c -> c));

        return progresses.stream()
                .map(p -> ReadingProgressView.of(p, contentsById.get(p.getContentId())))
                .toList();
    }

    private Sort parseSort(String sortBy) {
        // Accepts "field,direction" — e.g. "lastReadAt,desc"
        if (sortBy == null || sortBy.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "lastReadAt");
        }
        String[] parts = sortBy.split(",");
        String field = parts[0].trim();
        String mongoField = mapSortField(field);
        Sort.Direction dir = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, mongoField);
    }

    private String mapSortField(String field) {
        return switch (field) {
            case "lastReadAt" -> "last_read_at";
            case "createdAt" -> "created_at";
            case "percentageComplete" -> "percentage_complete";
            case "currentPage" -> "current_page";
            default -> "last_read_at";
        };
    }

    public Optional<ReadingProgress> rawByContent(String userId, String contentId) {
        return progressRepository.findByUserIdAndContentId(userId, contentId);
    }
}
