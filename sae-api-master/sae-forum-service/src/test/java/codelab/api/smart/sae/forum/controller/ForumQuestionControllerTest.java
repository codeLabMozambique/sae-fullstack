package codelab.api.smart.sae.forum.controller;

import codelab.api.smart.sae.forum.dto.response.QuestionResponseDTO;
import codelab.api.smart.sae.forum.enums.QuestionStatus;
import codelab.api.smart.sae.forum.enums.QuestionType;
import codelab.api.smart.sae.forum.resource.ForumQuestionResource;
import codelab.api.smart.sae.forum.service.ForumQuestionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ForumQuestionResource.class)
@Import(codelab.api.smart.sae.forum.config.SecurityConfig.class)
class ForumQuestionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ForumQuestionService questionService;
    @MockBean codelab.api.smart.sae.framework.filter.JwtRequestFilter jwtRequestFilter;
    @MockBean codelab.api.smart.sae.framework.util.JwtUtil jwtUtil;

    @Test
    @WithMockUser(username = "student1", authorities = {"STUDENT"})
    void createQuestion_asStudent_returns201() throws Exception {
        QuestionResponseDTO dto = new QuestionResponseDTO();
        when(questionService.create(any(), eq("student1"))).thenReturn(dto);

        mockMvc.perform(post("/questions")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "titulo", "Como resolver equações?",
                    "descricao", "Preciso de ajuda com equações do 2º grau",
                    "disciplina", "MATEMATICA",
                    "questionType", "ESPECIALIZADO"
                ))))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "prof1", authorities = {"PROFESSOR"})
    void createQuestion_asProfessor_returns403() throws Exception {
        mockMvc.perform(post("/questions")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "titulo", "Pergunta de professor",
                    "descricao", "Descrição da pergunta",
                    "questionType", "ESPECIALIZADO"
                ))))
            .andExpect(status().isForbidden());
    }

    @Test
    void listQuestions_publicAccess_returns200() throws Exception {
        when(questionService.list(any(), any(), any(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/questions"))
            .andExpect(status().isOk());
    }

    @Test
    void getQuestion_notFound_returns404() throws Exception {
        when(questionService.getById(999L))
            .thenThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "Pergunta não encontrada"));

        mockMvc.perform(get("/questions/999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void createQuestion_missingTitulo_returns400() throws Exception {
        mockMvc.perform(post("/questions")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "descricao", "Sem título",
                    "questionType", "ESPECIALIZADO"
                ))))
            .andExpect(status().is4xxClientError());
    }

    @Test
    void listQuestions_withFilters_returns200() throws Exception {
        when(questionService.list(eq(codelab.api.smart.sae.forum.enums.DisciplinaEnum.MATEMATICA), eq(QuestionType.ESPECIALIZADO),
                eq(QuestionStatus.ABERTA), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/questions")
                .param("disciplina", "MATEMATICA")
                .param("questionType", "ESPECIALIZADO")
                .param("status", "ABERTA"))
            .andExpect(status().isOk());
    }
}
