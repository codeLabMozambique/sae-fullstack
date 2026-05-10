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
            ResponseEntity<Map> resp = rest.getForEntity(url, Map.class);
            if (resp.getBody() != null && resp.getBody().containsKey("text")) {
                return (String) resp.getBody().get("text");
            }
        } catch (Exception e) {
            log.error("Erro ao extrair texto do content service: {}", e.getMessage());
        }
        return "";
    }

    public ContentInfo getContentInfo(String contentId) {
        try {
            String url = contentServiceUrl + "/api/contents/" + contentId;
            ResponseEntity<Map> resp = rest.getForEntity(url, Map.class);
            if (resp.getBody() != null) {
                ContentInfo info = new ContentInfo();
                info.setTitle(String.valueOf(resp.getBody().getOrDefault("title", "Livro")));
                Object disc = resp.getBody().get("discipline");
                info.setDiscipline(disc != null ? String.valueOf(disc) : null);
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

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDiscipline() { return discipline; }
        public void setDiscipline(String discipline) { this.discipline = discipline; }
    }
}
