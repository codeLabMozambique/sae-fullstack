package codelab.api.smart.sae.content.dto;

import codelab.api.smart.sae.content.model.jpa.ReadingSuggestion;
import java.time.LocalDateTime;

public class ReadingSuggestionDTO {
    public Long id;
    public String contentId;
    public String contentTitle;
    public String contentThumbnailUrl;
    public Long classroomId;
    public String professorUsername;
    public String professorName;
    public String note;
    public Integer startPage;
    public Integer endPage;
    public String chapterRange;
    public LocalDateTime createdAt;

    public static ReadingSuggestionDTO from(ReadingSuggestion s) {
        ReadingSuggestionDTO d = new ReadingSuggestionDTO();
        d.id = s.getId();
        d.contentId = s.getContentId();
        d.contentTitle = s.getContentTitle();
        d.classroomId = s.getClassroomId();
        d.professorUsername = s.getProfessorUsername();
        d.professorName = s.getProfessorName();
        d.note = s.getNote();
        d.startPage = s.getStartPage();
        d.endPage = s.getEndPage();
        d.chapterRange = s.getChapterRange();
        d.createdAt = s.getCreatedAt();
        return d;
    }
}
