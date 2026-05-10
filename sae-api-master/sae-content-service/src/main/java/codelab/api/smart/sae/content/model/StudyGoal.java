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

    // BOOK, PAGES, DISCIPLINE, CATEGORY
    @Field("goal_type")
    private String goalType;

    @Field("content_id")
    private String contentId;

    @Field("content_title")
    private String contentTitle;

    @Field("content_thumbnail")
    private String contentThumbnail;

    @Field("discipline")
    private String discipline;

    @Field("category")
    private String category;

    @Field("title")
    private String title;

    @Field("target_pages")
    private int targetPages;

    @Field("current_pages")
    private int currentPages;

    @Field("daily_pages_target")
    private int dailyPagesTarget;

    // PAGES or TIME
    @Field("goal_unit")
    private String goalUnit;

    @Field("target_minutes")
    private int targetMinutes;

    @Field("current_minutes")
    private int currentMinutes;

    @Field("daily_minutes_target")
    private int dailyMinutesTarget;

    @Field("deadline")
    private LocalDate deadline;

    @Field("started_at")
    private LocalDate startedAt;

    // ACTIVE, PAUSED, COMPLETED
    @Field("status")
    private String status;

    @Field("active")
    private boolean active;

    @Field("reminder_email")
    private String reminderEmail;

    @Field("reminder_enabled")
    private boolean reminderEnabled;

    // DAILY, EVERY_2_DAYS, WEEKLY, BEFORE_DEADLINE
    @Field("reminder_frequency")
    private String reminderFrequency;

    @Field("reminder_days_before")
    private int reminderDaysBefore;

    @Field("reminder_time")
    private String reminderTime;

    @Field("last_reminder_sent_at")
    private LocalDate lastReminderSentAt;

    public StudyGoal() {
        this.active = true;
        this.status = "ACTIVE";
        this.reminderEnabled = false;
        this.reminderDaysBefore = 1;
        this.reminderFrequency = "DAILY";
        this.reminderTime = "08:00";
        this.goalType = "PAGES";
        this.goalUnit = "PAGES";
        this.startedAt = LocalDate.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getGoalType() { return goalType; }
    public void setGoalType(String goalType) { this.goalType = goalType; }

    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }

    public String getContentTitle() { return contentTitle; }
    public void setContentTitle(String contentTitle) { this.contentTitle = contentTitle; }

    public String getContentThumbnail() { return contentThumbnail; }
    public void setContentThumbnail(String contentThumbnail) { this.contentThumbnail = contentThumbnail; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getTargetPages() { return targetPages; }
    public void setTargetPages(int targetPages) { this.targetPages = targetPages; }

    public int getCurrentPages() { return currentPages; }
    public void setCurrentPages(int currentPages) { this.currentPages = currentPages; }

    public int getDailyPagesTarget() { return dailyPagesTarget; }
    public void setDailyPagesTarget(int dailyPagesTarget) { this.dailyPagesTarget = dailyPagesTarget; }

    public String getGoalUnit() { return goalUnit; }
    public void setGoalUnit(String goalUnit) { this.goalUnit = goalUnit; }

    public int getTargetMinutes() { return targetMinutes; }
    public void setTargetMinutes(int targetMinutes) { this.targetMinutes = targetMinutes; }

    public int getCurrentMinutes() { return currentMinutes; }
    public void setCurrentMinutes(int currentMinutes) { this.currentMinutes = currentMinutes; }

    public int getDailyMinutesTarget() { return dailyMinutesTarget; }
    public void setDailyMinutesTarget(int dailyMinutesTarget) { this.dailyMinutesTarget = dailyMinutesTarget; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public LocalDate getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDate startedAt) { this.startedAt = startedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) {
        this.status = status;
        this.active = "ACTIVE".equals(status);
    }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getReminderEmail() { return reminderEmail; }
    public void setReminderEmail(String reminderEmail) { this.reminderEmail = reminderEmail; }

    public boolean isReminderEnabled() { return reminderEnabled; }
    public void setReminderEnabled(boolean reminderEnabled) { this.reminderEnabled = reminderEnabled; }

    public String getReminderFrequency() { return reminderFrequency; }
    public void setReminderFrequency(String reminderFrequency) { this.reminderFrequency = reminderFrequency; }

    public int getReminderDaysBefore() { return reminderDaysBefore; }
    public void setReminderDaysBefore(int reminderDaysBefore) { this.reminderDaysBefore = reminderDaysBefore; }

    public String getReminderTime() { return reminderTime; }
    public void setReminderTime(String reminderTime) { this.reminderTime = reminderTime; }

    public LocalDate getLastReminderSentAt() { return lastReminderSentAt; }
    public void setLastReminderSentAt(LocalDate lastReminderSentAt) { this.lastReminderSentAt = lastReminderSentAt; }
}
