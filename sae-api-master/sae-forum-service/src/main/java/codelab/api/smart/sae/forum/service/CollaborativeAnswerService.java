package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.request.CreateCollaborativeAnswerRequestDTO;
import codelab.api.smart.sae.forum.dto.response.CollaborativeAnswerResponseDTO;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.enums.ValidationStatus;
import codelab.api.smart.sae.forum.model.CollaborativeAnswerEntity;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.CollaborativeAnswerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class CollaborativeAnswerService {

    @Autowired private CollaborativeAnswerRepository answerRepository;
    @Autowired private ForumQuestionService questionService;
    @Autowired private NotificationService notificationService;
    @Autowired private AuthServiceClient authServiceClient;

    @Transactional
    public CollaborativeAnswerResponseDTO create(Long questionId,
            CreateCollaborativeAnswerRequestDTO request, String studentUsername) {

        ForumQuestionEntity question = questionService.getEntityById(questionId);

        if (!QuestionType.COLABORATIVO.equals(question.getQuestionType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Esta pergunta pertence ao Fórum Especializado");
        }
        if (QuestionStatus.FECHADA.equals(question.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pergunta já está fechada");
        }
        if (question.getCreatedBy().equals(studentUsername)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Não é possível responder à sua própria pergunta");
        }

        CollaborativeAnswerEntity answer = new CollaborativeAnswerEntity();
        answer.setConteudo(request.getConteudo().trim());
        answer.setQuestionId(questionId);
        answer.setAnsweredBy(studentUsername);
        answer.setValidationStatus(ValidationStatus.PENDENTE);
        answer = answerRepository.save(answer);

        notificationService.notifyNewAnswer(questionId, "COLLABORATIVE");

        return CollaborativeAnswerResponseDTO.from(answer);
    }

    public Page<CollaborativeAnswerResponseDTO> listPending(Pageable pageable) {
        return answerRepository
            .findByValidationStatusAndRejectedByIsNull(ValidationStatus.PENDENTE, pageable)
            .map(CollaborativeAnswerResponseDTO::from);
    }

    @Transactional
    public CollaborativeAnswerResponseDTO validate(Long answerId, String professorUsername) {
        CollaborativeAnswerEntity answer = findById(answerId);
        ForumQuestionEntity question = questionService.getEntityById(answer.getQuestionId());

        boolean canValidate = authServiceClient.canProfessorAnswerArea(professorUsername, question.getArea());
        if (!canValidate) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "A sua especialização não permite validar respostas na área: " + question.getArea());
        }

        // Idempotent: already validated
        if (ValidationStatus.VALIDADA.equals(answer.getValidationStatus())) {
            return CollaborativeAnswerResponseDTO.from(answer);
        }

        answer.setValidationStatus(ValidationStatus.VALIDADA);
        answer.setValidatedBy(professorUsername);
        answer.setValidatedAt(LocalDateTime.now());
        answerRepository.save(answer);

        notificationService.notifyAnswerValidated(answer.getQuestionId(), answerId);

        return CollaborativeAnswerResponseDTO.from(answer);
    }

    @Transactional
    public CollaborativeAnswerResponseDTO reject(Long answerId, String professorUsername) {
        CollaborativeAnswerEntity answer = findById(answerId);
        ForumQuestionEntity question = questionService.getEntityById(answer.getQuestionId());

        boolean canReject = authServiceClient.canProfessorAnswerArea(professorUsername, question.getArea());
        if (!canReject) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "A sua especialização não permite rejeitar respostas na área: " + question.getArea());
        }

        // Idempotent: already rejected by this professor
        if (professorUsername.equals(answer.getRejectedBy())) {
            return CollaborativeAnswerResponseDTO.from(answer);
        }

        answer.setRejectedBy(professorUsername);
        answer.setRejectedAt(LocalDateTime.now());
        answerRepository.save(answer);

        return CollaborativeAnswerResponseDTO.from(answer);
    }

    private CollaborativeAnswerEntity findById(Long answerId) {
        return answerRepository.findById(answerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resposta não encontrada"));
    }
}
