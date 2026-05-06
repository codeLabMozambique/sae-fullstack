package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.request.CreateCollaborativeAnswerRequestDTO;
import codelab.api.smart.sae.forum.dto.response.CollaborativeAnswerResponseDTO;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.enums.ValidationStatus;
import codelab.api.smart.sae.forum.model.CollaborativeAnswerEntity;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.CollaborativeAnswerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import codelab.api.smart.sae.forum.service.AuthServiceClient;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CollaborativeAnswerServiceTest {

    @Mock private CollaborativeAnswerRepository answerRepository;
    @Mock private ForumQuestionService questionService;
    @Mock private NotificationService notificationService;
    @Mock private AuthServiceClient authServiceClient;

    @InjectMocks
    private CollaborativeAnswerService collaborativeAnswerService;

    private ForumQuestionEntity collaborativeQuestion;
    private CreateCollaborativeAnswerRequestDTO request;

    @BeforeEach
    void setUp() {
        collaborativeQuestion = new ForumQuestionEntity();
        collaborativeQuestion.setId(1L);
        collaborativeQuestion.setQuestionType(QuestionType.COLABORATIVO);
        collaborativeQuestion.setStatus(QuestionStatus.ABERTA);
        collaborativeQuestion.setCreatedBy("student1");
        collaborativeQuestion.setDisciplina(codelab.api.smart.sae.forum.enums.DisciplinaEnum.MATEMATICA);

        request = new CreateCollaborativeAnswerRequestDTO();
        request.setConteudo("Resposta colaborativa de teste");
    }

    @Test
    void create_validRequest_returnsWithPendingStatus() {
        when(questionService.getEntityById(1L)).thenReturn(collaborativeQuestion);

        CollaborativeAnswerEntity saved = buildAnswer(1L, ValidationStatus.PENDENTE);
        when(answerRepository.save(any())).thenReturn(saved);

        CollaborativeAnswerResponseDTO result = collaborativeAnswerService.create(1L, request, "student2");

        assertThat(result.getValidationStatus()).isEqualTo(ValidationStatus.PENDENTE);
        assertThat(result.getAnsweredBy()).isEqualTo("student2");
        verify(notificationService).notifyNewAnswer(1L, "COLLABORATIVE");
    }

    @Test
    void create_selfAnswer_throwsBadRequest() {
        when(questionService.getEntityById(1L)).thenReturn(collaborativeQuestion);

        assertThatThrownBy(() -> collaborativeAnswerService.create(1L, request, "student1"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("própria pergunta");
    }

    @Test
    void create_closedQuestion_throwsBadRequest() {
        collaborativeQuestion.setStatus(QuestionStatus.FECHADA);
        when(questionService.getEntityById(1L)).thenReturn(collaborativeQuestion);

        assertThatThrownBy(() -> collaborativeAnswerService.create(1L, request, "student2"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("fechada");
    }

    @Test
    void create_specializedQuestion_throwsBadRequest() {
        collaborativeQuestion.setQuestionType(QuestionType.ESPECIALIZADO);
        when(questionService.getEntityById(1L)).thenReturn(collaborativeQuestion);

        assertThatThrownBy(() -> collaborativeAnswerService.create(1L, request, "student2"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Especializado");
    }

    @Test
    void validate_pendingAnswer_setsValidatedFields() {
        CollaborativeAnswerEntity answer = buildAnswer(1L, ValidationStatus.PENDENTE);
        when(answerRepository.findById(1L)).thenReturn(Optional.of(answer));
        when(questionService.getEntityById(1L)).thenReturn(collaborativeQuestion);
        when(authServiceClient.canProfessorAnswerArea("prof1", codelab.api.smart.sae.forum.enums.DisciplinaEnum.MATEMATICA)).thenReturn(true);
        when(answerRepository.save(any())).thenReturn(answer);

        CollaborativeAnswerResponseDTO result = collaborativeAnswerService.validate(1L, "prof1");

        assertThat(result.getValidationStatus()).isEqualTo(ValidationStatus.VALIDADA);
        assertThat(result.getValidatedBy()).isEqualTo("prof1");
        assertThat(result.getValidatedAt()).isNotNull();
        verify(notificationService).notifyAnswerValidated(any(), eq(1L));
    }

    @Test
    void validate_alreadyValidated_isIdempotent() {
        CollaborativeAnswerEntity answer = buildAnswer(1L, ValidationStatus.VALIDADA);
        answer.setValidatedBy("prof1");
        when(answerRepository.findById(1L)).thenReturn(Optional.of(answer));
        when(questionService.getEntityById(1L)).thenReturn(collaborativeQuestion);
        when(authServiceClient.canProfessorAnswerArea("prof1", codelab.api.smart.sae.forum.enums.DisciplinaEnum.MATEMATICA)).thenReturn(true);

        CollaborativeAnswerResponseDTO result = collaborativeAnswerService.validate(1L, "prof1");

        assertThat(result.getValidationStatus()).isEqualTo(ValidationStatus.VALIDADA);
        verify(answerRepository, never()).save(any());
        verify(notificationService, never()).notifyAnswerValidated(any(), any());
    }

    @Test
    void reject_pendingAnswer_setsRejectedFields() {
        CollaborativeAnswerEntity answer = buildAnswer(1L, ValidationStatus.PENDENTE);
        when(answerRepository.findById(1L)).thenReturn(Optional.of(answer));
        when(questionService.getEntityById(1L)).thenReturn(collaborativeQuestion);
        when(authServiceClient.canProfessorAnswerArea("prof1", codelab.api.smart.sae.forum.enums.DisciplinaEnum.MATEMATICA)).thenReturn(true);
        when(answerRepository.save(any())).thenReturn(answer);

        CollaborativeAnswerResponseDTO result = collaborativeAnswerService.reject(1L, "prof1");

        assertThat(result.getRejectedBy()).isEqualTo("prof1");
        assertThat(result.getRejectedAt()).isNotNull();
    }

    @Test
    void reject_sameProf_isIdempotent() {
        CollaborativeAnswerEntity answer = buildAnswer(1L, ValidationStatus.PENDENTE);
        answer.setRejectedBy("prof1");
        when(answerRepository.findById(1L)).thenReturn(Optional.of(answer));
        when(questionService.getEntityById(1L)).thenReturn(collaborativeQuestion);
        when(authServiceClient.canProfessorAnswerArea("prof1", codelab.api.smart.sae.forum.enums.DisciplinaEnum.MATEMATICA)).thenReturn(true);

        collaborativeAnswerService.reject(1L, "prof1");

        verify(answerRepository, never()).save(any());
    }

    private CollaborativeAnswerEntity buildAnswer(Long id, ValidationStatus status) {
        CollaborativeAnswerEntity a = new CollaborativeAnswerEntity();
        a.setId(id);
        a.setConteudo("Resposta teste");
        a.setQuestionId(1L);
        a.setAnsweredBy("student2");
        a.setValidationStatus(status);
        return a;
    }
}
