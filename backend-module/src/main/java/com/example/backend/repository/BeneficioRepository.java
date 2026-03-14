package com.example.backend.repository;

import com.example.backend.domain.Beneficio;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BeneficioRepository extends JpaRepository<Beneficio, Long> {

    Page<Beneficio> findByAtivoTrue(Pageable pageable);

    Page<Beneficio> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Beneficio b WHERE b.id = :id")
    Optional<Beneficio> findByIdWithLock(@Param("id") Long id);
}
