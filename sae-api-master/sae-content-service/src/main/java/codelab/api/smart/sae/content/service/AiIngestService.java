package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.Content;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Chama o endpoint /api/v1/ingest do AI service Python (ChromaDB RAG)
 * de forma assíncrona após upload de um PDF, para que a IA possa
 * responder perguntas específicas sobre esse livro.
 */
@Service
public class AiIngestService {

    private static final Logger log = LoggerFactory.getLogger(AiIngestService.class);

    @Value("${ai.service.url:http://localhost:8086}")
    private String aiServiceUrl;

    @Value("${ai.service.internal-key:sae-internal-key-2024}")
    private String internalKey;

    @Value("${content.service.public-url:http://localhost:8082}")
    private String contentPublicUrl;

    private final RestTemplate rest = new RestTemplate();

    @Async
    public void ingestAsync(Content content) {
        if (content == null || content.getId() == null || content.getFileUrl() == null) return;
        try {
            String fileUrl = contentPublicUrl + content.getFileUrl();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Service-Key", internalKey);

            Map<String, String> body = new HashMap<>();
            body.put("content_id", content.getId());
            body.put("file_url", fileUrl);
            body.put("title", content.getTitle() != null ? content.getTitle() : "");
            body.put("discipline", content.getDiscipline() != null ? content.getDiscipline() : "");

            rest.postForObject(
                aiServiceUrl + "/api/v1/ingest",
                new HttpEntity<>(body, headers),
                Map.class
            );
            log.info("AI ingest triggered for content_id={} title={}", content.getId(), content.getTitle());
        } catch (Exception e) {
            log.warn("AI ingest failed for content_id={}: {}", content.getId(), e.getMessage());
        }
    }
}
