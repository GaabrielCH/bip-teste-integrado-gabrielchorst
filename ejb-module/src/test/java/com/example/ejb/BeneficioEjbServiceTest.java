package com.example.ejb;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BeneficioEjbServiceTest {

    @Mock
    private EntityManager em;

    @InjectMocks
    private BeneficioEjbService service;

    private Beneficio origem;
    private Beneficio destino;

    @BeforeEach
    void setUp() {
        origem = new Beneficio();
        origem.setId(1L);
        origem.setNome("Beneficio Origem");
        origem.setValor(new BigDecimal("1000.00"));
        origem.setAtivo(true);
        origem.setVersion(0L);

        destino = new Beneficio();
        destino.setId(2L);
        destino.setNome("Beneficio Destino");
        destino.setValor(new BigDecimal("500.00"));
        destino.setAtivo(true);
        destino.setVersion(0L);
    }

    @Test
    void transfer_deveTransferirValorComSucesso() {
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(origem);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(destino);
        when(em.merge(any(Beneficio.class))).thenAnswer(inv -> inv.getArgument(0));

        service.transfer(1L, 2L, new BigDecimal("300.00"));

        assertEquals(new BigDecimal("700.00"), origem.getValor());
        assertEquals(new BigDecimal("800.00"), destino.getValor());
        verify(em, times(1)).merge(origem);
        verify(em, times(1)).merge(destino);
    }

    @Test
    void transfer_deveLancarExcecaoQuandoSaldoInsuficiente() {
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(origem);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(destino);

        TransferException ex = assertThrows(TransferException.class,
                () -> service.transfer(1L, 2L, new BigDecimal("2000.00")));

        assertEquals(true, ex.getMessage().contains("Saldo insuficiente"));
        verify(em, never()).merge(any());
    }

    @Test
    void transfer_deveLancarExcecaoQuandoValorZero() {
        assertThrows(TransferException.class,
                () -> service.transfer(1L, 2L, BigDecimal.ZERO));
        verify(em, never()).find(eq(Beneficio.class), any(), any(LockModeType.class));
    }

    @Test
    void transfer_deveLancarExcecaoQuandoValorNegativo() {
        assertThrows(TransferException.class,
                () -> service.transfer(1L, 2L, new BigDecimal("-100.00")));
    }

    @Test
    void transfer_deveLancarExcecaoQuandoMesmoId() {
        assertThrows(TransferException.class,
                () -> service.transfer(1L, 1L, new BigDecimal("100.00")));
    }

    @Test
    void transfer_deveLancarExcecaoQuandoFromIdNulo() {
        assertThrows(TransferException.class,
                () -> service.transfer(null, 2L, new BigDecimal("100.00")));
    }

    @Test
    void transfer_deveLancarExcecaoQuandoToIdNulo() {
        assertThrows(TransferException.class,
                () -> service.transfer(1L, null, new BigDecimal("100.00")));
    }

    @Test
    void transfer_deveLancarExcecaoQuandoOrigemInativa() {
        origem.setAtivo(false);
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(origem);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(destino);

        TransferException ex = assertThrows(TransferException.class,
                () -> service.transfer(1L, 2L, new BigDecimal("100.00")));

        assertEquals(true, ex.getMessage().contains("inativo"));
        verify(em, never()).merge(any());
    }

    @Test
    void transfer_deveLancarExcecaoQuandoDestinoInativo() {
        destino.setAtivo(false);
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(origem);
        when(em.find(Beneficio.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(destino);

        TransferException ex = assertThrows(TransferException.class,
                () -> service.transfer(1L, 2L, new BigDecimal("100.00")));

        assertEquals(true, ex.getMessage().contains("inativo"));
        verify(em, never()).merge(any());
    }

    @Test
    void transfer_deveLancarExcecaoQuandoOrigemNaoEncontrada() {
        when(em.find(Beneficio.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(null);

        assertThrows(TransferException.class,
                () -> service.transfer(1L, 2L, new BigDecimal("100.00")));
        verify(em, never()).merge(any());
    }

    @Test
    void transfer_deveBlocarNaOrdemCrescenteParaPrevenirDeadlock() {
        // Transferencia de id maior para id menor — deve bloquear destino (id=1) antes de origem (id=2)
        Beneficio beneficioMaior = new Beneficio();
        beneficioMaior.setId(5L);
        beneficioMaior.setNome("Maior");
        beneficioMaior.setValor(new BigDecimal("1000.00"));
        beneficioMaior.setAtivo(true);
        beneficioMaior.setVersion(0L);

        Beneficio beneficioMenor = new Beneficio();
        beneficioMenor.setId(3L);
        beneficioMenor.setNome("Menor");
        beneficioMenor.setValor(new BigDecimal("200.00"));
        beneficioMenor.setAtivo(true);
        beneficioMenor.setVersion(0L);

        when(em.find(Beneficio.class, 3L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(beneficioMenor);
        when(em.find(Beneficio.class, 5L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(beneficioMaior);
        when(em.merge(any())).thenAnswer(inv -> inv.getArgument(0));

        service.transfer(5L, 3L, new BigDecimal("100.00"));

        assertEquals(new BigDecimal("900.00"), beneficioMaior.getValor());
        assertEquals(new BigDecimal("300.00"), beneficioMenor.getValor());
    }
}
