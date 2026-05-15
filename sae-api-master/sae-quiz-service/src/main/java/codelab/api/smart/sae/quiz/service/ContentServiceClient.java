package codelab.api.smart.sae.quiz.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class ContentServiceClient {

    private static final Logger log = LoggerFactory.getLogger(ContentServiceClient.class);

    @Value("${content.service.url:http://localhost:8082}")
    private String contentServiceUrl;

    private final RestTemplate rest = new RestTemplate();

    public String extractText(String contentId, int startPage, int endPage) {
        try {
            String url = contentServiceUrl + "/api/contents/" + contentId +
                    "/sections/text?startPage=" + startPage + "&endPage=" + endPage;
            ResponseEntity<Map<String, Object>> resp = rest.exchange(
                    url, org.springframework.http.HttpMethod.GET, null, 
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
            Map<String, Object> body = resp.getBody();
            if (body != null && body.containsKey("text")) {
                return (String) body.get("text");
            }
        } catch (Exception e) {
            log.error("Erro ao extrair texto do content service: {}", e.getMessage());
        }
        return "";
    }

    public ContentInfo getContentInfo(String contentId) {
        try {
            String url = contentServiceUrl + "/api/contents/" + contentId;
            ResponseEntity<Map<String, Object>> resp = rest.exchange(
                    url, org.springframework.http.HttpMethod.GET, null,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
            Map<String, Object> body = resp.getBody();
            if (body != null) {
                ContentInfo info = new ContentInfo();
                info.setTitle(String.valueOf(body.getOrDefault("title", "Livro")));
                Object disc = body.get("discipline");
                info.setDiscipline(disc != null ? String.valueOf(disc) : null);
                Object pages = body.get("totalPages");
                if (pages instanceof Number) info.setTotalPages(((Number) pages).intValue());
                return info;
            }
        } catch (Exception e) {
            log.error("Erro ao obter info do content service: {}", e.getMessage());
        }
        return new ContentInfo();
    }

    public static class ContentInfo {
        private String title = "Livro";
        private String discipline;
        private Integer totalPages;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDiscipline() { return discipline; }
        public void setDiscipline(String discipline) { this.discipline = discipline; }
        public Integer getTotalPages() { return totalPages; }
        public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }
    }
}
