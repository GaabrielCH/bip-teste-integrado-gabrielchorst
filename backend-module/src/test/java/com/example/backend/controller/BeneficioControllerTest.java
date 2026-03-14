package com.example.backend.controller;

import com.example.backend.dto.BeneficioDto.CreateBeneficioRequest;
import com.example.backend.dto.BeneficioDto.TransferRequest;
import com.example.backend.dto.BeneficioDto.UpdateBeneficioRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BeneficioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void list_deveRetornarPaginaComBeneficios() throws Exception {
        mockMvc.perform(get("/api/v1/beneficios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.totalElements", greaterThan(0)));
    }

    @Test
    void findById_deveRetornarBeneficio() throws Exception {
        mockMvc.perform(get("/api/v1/beneficios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)));
    }

    @Test
    void findById_deveRetornar404QuandoNaoEncontrado() throws Exception {
        mockMvc.perform(get("/api/v1/beneficios/9999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_deveCriarBeneficioERetornar201() throws Exception {
        CreateBeneficioRequest request = new CreateBeneficioRequest(
                "Novo Beneficio", "Descricao", new BigDecimal("250.00"), true);

        mockMvc.perform(post("/api/v1/beneficios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome", is("Novo Beneficio")))
                .andExpect(jsonPath("$.valor", is(250.00)));
    }

    @Test
    void create_deveRetornar400QuandoNomeVazio() throws Exception {
        CreateBeneficioRequest request = new CreateBeneficioRequest(
                "", "Descricao", new BigDecimal("250.00"), true);

        mockMvc.perform(post("/api/v1/beneficios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_deveAtualizarBeneficio() throws Exception {
        UpdateBeneficioRequest request = new UpdateBeneficioRequest(
                "Atualizado", "Nova desc", new BigDecimal("999.00"), true);

        mockMvc.perform(put("/api/v1/beneficios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome", is("Atualizado")));
    }

    @Test
    void delete_deveRemoverBeneficio() throws Exception {
        mockMvc.perform(delete("/api/v1/beneficios/1"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/beneficios/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void transfer_deveTransferirComSucesso() throws Exception {
        TransferRequest request = new TransferRequest(1L, 2L, new BigDecimal("100.00"));

        mockMvc.perform(post("/api/v1/beneficios/transferencia")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }

    @Test
    void transfer_deveRetornar422QuandoSaldoInsuficiente() throws Exception {
        TransferRequest request = new TransferRequest(1L, 2L, new BigDecimal("999999.00"));

        mockMvc.perform(post("/api/v1/beneficios/transferencia")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void listAtivos_deveRetornarApenasBeneficiosAtivos() throws Exception {
        mockMvc.perform(get("/api/v1/beneficios/ativos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].ativo", hasSize(greaterThan(0))));
    }
}
