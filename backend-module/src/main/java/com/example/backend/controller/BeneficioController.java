package com.example.backend.controller;

import com.example.backend.dto.BeneficioDto.BeneficioResponse;
import com.example.backend.dto.BeneficioDto.CreateBeneficioRequest;
import com.example.backend.dto.BeneficioDto.PageResponse;
import com.example.backend.dto.BeneficioDto.TransferRequest;
import com.example.backend.dto.BeneficioDto.UpdateBeneficioRequest;
import com.example.backend.service.BeneficioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/beneficios")
@Tag(name = "Beneficios", description = "Gerenciamento de beneficios")
public class BeneficioController {

    private final BeneficioService service;

    public BeneficioController(BeneficioService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista todos os beneficios paginados")
    public PageResponse<BeneficioResponse> list(
            @Parameter(description = "Numero da pagina (base 0)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamanho da pagina") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Campo de ordenacao") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Direcao: ASC ou DESC") @RequestParam(defaultValue = "ASC") String direction
    ) {
        return service.findAll(page, size, sortBy, direction);
    }

    @GetMapping("/ativos")
    @Operation(summary = "Lista apenas os beneficios ativos")
    public PageResponse<BeneficioResponse> listAtivos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.findAtivos(page, size);
    }

    @GetMapping("/busca")
    @Operation(summary = "Busca beneficios por nome")
    public PageResponse<BeneficioResponse> search(
            @Parameter(description = "Fragmento do nome") @RequestParam String nome,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.findByNome(nome, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um beneficio pelo id")
    @ApiResponse(responseCode = "200", description = "Beneficio encontrado")
    @ApiResponse(responseCode = "404", description = "Beneficio nao encontrado")
    public BeneficioResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cria um novo beneficio")
    @ApiResponse(responseCode = "201", description = "Beneficio criado")
    @ApiResponse(responseCode = "400", description = "Dados invalidos")
    public BeneficioResponse create(@Valid @RequestBody CreateBeneficioRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um beneficio existente")
    @ApiResponse(responseCode = "200", description = "Beneficio atualizado")
    @ApiResponse(responseCode = "404", description = "Beneficio nao encontrado")
    public BeneficioResponse update(@PathVariable Long id, @Valid @RequestBody UpdateBeneficioRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove um beneficio")
    @ApiResponse(responseCode = "204", description = "Beneficio removido")
    @ApiResponse(responseCode = "404", description = "Beneficio nao encontrado")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/transferencia")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Transfere valor entre dois beneficios",
            description = "Opera de forma atomica com locking pessimista. Valida saldo, status ativo e previne deadlock."
    )
    @ApiResponse(responseCode = "204", description = "Transferencia realizada")
    @ApiResponse(responseCode = "422", description = "Regra de negocio violada (saldo insuficiente, beneficio inativo, etc.)")
    public void transfer(@Valid @RequestBody TransferRequest request) {
        service.transfer(request);
    }
}
