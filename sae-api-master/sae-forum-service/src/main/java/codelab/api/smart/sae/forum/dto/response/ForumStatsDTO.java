package codelab.api.smart.sae.forum.dto.response;

import java.util.Map;

public class ForumStatsDTO {

    private Long totalQuestions;
    private Map<String, Long> totalByDisciplina;
    private Map<String, Long> totalByType;
    private Map<String, Long> totalByStatus;
    private Double avgResponseTimeMinutes;

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
}
