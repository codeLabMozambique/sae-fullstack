package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.request.CreateExpertAnswerRequestDTO;
import codelab.api.smart.sae.forum.dto.response.ExpertAnswerResponseDTO;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.model.ExpertAnswerEntity;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.ExpertAnswerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExpertAnswerService {

    @Autowired private ExpertAnswerRepository answerRepository;
    @Autowired private ForumQuestionService questionService;
    @Autowired private AuthServiceClient authServiceClient;
    @Autowired private NotificationService notificationService;

    @Transactional
    public ExpertAnswerResponseDTO create(Long questionId, CreateExpertAnswerRequestDTO request, String professorUsername) {
        ForumQuestionEntity question = questionService.getEntityById(questionId);

        if (!QuestionType.ESPECIALIZADO.equals(question.getQuestionType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Esta pergunta pertence ao Fórum Colaborativo e não aceita respostas de especialista");
        }
        if (QuestionStatus.FECHADA.equals(question.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pergunta já está fechada");
        }

        boolean canAnswer = authServiceClient.canProfessorAnswerArea(professorUsername, question.getArea());
        if (!canAnswer) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "A sua especialização não corresponde à área desta pergunta: " + question.getArea());
        }

        ExpertAnswerEntity answer = new ExpertAnswerEntity();
        answer.setConteudo(request.getConteudo().trim());
        answer.setQuestionId(questionId);
        answer.setAnsweredBy(professorUsername);
        answer.setAccepted(false);
        answer = answerRepository.save(answer);

        notificationService.notifyNewAnswer(questionId, "EXPERT");

        return ExpertAnswerResponseDTO.from(answer);
    }

    @Transactional
    public ExpertAnswerResponseDTO acceptAnswer(Long answerId, String studentUsername) {
        ExpertAnswerEntity answer = answerRepository.findById(answerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resposta não encontrada"));

        ForumQuestionEntity question = questionService.getEntityById(answer.getQuestionId());

        if (!question.getCreatedBy().equals(studentUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Apenas o autor da pergunta pode aceitar respostas");
        }

        // Idempotent: if already accepted, return current state
        if (Boolean.TRUE.equals(answer.getAccepted())) {
            return ExpertAnswerResponseDTO.from(answer);
        }

        answer.setAccepted(true);
        answerRepository.save(answer);
        questionService.closeQuestion(question.getId());
        notificationService.notifyAnswerAccepted(question.getId(), answerId);

        return ExpertAnswerResponseDTO.from(answer);
    }
}
