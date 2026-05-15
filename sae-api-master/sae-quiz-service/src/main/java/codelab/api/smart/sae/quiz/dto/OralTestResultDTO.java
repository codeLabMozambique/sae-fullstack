package codelab.api.smart.sae.quiz.dto;

import java.util.List;

public class OralTestResultDTO {
    private int overallScore;
    private String level;
    private List<OralDimensionResultDTO> dimensions;
    private List<OralQuestionFeedbackDTO> questionFeedback;
    private String generalSuggestions;

    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public List<OralDimensionResultDTO> getDimensions() { return dimensions; }
    public void setDimensions(List<OralDimensionResultDTO> dimensions) { this.dimensions = dimensions; }
    public List<OralQuestionFeedbackDTO> getQuestionFeedback() { return questionFeedback; }
    public void setQuestionFeedback(List<OralQuestionFeedbackDTO> questionFeedback) { this.questionFeedback = questionFeedback; }
    public String getGeneralSuggestions() { return generalSuggestions; }
    public void setGeneralSuggestions(String generalSuggestions) { this.generalSuggestions = generalSuggestions; }
}
