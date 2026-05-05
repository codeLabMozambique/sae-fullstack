package codelab.api.smart.sae.forum.service;

import codelab.api.smart.sae.forum.dto.request.CreateExpertAnswerRequestDTO;
import codelab.api.smart.sae.forum.dto.response.ExpertAnswerResponseDTO;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.model.ExpertAnswerEntity;
import codelab.api.smart.sae.forum.model.ForumQuestionEntity;
import codelab.api.smart.sae.forum.repository.ExpertAnswerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpertAnswerServiceTest {

    @Mock private ExpertAnswerRepository answerRepository;
    @Mock private ForumQuestionService questionService;
    @Mock private AuthServiceClient authServiceClient;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ExpertAnswerService expertAnswerService;

    private ForumQuestionEntity openQuestion;
    private CreateExpertAnswerRequestDTO request;

    @BeforeEach
    void setUp() {
        openQuestion = new ForumQuestionEntity();
        openQuestion.setId(1L);
        openQuestion.setTitulo("Pergunta de Matemática");
        openQuestion.setQuestionType(QuestionType.ESPECIALIZADO);
        openQuestion.setStatus(QuestionStatus.ABERTA);
        openQuestion.setArea("Matematica");
        openQuestion.setCreatedBy("student1");

        request = new CreateExpertAnswerRequestDTO();
        request.setConteudo("Esta é a resposta do especialista");
    }

    @Test
    void createAnswer_authorizedProfessor_succeeds() {
        when(questionService.getEntityById(1L)).thenReturn(openQuestion);
        when(authServiceClient.canProfessorAnswerArea("prof1", "Matematica")).thenReturn(true);

        ExpertAnswerEntity saved = new ExpertAnswerEntity();
        saved.setId(10L);
        saved.setConteudo(request.getConteudo());
        saved.setQuestionId(1L);
        saved.setAnsweredBy("prof1");
        saved.setAccepted(false);
        when(answerRepository.save(any())).thenReturn(saved);

        ExpertAnswerResponseDTO result = expertAnswerService.create(1L, request, "prof1");

        assertThat(result.getAnsweredBy()).isEqualTo("prof1");
        assertThat(result.getAccepted()).isFalse();
        verify(notificationService).notifyNewAnswer(1L, "EXPERT");
    }

    @Test
    void createAnswer_unauthorizedProfessor_throwsForbidden() {
        when(questionService.getEntityById(1L)).thenReturn(openQuestion);
        when(authServiceClient.canProfessorAnswerArea("prof2", "Matematica")).thenReturn(false);

        assertThatThrownBy(() -> expertAnswerService.create(1L, request, "prof2"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("especialização");
    }

    @Test
    void createAnswer_closedQuestion_throwsBadRequest() {
        openQuestion.setStatus(QuestionStatus.FECHADA);
        when(questionService.getEntityById(1L)).thenReturn(openQuestion);

        assertThatThrownBy(() -> expertAnswerService.create(1L, request, "prof1"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("fechada");
    }

    @Test
    void createAnswer_collaborativeQuestion_throwsBadRequest() {
        openQuestion.setQuestionType(QuestionType.COLABORATIVO);
        when(questionService.getEntityById(1L)).thenReturn(openQuestion);

        assertThatThrownBy(() -> expertAnswerService.create(1L, request, "prof1"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Colaborativo");
    }

    @Test
    void acceptAnswer_byOwner_closesQuestion() {
        ExpertAnswerEntity answer = new ExpertAnswerEntity();
        answer.setId(10L);
        answer.setQuestionId(1L);
        answer.setAnsweredBy("prof1");
        answer.setAccepted(false);

        when(answerRepository.findById(10L)).thenReturn(Optional.of(answer));
        when(questionService.getEntityById(1L)).thenReturn(openQuestion);
        when(answerRepository.save(any())).thenReturn(answer);

        ExpertAnswerResponseDTO result = expertAnswerService.acceptAnswer(10L, "student1");

        assertThat(result.getAccepted()).isTrue();
        verify(questionService).closeQuestion(1L);
        verify(notificationService).notifyAnswerAccepted(1L, 10L);
    }

    @Test
    void acceptAnswer_byNonOwner_throwsForbidden() {
        ExpertAnswerEntity answer = new ExpertAnswerEntity();
        answer.setId(10L);
        answer.setQuestionId(1L);
        answer.setAccepted(false);

        when(answerRepository.findById(10L)).thenReturn(Optional.of(answer));
        when(questionService.getEntityById(1L)).thenReturn(openQuestion);

        assertThatThrownBy(() -> expertAnswerService.acceptAnswer(10L, "otherStudent"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("autor");
    }

    @Test
    void acceptAnswer_alreadyAccepted_isIdempotent() {
        ExpertAnswerEntity answer = new ExpertAnswerEntity();
        answer.setId(10L);
        answer.setQuestionId(1L);
        answer.setAccepted(true);

        when(answerRepository.findById(10L)).thenReturn(Optional.of(answer));
        when(questionService.getEntityById(1L)).thenReturn(openQuestion);

        ExpertAnswerResponseDTO result = expertAnswerService.acceptAnswer(10L, "student1");

        assertThat(result.getAccepted()).isTrue();
        verify(answerRepository, never()).save(any());
    }
}
