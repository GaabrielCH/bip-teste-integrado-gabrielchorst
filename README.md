# BIP Beneficios

Solucao para o desafio fullstack integrado. O objetivo e construir uma aplicacao em camadas — banco de dados, modulo EJB, API REST e frontend Angular — corrigindo um bug de concorrencia no servico de transferencia e entregando um CRUD funcional de ponta a ponta.

---

## Estrutura do repositorio

```
bip-solution/
├── db/                    Scripts de banco de dados (schema e seed)
├── ejb-module/            Modulo EJB com servico de transferencia corrigido
├── backend-module/        API REST com Spring Boot 3
├── frontend/              SPA com Angular 17
└── docs/                  Documentacao adicional
```

---

## Tecnologias

| Camada   | Escolha                                                     |
|----------|-------------------------------------------------------------|
| Banco    | H2 em memoria para dev/test, compativel com PostgreSQL      |
| EJB      | Jakarta EJB 4, JPA 3, locking pessimista                    |
| Backend  | Spring Boot 3.2, Spring Data JPA, Springdoc OpenAPI 2       |
| Frontend | Angular 17 (standalone components), TypeScript 5.4          |
| Testes   | JUnit 5, Mockito 5, Spring MockMvc, Karma + Jasmine         |
| CI       | GitHub Actions                                              |

---

## O bug no EJB e como foi corrigido

O metodo `transfer` original em `BeneficioEjbService` era este:

```java
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    Beneficio from = em.find(Beneficio.class, fromId);
    Beneficio to   = em.find(Beneficio.class, toId);

    from.setValor(from.getValor().subtract(amount));
    to.setValor(to.getValor().add(amount));

    em.merge(from);
    em.merge(to);
}
```

Os problemas eram quatro:

**1. Ausencia de validacoes de entrada.** Valores nulos, zero ou negativos passavam direto para o banco sem qualquer verificacao. Ids identicos tambem nao eram barrados.

**2. Sem verificacao de saldo.** Era possivel debitar um valor maior do que o disponivel, gerando saldo negativo.

**3. Sem locking.** Dois threads executando a transferencia simultaneamente podiam ler o mesmo saldo antes de qualquer escrita, aplicar os dois debitos sobre o valor original e persistir resultados inconsistentes. Esse e o classico problema de lost update.

**4. Sem garantia transacional explicita.** A ausencia de `@TransactionAttribute` deixava o comportamento dependente da configuracao do container, sem garantia de rollback em caso de falha entre os dois merges.

A correcao aplicada:

- Validacao completa de todos os argumentos antes de qualquer interacao com o banco.
- Verificacao de existencia e status ativo de ambos os registros.
- Verificacao de saldo suficiente antes de debitar.
- Locking pessimista com `LockModeType.PESSIMISTIC_WRITE`: o banco bloqueia o registro no momento da leitura, impedindo que outro thread leia ou escreva ate o commit.
- Aquisicao de locks sempre em ordem crescente de `id`, independente da direcao da transferencia. Isso elimina a possibilidade de deadlock entre dois threads que operem sobre o mesmo par de registros em ordens opostas.
- `@TransactionAttribute(REQUIRED)` tornando o comportamento transacional explicito e garantindo rollback automatico.

A coluna `version` ja existente no schema foi mantida na entidade com `@Version`, deixando a base preparada para locking otimista em outros contextos onde o nivel de concorrencia for menor.

---

## Como executar

### Banco de dados

Os scripts em `db/` podem ser aplicados em qualquer banco compativel com SQL padrao. Para desenvolvimento local, o backend sobe com H2 em memoria e executa os scripts automaticamente — nenhuma configuracao adicional e necessaria.

```bash
# Apenas se quiser rodar contra um banco externo:
psql -U postgres -d bip -f db/schema.sql
psql -U postgres -d bip -f db/seed.sql
```

### Backend

Requer Java 17 e Maven 3.9 ou superior.

```bash
cd backend-module
mvn spring-boot:run
```

A API sobe em `http://localhost:8080`.

