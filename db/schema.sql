CREATE TABLE beneficio (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome        VARCHAR(100)   NOT NULL,
    descricao   VARCHAR(255),
    valor       DECIMAL(15, 2) NOT NULL,
    ativo       BOOLEAN        NOT NULL DEFAULT TRUE,
    version     BIGINT         NOT NULL DEFAULT 0,
    criado_em   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
