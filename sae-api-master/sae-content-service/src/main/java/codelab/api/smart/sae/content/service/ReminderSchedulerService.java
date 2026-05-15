package codelab.api.smart.sae.content.service;

import codelab.api.smart.sae.content.model.StudyGoal;
import codelab.api.smart.sae.content.repository.StudyGoalRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ReminderSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ReminderSchedulerService.class);

    @Autowired
    private StudyGoalRepository studyGoalRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /** Corre todos os dias às 8h. Para cada meta activa com lembrete, decide se é hora de enviar. */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyReminders() {
        runReminderSweep();
    }

    /**
     * Também corre 5 minutos depois do arranque da app, para apanhar metas
     * cujo lembrete diário não foi enviado (ex: serviço estava em baixo às 8h).
     */
    @Scheduled(initialDelay = 5 * 60 * 1000L, fixedDelay = Long.MAX_VALUE)
    public void runOnStartup() {
        log.info("[Reminders] Sweep de arranque");
        runReminderSweep();
    }

    /** Permite disparar manualmente (endpoint de teste). Devolve o n.º de emails enviados. */
    public int runReminderSweep() {
        LocalDate today = LocalDate.now();
        List<StudyGoal> goals = studyGoalRepository.findAll();
        int sent = 0;

        for (StudyGoal goal : goals) {
            if (!goal.isReminderEnabled()) continue;
            if (!"ACTIVE".equals(goal.getStatus())) continue;
            if (goal.getReminderEmail() == null || goal.getReminderEmail().isBlank()) continue;

            boolean isTime = "TIME".equals(goal.getGoalUnit());
            int remaining = isTime
                ? goal.getTargetMinutes() - goal.getCurrentMinutes()
                : goal.getTargetPages() - goal.getCurrentPages();
            if (remaining <= 0) continue;

            boolean overdue = goal.getDeadline() != null && today.isAfter(goal.getDeadline());
            if (!overdue && !shouldSendToday(goal, today)) continue;

            try {
                MimeMessage mime = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mime, false, StandardCharsets.UTF_8.name());
                helper.setFrom(fromEmail);
                helper.setTo(goal.getReminderEmail());
                String subjectPrefix = overdue ? "[Atrasada] " : "";
                helper.setSubject(subjectPrefix + "Lembrete SAE — " + goal.getTitle());
                helper.setText(buildBody(goal, remaining, overdue), true); // HTML
                mailSender.send(mime);
                goal.setLastReminderSentAt(today);
                studyGoalRepository.save(goal);
                sent++;
                log.info("[Reminders] Email enviado para {} (meta '{}', overdue={})",
                        goal.getReminderEmail(), goal.getTitle(), overdue);
            } catch (Exception e) {
                log.error("[Reminders] Falha ao enviar email para {} (meta '{}'): {}",
                        goal.getReminderEmail(), goal.getTitle(), e.getMessage(), e);
            }
        }
        log.info("[Reminders] Sweep terminado — {} email(s) enviado(s) de {} meta(s)", sent, goals.size());
        return sent;
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
                // Envia desde X dias antes até ao próprio prazo. Atrasos são tratados em runReminderSweep.
                LocalDate windowStart = goal.getDeadline().minusDays(daysBefore);
                return !today.isBefore(windowStart) && !today.isAfter(goal.getDeadline())
                        && (lastSent == null || !lastSent.equals(today));
        }
    }

    private String buildBody(StudyGoal goal, int remaining, boolean overdue) {
        boolean isTime = "TIME".equals(goal.getGoalUnit());
        int target  = isTime ? goal.getTargetMinutes()  : goal.getTargetPages();
        int current = isTime ? goal.getCurrentMinutes() : goal.getCurrentPages();
        int pct = target > 0 ? Math.min(100, (int) ((current * 100.0) / target)) : 0;

        String accent = overdue ? "#DC2626" : "#00A651";
        String bannerBg = overdue
                ? "linear-gradient(135deg, #991B1B 0%, #DC2626 100%)"
                : "linear-gradient(135deg, #0A1628 0%, #00A651 100%)";
        String badge = overdue ? "META EM ATRASO" : "LEMBRETE DE LEITURA";
        String headline = overdue
                ? "A tua meta está atrasada"
                : "Hora de continuar a leitura";
        String subhead = overdue
                ? "Ainda dá para recuperar — abre a plataforma e lê algumas páginas hoje."
                : "Pequenas leituras diárias fazem grandes diferenças. Vamos lá?";

        String progressLabel = isTime
                ? fmtMinutes(current) + " / " + fmtMinutes(target)
                : current + " / " + target + " páginas";
        String remainingLabel = isTime
                ? "Faltam <strong>" + fmtMinutes(remaining) + "</strong>"
                : "Faltam <strong>" + remaining + " páginas</strong>";

        String dailyLine = "";
        if (isTime && goal.getDailyMinutesTarget() > 0) {
            dailyLine = "Meta diária: <strong>" + fmtMinutes(goal.getDailyMinutesTarget()) + "</strong>";
        } else if (!isTime && goal.getDailyPagesTarget() > 0) {
            dailyLine = "Para cumprir o prazo, lê <strong>" + goal.getDailyPagesTarget() + " páginas/dia</strong>";
        }

        String deadlineLine = "";
        if (goal.getDeadline() != null) {
            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), goal.getDeadline());
            String suffix;
            if (daysLeft > 0) suffix = "(faltam " + daysLeft + " dias)";
            else if (daysLeft == 0) suffix = "(é hoje!)";
            else suffix = "<span style=\"color:#DC2626;font-weight:700\">(" + Math.abs(daysLeft) + " dias em atraso)</span>";
            deadlineLine = "Prazo: <strong>" + goal.getDeadline() + "</strong> " + suffix;
        }

        StringBuilder metaRows = new StringBuilder();
        if (goal.getContentTitle() != null) {
            metaRows.append(metaRow("Livro", esc(goal.getContentTitle())));
        }
        if (goal.getDiscipline() != null) {
            metaRows.append(metaRow("Disciplina", esc(goal.getDiscipline())));
        }
        if (!deadlineLine.isEmpty()) {
            metaRows.append(metaRow("Prazo", deadlineLine));
        }
        if (!dailyLine.isEmpty()) {
            metaRows.append(metaRow("Ritmo", dailyLine));
        }

        return ""
            + "<!DOCTYPE html><html lang=\"pt\"><head><meta charset=\"UTF-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<title>SAE — Lembrete</title></head>"
            + "<body style=\"margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;\">"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#F3F4F6;padding:32px 16px;\">"
            + "<tr><td align=\"center\">"
            + "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,22,40,0.08);\">"

            // Banner
            + "<tr><td style=\"background:" + bannerBg + ";padding:32px 32px 28px 32px;color:#fff;\">"
            + "<div style=\"font-size:11px;letter-spacing:2px;font-weight:700;opacity:0.85;\">SAE — SMART STUDENT</div>"
            + "<div style=\"display:inline-block;margin-top:10px;padding:4px 10px;background:rgba(255,255,255,0.18);border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1px;\">"
            + badge + "</div>"
            + "<h1 style=\"margin:14px 0 4px 0;font-size:24px;font-weight:800;line-height:1.2;\">" + headline + "</h1>"
            + "<p style=\"margin:0;font-size:14px;opacity:0.9;line-height:1.5;\">" + subhead + "</p>"
            + "</td></tr>"

            // Goal title
            + "<tr><td style=\"padding:28px 32px 8px 32px;\">"
            + "<div style=\"font-size:11px;letter-spacing:1.5px;font-weight:700;color:#6B7280;\">META</div>"
            + "<div style=\"font-size:20px;font-weight:700;color:#0A1628;margin-top:4px;\">" + esc(goal.getTitle()) + "</div>"
            + "</td></tr>"

            // Progress bar
            + "<tr><td style=\"padding:8px 32px 4px 32px;\">"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
            + "<tr><td style=\"font-size:12px;font-weight:700;color:#6B7280;\">PROGRESSO</td>"
            + "<td align=\"right\" style=\"font-size:12px;font-weight:700;color:" + accent + ";\">" + pct + "%</td></tr>"
            + "</table>"
            + "<div style=\"height:10px;background:#E5E7EB;border-radius:999px;overflow:hidden;margin-top:6px;\">"
            + "<div style=\"width:" + pct + "%;height:100%;background:" + accent + ";border-radius:999px;\"></div>"
            + "</div>"
            + "<div style=\"display:flex;justify-content:space-between;margin-top:8px;font-size:13px;color:#374151;\">"
            + "<span>" + progressLabel + "</span>"
            + "<span>" + remainingLabel + "</span>"
            + "</div>"
            + "</td></tr>"

            // Metadata rows
            + "<tr><td style=\"padding:16px 32px 4px 32px;\">"
            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border:1px solid #F1F5F9;border-radius:12px;overflow:hidden;\">"
            + metaRows.toString()
            + "</table></td></tr>"

            // CTA
            + "<tr><td align=\"center\" style=\"padding:24px 32px 8px 32px;\">"
            + "<a href=\"https://sae.local/student/library/progress\" "
            + "style=\"display:inline-block;background:" + accent + ";color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;\">"
            + (overdue ? "Recuperar agora" : "Continuar a ler") + " &rarr;</a>"
            + "</td></tr>"

            // Pep-talk
            + "<tr><td style=\"padding:16px 32px 28px 32px;font-size:13px;color:#6B7280;line-height:1.6;text-align:center;\">"
            + (overdue
                ? "Sabias que ler 15 minutos por dia já te leva a terminar um livro por mês?<br>Não desistas — começa por uma página."
                : "Cada página é um passo. A consistência é mais importante que a velocidade.")
            + "</td></tr>"

            // Footer
            + "<tr><td style=\"background:#F9FAFB;padding:18px 32px;border-top:1px solid #F1F5F9;text-align:center;font-size:11px;color:#9CA3AF;\">"
            + "Recebeste este email porque tens um lembrete activo na <strong>plataforma SAE</strong>.<br>"
            + "Podes desactivar os lembretes nas definições da tua meta."
            + "</td></tr>"

            + "</table></td></tr></table></body></html>";
    }

    private static String metaRow(String label, String html) {
        return "<tr>"
            + "<td style=\"padding:12px 16px;background:#F9FAFB;font-size:11px;font-weight:700;color:#6B7280;letter-spacing:1px;width:35%;border-bottom:1px solid #F1F5F9;\">"
            + label.toUpperCase() + "</td>"
            + "<td style=\"padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #F1F5F9;\">"
            + html + "</td>"
            + "</tr>";
    }

    /** Escape HTML simples — evita XSS nos campos vindos do utilizador. */
    private static String esc(String raw) {
        if (raw == null) return "";
        return raw
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }

    private String fmtMinutes(int minutes) {
        int h = minutes / 60;
        int m = minutes % 60;
        if (h > 0 && m > 0) return h + "h" + m + "m";
        if (h > 0) return h + "h";
        return m + "m";
    }
}
