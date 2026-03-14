package com.example.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BeneficioDto {

    public record BeneficioResponse(
            Long id,
            String nome,
            String descricao,
            BigDecimal valor,
            Boolean ativo,
            Long version,
            LocalDateTime criadoEm,
            LocalDateTime atualizadoEm
    ) {}

    public record CreateBeneficioRequest(
            @NotBlank(message = "O nome e obrigatorio")
            @Size(max = 100, message = "O nome deve ter no maximo 100 caracteres")
            String nome,

            @Size(max = 255, message = "A descricao deve ter no maximo 255 caracteres")
            String descricao,

            @NotNull(message = "O valor e obrigatorio")
            @DecimalMin(value = "0.00", message = "O valor deve ser maior ou igual a zero")
            BigDecimal valor,

            @NotNull(message = "O campo ativo e obrigatorio")
            Boolean ativo
    ) {}

    public record UpdateBeneficioRequest(
            @NotBlank(message = "O nome e obrigatorio")
            @Size(max = 100, message = "O nome deve ter no maximo 100 caracteres")
            String nome,

            @Size(max = 255, message = "A descricao deve ter no maximo 255 caracteres")
            String descricao,

            @NotNull(message = "O valor e obrigatorio")
            @DecimalMin(value = "0.00", message = "O valor deve ser maior ou igual a zero")
            BigDecimal valor,

            @NotNull(message = "O campo ativo e obrigatorio")
            Boolean ativo
    ) {}

    public record TransferRequest(
            @NotNull(message = "O id de origem e obrigatorio")
            Long fromId,

            @NotNull(message = "O id de destino e obrigatorio")
            Long toId,

            @NotNull(message = "O valor e obrigatorio")
            @DecimalMin(value = "0.01", message = "O valor da transferencia deve ser maior que zero")
            BigDecimal amount
    ) {}

    public record PageResponse<T>(
            java.util.List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {}
}
