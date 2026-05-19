package codelab.api.smart.sae.forum.dto.response;

public class HotTopicDTO {

    private String discipline;
    private Long questionCount;
    private String trend; // "UP", "STABLE", "DOWN"

    public HotTopicDTO() {}

    public HotTopicDTO(String discipline, Long questionCount, String trend) {
        this.discipline = discipline;
        this.questionCount = questionCount;
        this.trend = trend;
    }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public Long getQuestionCount() { return questionCount; }
    public void setQuestionCount(Long questionCount) { this.questionCount = questionCount; }

    public String getTrend() { return trend; }
    public void setTrend(String trend) { this.trend = trend; }
}
