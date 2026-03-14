package com.example.backend.service;

import com.example.backend.domain.Beneficio;
import com.example.backend.dto.BeneficioDto.BeneficioResponse;
import com.example.backend.dto.BeneficioDto.CreateBeneficioRequest;
import com.example.backend.dto.BeneficioDto.PageResponse;
import com.example.backend.dto.BeneficioDto.TransferRequest;
import com.example.backend.dto.BeneficioDto.UpdateBeneficioRequest;
import com.example.backend.exception.BusinessException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.BeneficioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Transactional(readOnly = true)
public class BeneficioService {

    private final BeneficioRepository repository;

    public BeneficioService(BeneficioRepository repository) {
        this.repository = repository;
    }

    public PageResponse<BeneficioResponse> findAll(int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<BeneficioResponse> result = repository.findAll(pageable).map(this::toResponse);
        return toPageResponse(result);
    }

    public PageResponse<BeneficioResponse> findAtivos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nome"));
        Page<BeneficioResponse> result = repository.findByAtivoTrue(pageable).map(this::toResponse);
        return toPageResponse(result);
    }

    public PageResponse<BeneficioResponse> findByNome(String nome, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nome"));
        Page<BeneficioResponse> result = repository.findByNomeContainingIgnoreCase(nome, pageable)
                .map(this::toResponse);
        return toPageResponse(result);
    }

    public BeneficioResponse findById(Long id) {
        return toResponse(getBeneficioOrThrow(id));
    }

    @Transactional
    public BeneficioResponse create(CreateBeneficioRequest request) {
        Beneficio beneficio = new Beneficio();
        beneficio.setNome(request.nome());
        beneficio.setDescricao(request.descricao());
        beneficio.setValor(request.valor());
        beneficio.setAtivo(request.ativo());
        return toResponse(repository.save(beneficio));
    }

    @Transactional
    public BeneficioResponse update(Long id, UpdateBeneficioRequest request) {
        Beneficio beneficio = getBeneficioOrThrow(id);
        beneficio.setNome(request.nome());
        beneficio.setDescricao(request.descricao());
        beneficio.setValor(request.valor());
        beneficio.setAtivo(request.ativo());
        return toResponse(repository.save(beneficio));
    }

    @Transactional
    public void delete(Long id) {
        Beneficio beneficio = getBeneficioOrThrow(id);
        repository.delete(beneficio);
    }

    /**
     * Executa transferencia de valor entre dois beneficios de forma atomica.
     * Os registros sao bloqueados em ordem crescente de id para prevenir deadlock.
     * Toda a operacao ocorre em uma unica transacao — qualquer falha provoca rollback.
     */
    @Transactional
    public void transfer(TransferRequest request) {
        if (request.fromId().equals(request.toId())) {
            throw new BusinessException("Os ids de origem e destino nao podem ser iguais");
        }

        Beneficio from;
        Beneficio to;

        if (request.fromId() < request.toId()) {
            from = lockOrThrow(request.fromId());
            to = lockOrThrow(request.toId());
        } else {
            to = lockOrThrow(request.toId());
            from = lockOrThrow(request.fromId());
        }

        validateActive(from, "origem");
        validateActive(to, "destino");
        validateSaldo(from, request.amount());

        from.setValor(from.getValor().subtract(request.amount()));
        to.setValor(to.getValor().add(request.amount()));

        repository.save(from);
        repository.save(to);
    }

    private Beneficio lockOrThrow(Long id) {
        return repository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficio nao encontrado com id: " + id));
    }

    private void validateActive(Beneficio beneficio, String role) {
        if (!Boolean.TRUE.equals(beneficio.getAtivo())) {
            throw new BusinessException(
                    "Beneficio de " + role + " esta inativo: id " + beneficio.getId());
        }
    }

    private void validateSaldo(Beneficio beneficio, BigDecimal amount) {
        if (beneficio.getValor().compareTo(amount) < 0) {
            throw new BusinessException(
                    "Saldo insuficiente no beneficio de origem. Disponivel: "
                    + beneficio.getValor() + ", Solicitado: " + amount);
        }
    }

    private Beneficio getBeneficioOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficio nao encontrado com id: " + id));
    }

    private BeneficioResponse toResponse(Beneficio b) {
        return new BeneficioResponse(
                b.getId(),
                b.getNome(),
                b.getDescricao(),
                b.getValor(),
                b.getAtivo(),
                b.getVersion(),
                b.getCriadoEm(),
                b.getAtualizadoEm()
        );
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
