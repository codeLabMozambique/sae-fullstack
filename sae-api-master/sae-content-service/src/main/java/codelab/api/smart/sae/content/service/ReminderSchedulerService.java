package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.StudyGoal;
import codelab.api.smart.sae.content.repository.StudyGoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ReminderSchedulerService {

    @Autowired
    private StudyGoalRepository studyGoalRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /** Corre todos os dias às 8h. Para cada meta activa com lembrete, decide se é hora de enviar. */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyReminders() {
        LocalDate today = LocalDate.now();
        List<StudyGoal> goals = studyGoalRepository.findAll();

        for (StudyGoal goal : goals) {
            if (!goal.isReminderEnabled()) continue;
            if (!"ACTIVE".equals(goal.getStatus()) && goal.isActive() == false) continue;
            if (goal.getReminderEmail() == null || goal.getReminderEmail().isBlank()) continue;

            boolean isTime = "TIME".equals(goal.getGoalUnit());
            int remaining = isTime
                ? goal.getTargetMinutes() - goal.getCurrentMinutes()
                : goal.getTargetPages() - goal.getCurrentPages();
            if (remaining <= 0) continue;

            if (!shouldSendToday(goal, today)) continue;

            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromEmail);
                msg.setTo(goal.getReminderEmail());
                msg.setSubject("Lembrete SAE — " + goal.getTitle());
                msg.setText(buildBody(goal, remaining));
                mailSender.send(msg);
                goal.setLastReminderSentAt(today);
                studyGoalRepository.save(goal);
            } catch (Exception ignored) {
            }
        }
    }

    private boolean shouldSendToday(StudyGoal goal, LocalDate today) {
        String freq = goal.getReminderFrequency();
        if (freq == null) freq = "BEFORE_DEADLINE";

        LocalDate lastSent = goal.getLastReminderSentAt();

        switch (freq) {
            case "DAILY":
                return lastSent == null || !lastSent.equals(today);

            case "EVERY_2_DAYS":
                return lastSent == null || ChronoUnit.DAYS.between(lastSent, today) >= 2;

            case "WEEKLY":
                return lastSent == null || ChronoUnit.DAYS.between(lastSent, today) >= 7;

            case "BEFORE_DEADLINE":
            default:
                if (goal.getDeadline() == null) return false;
                int daysBefore = Math.max(1, goal.getReminderDaysBefore());
                return today.equals(goal.getDeadline().minusDays(daysBefore));
        }
    }

    private String buildBody(StudyGoal goal, int remaining) {
        boolean isTime = "TIME".equals(goal.getGoalUnit());
        int target  = isTime ? goal.getTargetMinutes()  : goal.getTargetPages();
        int current = isTime ? goal.getCurrentMinutes() : goal.getCurrentPages();
        int pct = target > 0 ? (int) ((current * 100.0) / target) : 0;

        StringBuilder sb = new StringBuilder();
        sb.append("Olá!\n\nEste é um lembrete de leitura da plataforma SAE.\n\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("  Meta: ").append(goal.getTitle()).append("\n");

        if (goal.getContentTitle() != null)
            sb.append("  Livro: ").append(goal.getContentTitle()).append("\n");
        if (goal.getDiscipline() != null)
            sb.append("  Disciplina: ").append(goal.getDiscipline()).append("\n");

        if (isTime) {
            sb.append("\n  Progresso: ").append(fmtMinutes(current))
              .append(" / ").append(fmtMinutes(target))
              .append(" (").append(pct).append("%)\n");
            sb.append("  Faltam: ").append(fmtMinutes(remaining)).append("\n");
            if (goal.getDailyMinutesTarget() > 0)
                sb.append("  Meta diária: ").append(fmtMinutes(goal.getDailyMinutesTarget())).append(" de leitura.\n");
        } else {
            sb.append("\n  Progresso: ").append(current)
              .append(" / ").append(target)
              .append(" páginas (").append(pct).append("%)\n");
            sb.append("  Faltam: ").append(remaining).append(" páginas\n");
            if (goal.getDailyPagesTarget() > 0)
                sb.append("  Para cumprir o prazo, lê ").append(goal.getDailyPagesTarget()).append(" páginas por dia.\n");
        }

        if (goal.getDeadline() != null) {
            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), goal.getDeadline());
            sb.append("  Prazo: ").append(goal.getDeadline())
              .append(" (").append(daysLeft).append(" dias)\n");
        }

        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
        sb.append("Acede à plataforma SAE para continuar.\n\nBons estudos!");
        return sb.toString();
    }

    private String fmtMinutes(int minutes) {
        int h = minutes / 60;
        int m = minutes % 60;
        if (h > 0 && m > 0) return h + "h" + m + "m";
        if (h > 0) return h + "h";
        return m + "m";
    }
}
