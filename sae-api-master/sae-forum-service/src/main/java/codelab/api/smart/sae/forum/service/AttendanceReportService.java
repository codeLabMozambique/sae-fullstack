package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.response.AttendanceReportDTO;
import codelab.api.smart.sae.forum.model.ExpertAnswerEntity;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.CollaborativeAnswerRepository;
import codelab.api.smart.sae.forum.repository.ExpertAnswerRepository;
import codelab.api.smart.sae.forum.repository.ForumQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceReportService {

    @Autowired private ForumQuestionRepository questionRepository;
    @Autowired private ExpertAnswerRepository expertAnswerRepository;
    @Autowired private CollaborativeAnswerRepository collaborativeAnswerRepository;

    public AttendanceReportDTO generate(LocalDate from, LocalDate to, Long schoolId, String discipline) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.plusDays(1).atStartOfDay();

        List<ForumQuestionEntity> questions = questionRepository.findByDateRangeAndFilters(
                fromDt, toDt, schoolId, discipline);

        AttendanceReportDTO report = new AttendanceReportDTO();
        report.setFrom(from);
        report.setTo(to);
        report.setSchoolId(schoolId);
        report.setDiscipline(discipline);
        report.setTotalQuestions(questions.size());

        long byProfessor = 0, byAI = 0, byStudent = 0, unanswered = 0;
        long totalResponseMs = 0;
        int respondedCount = 0;

        for (ForumQuestionEntity q : questions) {
            boolean hasExpert = expertAnswerRepository.existsByQuestionId(q.getId());
            boolean hasAI     = expertAnswerRepository.existsByQuestionIdAndAiGeneratedTrue(q.getId());
            boolean hasCollab = collaborativeAnswerRepository.existsByQuestionId(q.getId());

            if (hasAI)          byAI++;
            else if (hasExpert) byProfessor++;
            else if (hasCollab) byStudent++;
            else                unanswered++;

            if (hasExpert || hasCollab) {
                List<ExpertAnswerEntity> ea = expertAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(q.getId());
                LocalDateTime firstAnswer = null;
                if (!ea.isEmpty()) firstAnswer = ea.get(0).getCreatedAt();
                if (firstAnswer != null && q.getCreatedAt() != null) {
                    totalResponseMs += Duration.between(q.getCreatedAt(), firstAnswer).toMinutes();
                    respondedCount++;
                }
            }
        }

        report.setAnsweredByProfessor(byProfessor);
        report.setAnsweredByAI(byAI);
        report.setAnsweredByStudent(byStudent);
        report.setUnanswered(unanswered);
        report.setAvgResponseTimeMinutes(respondedCount > 0 ? (double) totalResponseMs / respondedCount : null);

        return report;
    }
}
