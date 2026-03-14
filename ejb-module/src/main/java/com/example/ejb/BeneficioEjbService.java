package com.example.ejb;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.util.List;

@Stateless
public class BeneficioEjbService {

    @PersistenceContext
    private EntityManager em;

    public Beneficio find(Long id) {
        Beneficio beneficio = em.find(Beneficio.class, id);
        if (beneficio == null) {
            throw new TransferException("Beneficio nao encontrado com id: " + id);
        }
        return beneficio;
    }

    public List<Beneficio> findAll() {
        return em.createQuery("SELECT b FROM Beneficio b ORDER BY b.id", Beneficio.class)
                .getResultList();
    }

    public Beneficio save(Beneficio beneficio) {
        validateBeneficio(beneficio);
        em.persist(beneficio);
        return beneficio;
    }

    public Beneficio update(Beneficio beneficio) {
        validateBeneficio(beneficio);
        return em.merge(beneficio);
    }

    public void delete(Long id) {
        Beneficio beneficio = find(id);
        em.remove(em.contains(beneficio) ? beneficio : em.merge(beneficio));
    }

    /**
     * Transfere valor entre dois beneficios de forma atomica.
     *
     * Correcoes aplicadas em relacao ao codigo original:
     * 1. Validacao de argumentos nulos e valor positivo.
     * 2. Prevencao de transferencia para o mesmo registro.
     * 3. Verificacao de existencia de ambos os registros antes de qualquer modificacao.
     * 4. Locking pessimista (PESSIMISTIC_WRITE) para evitar lost update e leitura suja
     *    em cenarios de alta concorrencia. Os registros sao sempre bloqueados na mesma
     *    ordem (id menor primeiro) para prevenir deadlock.
     * 5. Validacao de saldo suficiente antes de debitar.
     * 6. Validacao de que ambos os beneficios estao ativos.
     * 7. A anotacao @TransactionAttribute(REQUIRED) garante que toda a operacao
     *    ocorre dentro de uma unica transacao — qualquer excecao provoca rollback
     *    automatico, eliminando o risco de estado inconsistente no banco.
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        validateTransferArguments(fromId, toId, amount);

        Beneficio from;
        Beneficio to;

        // Bloqueia sempre na ordem crescente de id para evitar deadlock entre threads
        if (fromId < toId) {
            from = lockBeneficio(fromId);
            to = lockBeneficio(toId);
        } else {
            to = lockBeneficio(toId);
            from = lockBeneficio(fromId);
        }

        if (!Boolean.TRUE.equals(from.getAtivo())) {
            throw new TransferException("Beneficio de origem esta inativo: " + fromId);
        }

        if (!Boolean.TRUE.equals(to.getAtivo())) {
            throw new TransferException("Beneficio de destino esta inativo: " + toId);
        }

        if (from.getValor().compareTo(amount) < 0) {
            throw new TransferException(
                    "Saldo insuficiente no beneficio de origem. Disponivel: "
                    + from.getValor() + ", Solicitado: " + amount);
        }

        from.setValor(from.getValor().subtract(amount));
        to.setValor(to.getValor().add(amount));

        em.merge(from);
        em.merge(to);
    }

    private Beneficio lockBeneficio(Long id) {
        Beneficio beneficio = em.find(Beneficio.class, id, LockModeType.PESSIMISTIC_WRITE);
        if (beneficio == null) {
            throw new TransferException("Beneficio nao encontrado com id: " + id);
        }
        return beneficio;
    }

    private void validateTransferArguments(Long fromId, Long toId, BigDecimal amount) {
        if (fromId == null) {
            throw new TransferException("O id do beneficio de origem nao pode ser nulo");
        }
        if (toId == null) {
            throw new TransferException("O id do beneficio de destino nao pode ser nulo");
        }
        if (fromId.equals(toId)) {
            throw new TransferException("Os ids de origem e destino nao podem ser iguais");
        }
        if (amount == null) {
            throw new TransferException("O valor da transferencia nao pode ser nulo");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new TransferException("O valor da transferencia deve ser maior que zero");
        }
    }

    private void validateBeneficio(Beneficio beneficio) {
        if (beneficio == null) {
            throw new TransferException("Beneficio nao pode ser nulo");
        }
        if (beneficio.getNome() == null || beneficio.getNome().isBlank()) {
            throw new TransferException("O nome do beneficio e obrigatorio");
        }
        if (beneficio.getValor() == null || beneficio.getValor().compareTo(BigDecimal.ZERO) < 0) {
            throw new TransferException("O valor do beneficio deve ser maior ou igual a zero");
        }
    }
}
