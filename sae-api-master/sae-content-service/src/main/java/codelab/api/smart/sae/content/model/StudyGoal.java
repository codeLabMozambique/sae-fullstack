package codelab.api.smart.sae.content.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;

@Document(collection = "study_goals")
public class StudyGoal {

    @Id
    private String id;

    @Field("user_id")
    private String userId;

    @Field("title")
    private String title;

    @Field("target_pages")
    private int targetPages;

    @Field("current_pages")
    private int currentPages;

    @Field("deadline")
    private LocalDate deadline;

    @Field("active")
    private boolean active;

    public StudyGoal() {
        this.active = true;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getTargetPages() { return targetPages; }
    public void setTargetPages(int targetPages) { this.targetPages = targetPages; }

    public int getCurrentPages() { return currentPages; }
    public void setCurrentPages(int currentPages) { this.currentPages = currentPages; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
