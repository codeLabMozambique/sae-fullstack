package codelab.api.smart.sae.forum.dto.response;

import java.util.List;
import java.util.Map;

public class ForumStatsDTO {

    private Long totalQuestions;
    private Map<String, Long> totalByDisciplina;
    private Map<String, Long> totalByType;
    private Map<String, Long> totalByStatus;
    private Double avgResponseTimeMinutes;

    // Stats por escola
    private Map<String, Long> totalBySchool;

    // Breakdown por tipo de interação (PROFESSOR / AI / STUDENT)
    private Map<String, Long> totalByInteractionType;

    // Disciplinas com maior volume de solicitações
    private List<HotTopicDTO> hotTopics;

    public Long getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Long totalQuestions) { this.totalQuestions = totalQuestions; }

    public Map<String, Long> getTotalByDisciplina() { return totalByDisciplina; }
    public void setTotalByDisciplina(Map<String, Long> totalByDisciplina) { this.totalByDisciplina = totalByDisciplina; }

    public Map<String, Long> getTotalByType() { return totalByType; }
    public void setTotalByType(Map<String, Long> totalByType) { this.totalByType = totalByType; }

    public Map<String, Long> getTotalByStatus() { return totalByStatus; }
    public void setTotalByStatus(Map<String, Long> totalByStatus) { this.totalByStatus = totalByStatus; }

    public Double getAvgResponseTimeMinutes() { return avgResponseTimeMinutes; }
    public void setAvgResponseTimeMinutes(Double avgResponseTimeMinutes) { this.avgResponseTimeMinutes = avgResponseTimeMinutes; }

    public Map<String, Long> getTotalBySchool() { return totalBySchool; }
    public void setTotalBySchool(Map<String, Long> totalBySchool) { this.totalBySchool = totalBySchool; }

    public Map<String, Long> getTotalByInteractionType() { return totalByInteractionType; }
    public void setTotalByInteractionType(Map<String, Long> totalByInteractionType) { this.totalByInteractionType = totalByInteractionType; }

    public List<HotTopicDTO> getHotTopics() { return hotTopics; }
    public void setHotTopics(List<HotTopicDTO> hotTopics) { this.hotTopics = hotTopics; }
}