Apos subir:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`
- H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:bipdb`, usuario `sa`, senha vazia)

### Frontend

Requer Node.js 20 ou superior.

```bash
cd frontend
npm install
npm start
```

A aplicacao sobe em `http://localhost:4200` e espera o backend em `http://localhost:8080`.

---

## Endpoints da API

| Metodo | Endpoint                         | Descricao                                         |
|--------|----------------------------------|---------------------------------------------------|
| GET    | /api/v1/beneficios               | Lista paginada, com ordenacao configuravel         |
| GET    | /api/v1/beneficios/ativos        | Lista apenas os registros com `ativo = true`       |
| GET    | /api/v1/beneficios/busca?nome=   | Busca por nome, parcial e case-insensitive         |
| GET    | /api/v1/beneficios/{id}          | Busca por id                                      |
| POST   | /api/v1/beneficios               | Cria novo beneficio                               |
| PUT    | /api/v1/beneficios/{id}          | Atualiza beneficio existente                      |
| DELETE | /api/v1/beneficios/{id}          | Remove beneficio                                  |
| POST   | /api/v1/beneficios/transferencia | Transfere valor entre dois beneficios             |

Todos os erros seguem o formato RFC 7807 Problem Details.

Exemplo de transferencia:

```json
POST /api/v1/beneficios/transferencia
{
  "fromId": 1,
  "toId": 2,
  "amount": 100.00
}
```

Resposta de sucesso: `204 No Content`

Resposta quando o saldo e insuficiente ou o beneficio esta inativo: `422 Unprocessable Entity`

```json
{
  "type": "urn:bip:error:business",
  "title": "Regra de negocio violada",
  "status": 422,
  "detail": "Saldo insuficiente no beneficio de origem. Disponivel: 500.00, Solicitado: 800.00"
}
```

---

## Testes

### EJB

```bash
cd ejb-module
mvn test
```

Cobre: transferencia bem-sucedida, saldo insuficiente, valor zero, valor negativo, ids nulos, ids iguais, beneficio de origem inativo, beneficio de destino inativo, registro nao encontrado e ordenacao de locks para prevencao de deadlock.

### Backend

```bash
cd backend-module
mvn test
```

Testes de unidade no `BeneficioService` com Mockito e testes de integracao no `BeneficioController` via Spring MockMvc com banco H2 em memoria. Cobre todos os endpoints incluindo cenarios de erro.

### Frontend

```bash
cd frontend
npm test
```

Testes do `BeneficioService` com `HttpClientTestingModule` cobrindo todos os metodos de comunicacao com a API.

---

## Decisoes de projeto

**Locking pessimista na transferencia**

A coluna `version` no schema permite locking otimista em operacoes simples de update, que e a escolha adequada quando conflitos sao pouco frequentes. Para a transferencia optou-se por locking pessimista porque a operacao modifica dois registros ao mesmo tempo e, com locking otimista, seria necessario implementar logica de retry em caso de conflito — complexidade desnecessaria dado que transferencias entre o mesmo par de registros precisam ser serializadas por natureza.

**Prevencao de deadlock por ordenacao de ids**

Quando dois threads executam transferencias em direcoes opostas — thread A de 1 para 2, thread B de 2 para 1 — sem ordenacao de locks o thread A bloqueia o registro 1 e espera o 2, enquanto o thread B bloqueia o 2 e espera o 1, gerando deadlock. A solucao e garantir que todos os participantes adquiram os locks na mesma ordem global: aqui o id crescente.

**Problem Details (RFC 7807)**

O Spring 6 oferece suporte nativo ao `ProblemDetail`, eliminando a necessidade de um wrapper de erro customizado. O formato e padronizado e facil de consumir pelo frontend e por ferramentas de monitoramento.

**Standalone Components no Angular 17**

A arquitetura de componentes standalone e a recomendacao oficial a partir do Angular 17. Ela elimina os NgModules, torna cada componente auto-suficiente nas suas dependencias e simplifica o lazy loading de rotas.
