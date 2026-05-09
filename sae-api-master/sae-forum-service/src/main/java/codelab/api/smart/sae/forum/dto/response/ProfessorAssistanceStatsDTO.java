package codelab.api.smart.sae.forum.dto.response;

import java.util.List;

public class ProfessorAssistanceStatsDTO {

    private String username;
    private Long totalAnswered;
    private Long totalAccepted;
    private Double acceptanceRate;
    private Double avgResponseTimeMinutes;
    private Double assistancePercentage;
    private List<String> disciplinas;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Long getTotalAnswered() { return totalAnswered; }
    public void setTotalAnswered(Long totalAnswered) { this.totalAnswered = totalAnswered; }

    public Long getTotalAccepted() { return totalAccepted; }
    public void setTotalAccepted(Long totalAccepted) { this.totalAccepted = totalAccepted; }

    public Double getAcceptanceRate() { return acceptanceRate; }
    public void setAcceptanceRate(Double acceptanceRate) { this.acceptanceRate = acceptanceRate; }

    public Double getAvgResponseTimeMinutes() { return avgResponseTimeMinutes; }
    public void setAvgResponseTimeMinutes(Double avgResponseTimeMinutes) { this.avgResponseTimeMinutes = avgResponseTimeMinutes; }

    public Double getAssistancePercentage() { return assistancePercentage; }
    public void setAssistancePercentage(Double assistancePercentage) { this.assistancePercentage = assistancePercentage; }

    public List<String> getDisciplinas() { return disciplinas; }
    public void setDisciplinas(List<String> disciplinas) { this.disciplinas = disciplinas; }
}
