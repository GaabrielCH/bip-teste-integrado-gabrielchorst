package com.example.backend.service;

import com.example.backend.domain.Beneficio;
import com.example.backend.dto.BeneficioDto.BeneficioResponse;
import com.example.backend.dto.BeneficioDto.CreateBeneficioRequest;
import com.example.backend.dto.BeneficioDto.TransferRequest;
import com.example.backend.dto.BeneficioDto.UpdateBeneficioRequest;
import com.example.backend.exception.BusinessException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.BeneficioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BeneficioServiceTest {

    @Mock
    private BeneficioRepository repository;

    @InjectMocks
    private BeneficioService service;

    private Beneficio beneficioA;
    private Beneficio beneficioB;

    @BeforeEach
    void setUp() {
        beneficioA = buildBeneficio(1L, "Beneficio A", new BigDecimal("1000.00"), true);
        beneficioB = buildBeneficio(2L, "Beneficio B", new BigDecimal("500.00"), true);
    }

    @Test
    void create_devePersistirERetornarResponse() {
        CreateBeneficioRequest request = new CreateBeneficioRequest(
                "Beneficio Novo", "Descricao", new BigDecimal("200.00"), true);
        when(repository.save(any(Beneficio.class))).thenAnswer(inv -> {
            Beneficio b = inv.getArgument(0);
            b.setId(10L);
            return b;
        });

        BeneficioResponse response = service.create(request);

        assertNotNull(response);
        assertEquals("Beneficio Novo", response.nome());
        assertEquals(new BigDecimal("200.00"), response.valor());
        verify(repository, times(1)).save(any());
    }

    @Test
    void findById_deveLancarExcecaoQuandoNaoEncontrado() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.findById(99L));
    }

    @Test
    void update_deveAtualizarCampos() {
        when(repository.findById(1L)).thenReturn(Optional.of(beneficioA));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateBeneficioRequest request = new UpdateBeneficioRequest(
                "Atualizado", "Nova desc", new BigDecimal("999.00"), true);

        BeneficioResponse response = service.update(1L, request);

        assertEquals("Atualizado", response.nome());
        assertEquals(new BigDecimal("999.00"), response.valor());
    }

    @Test
    void delete_deveRemoverBeneficio() {
        when(repository.findById(1L)).thenReturn(Optional.of(beneficioA));
        service.delete(1L);
        verify(repository, times(1)).delete(beneficioA);
    }

    @Test
    void transfer_deveTransferirComSucesso() {
        when(repository.findByIdWithLock(1L)).thenReturn(Optional.of(beneficioA));
        when(repository.findByIdWithLock(2L)).thenReturn(Optional.of(beneficioB));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.transfer(new TransferRequest(1L, 2L, new BigDecimal("300.00")));

        assertEquals(new BigDecimal("700.00"), beneficioA.getValor());
        assertEquals(new BigDecimal("800.00"), beneficioB.getValor());
    }

    @Test
    void transfer_deveLancarExcecaoQuandoSaldoInsuficiente() {
        when(repository.findByIdWithLock(1L)).thenReturn(Optional.of(beneficioA));
        when(repository.findByIdWithLock(2L)).thenReturn(Optional.of(beneficioB));

        assertThrows(BusinessException.class,
                () -> service.transfer(new TransferRequest(1L, 2L, new BigDecimal("5000.00"))));
        verify(repository, never()).save(any());
    }

    @Test
    void transfer_deveLancarExcecaoQuandoMesmoId() {
        assertThrows(BusinessException.class,
                () -> service.transfer(new TransferRequest(1L, 1L, new BigDecimal("100.00"))));
    }

    @Test
    void transfer_deveLancarExcecaoQuandoBeneficioInativo() {
        beneficioA.setAtivo(false);
        when(repository.findByIdWithLock(1L)).thenReturn(Optional.of(beneficioA));
        when(repository.findByIdWithLock(2L)).thenReturn(Optional.of(beneficioB));

        assertThrows(BusinessException.class,
                () -> service.transfer(new TransferRequest(1L, 2L, new BigDecimal("100.00"))));
    }

    private Beneficio buildBeneficio(Long id, String nome, BigDecimal valor, boolean ativo) {
        Beneficio b = new Beneficio();
        b.setId(id);
        b.setNome(nome);
        b.setValor(valor);
        b.setAtivo(ativo);
        b.setVersion(0L);
        return b;
    }
}
