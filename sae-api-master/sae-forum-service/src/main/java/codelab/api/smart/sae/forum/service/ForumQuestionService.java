package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.request.CreateQuestionRequestDTO;
import codelab.api.smart.sae.forum.dto.response.CollaborativeAnswerResponseDTO;
import codelab.api.smart.sae.forum.dto.response.ExpertAnswerResponseDTO;
import codelab.api.smart.sae.forum.dto.response.QuestionResponseDTO;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.CollaborativeAnswerRepository;
import codelab.api.smart.sae.forum.repository.ExpertAnswerRepository;
import codelab.api.smart.sae.forum.repository.ForumQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ForumQuestionService {

    @Autowired private ForumQuestionRepository questionRepository;
    @Autowired private ExpertAnswerRepository expertAnswerRepository;
    @Autowired private CollaborativeAnswerRepository collaborativeAnswerRepository;
    @Autowired private NotificationService notificationService;

    @Transactional
    public QuestionResponseDTO create(CreateQuestionRequestDTO request, String authorUsername) {
        ForumQuestionEntity question = new ForumQuestionEntity();
        question.setTitulo(request.getTitulo().trim());
        question.setDescricao(request.getDescricao().trim());
        question.setQuestionType(request.getQuestionType());
        question.setStatus(QuestionStatus.ABERTA);
        question.setCreatedBy(authorUsername);
        question.setDisciplina(request.getDisciplina());

        question = questionRepository.save(question);

        if (QuestionType.ESPECIALIZADO.equals(request.getQuestionType())) {
            notificationService.notifyNewQuestion(question.getId(), question.getDisciplina().name(), question.getTitulo());
        }

        return QuestionResponseDTO.from(question);
    }

    public Page<QuestionResponseDTO> list(codelab.api.smart.sae.forum.enums.DisciplinaEnum disciplina, QuestionType questionType, QuestionStatus status, Pageable pageable) {
        return questionRepository.findWithFilters(disciplina, questionType, status, pageable)
            .map(QuestionResponseDTO::from);
    }

    public QuestionResponseDTO getById(Long id) {
        ForumQuestionEntity question = questionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta não encontrada"));

        QuestionResponseDTO dto = QuestionResponseDTO.from(question);

        if (QuestionType.ESPECIALIZADO.equals(question.getQuestionType())) {
            dto.setExpertAnswers(
                expertAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(id).stream()
                    .map(ExpertAnswerResponseDTO::from).toList()
            );
        } else {
            dto.setCollaborativeAnswers(
                collaborativeAnswerRepository.findByQuestionIdOrderByCreatedAtAsc(id).stream()
                    .map(CollaborativeAnswerResponseDTO::from).toList()
            );
        }

        return dto;
    }

    public ForumQuestionEntity getEntityById(Long id) {
        return questionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta não encontrada"));
    }

    @Transactional
    public void closeQuestion(Long id) {
        ForumQuestionEntity question = getEntityById(id);
        question.setStatus(QuestionStatus.FECHADA);
        questionRepository.save(question);
    }

    @Transactional
    public void closeQuestionByUser(Long id, String username) {
        ForumQuestionEntity question = getEntityById(id);
        
        if (!question.getCreatedBy().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas o autor pode fechar esta pergunta.");
        }
        
        question.setStatus(QuestionStatus.FECHADA);
        questionRepository.save(question);
    }
}
