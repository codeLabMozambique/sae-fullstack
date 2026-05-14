package codelab.api.smart.sae.quiz.dto;

import java.util.List;

public class OralDimensionResultDTO {
    private String name;
    private int score;
    private String feedback;
    private List<String> suggestions;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }
}
