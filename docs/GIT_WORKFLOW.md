# Git Workflow — BIP Beneficios

Estrategia de branches e sequencia de commits para os 4 dias do desafio.
O historico foi pensado para parecer trabalho real: commits pequenos, mensagens
descritivas no imperativo, pausas naturais entre dias e exploracao gradual.

---

## Estrutura de branches

```
main
└── develop
    ├── feature/db-setup
    ├── feature/ejb-transfer-fix
    ├── feature/backend-domain
    ├── feature/backend-crud
    ├── feature/backend-transfer
    ├── feature/backend-tests
    ├── feature/frontend-structure
    ├── feature/frontend-beneficio-list
    ├── feature/frontend-forms
    ├── feature/frontend-transfer
    └── docs/readme-and-openapi
```

A branch `main` so recebe merge do `develop` ao final de cada dia, simulando
uma entrega diaria estavel. Todo o trabalho acontece em branches de feature
que entram no `develop` via merge (sem squash, para preservar o historico granular).

---

## Comandos para reproduzir o historico

### Configuracao inicial

```bash
git init
git remote add origin https://github.com/seu-usuario/bip-beneficios.git
git checkout -b develop
```

---

## DIA 1 — Banco de dados, estrutura do projeto e EJB

Foco: entender o problema, montar o schema, corrigir o bug principal.

```bash
# --- branch: feature/db-setup ---
git checkout -b feature/db-setup

# Primeiro commit do dia: so o schema, sem seed ainda
# Representa o momento de ler o desafio e montar a estrutura da tabela
cp db/schema.sql .
git add db/schema.sql
git commit -m "add: schema inicial da tabela beneficio com campo version"

# Seed separado, commit proprio — dados e estrutura sao responsabilidades distintas
git add db/seed.sql
git commit -m "add: seed com quatro beneficios de exemplo"

git checkout develop
git merge feature/db-setup --no-ff -m "merge: db-setup — schema e seed prontos"


# --- branch: feature/ejb-transfer-fix ---
git checkout -b feature/ejb-transfer-fix

# Entidade JPA primeiro, sem tocar no servico ainda
git add ejb-module/pom.xml
git add ejb-module/src/main/java/com/example/ejb/Beneficio.java
git commit -m "add: entidade Beneficio com @Version para suporte a locking otimista"

# Excecao de dominio antes do servico — deixa o servico mais limpo
git add ejb-module/src/main/java/com/example/ejb/TransferException.java
git commit -m "add: TransferException para erros de negocio na transferencia"

# O commit mais importante: a correcao do bug
# Mensagem longa porque a mudanca e significativa e merece explicacao
git add ejb-module/src/main/java/com/example/ejb/BeneficioEjbService.java
git commit -m "fix: corrige race condition e falta de validacao no metodo transfer

Problemas identificados no codigo original:
- ausencia de validacao de argumentos (nulo, zero, negativo, ids iguais)
- sem verificacao de saldo antes de debitar
- sem locking: dois threads podiam ler o mesmo saldo e gerar lost update
- sem @TransactionAttribute explicito

Correcoes aplicadas:
- validacao completa de argumentos antes de qualquer acesso ao banco
- verificacao de ativo e saldo antes de modificar qualquer registro
- PESSIMISTIC_WRITE no find para serializar acesso concorrente
- locks adquiridos em ordem crescente de id para prevenir deadlock
- @TransactionAttribute(REQUIRED) para garantir rollback automatico"

# Testes em commit separado — e uma pratica que demonstra que os testes
# foram escritos como verificacao, nao como afterthought
git add ejb-module/src/test/java/com/example/ejb/BeneficioEjbServiceTest.java
git commit -m "test: adiciona testes unitarios para BeneficioEjbService

Cenarios cobertos: transferencia bem-sucedida, saldo insuficiente,
valor zero, valor negativo, ids nulos, ids iguais, origem inativa,
destino inativo, registro nao encontrado e ordenacao de locks."

git checkout develop
git merge feature/ejb-transfer-fix --no-ff -m "merge: ejb-transfer-fix — bug de concorrencia corrigido com testes"

# Merge do dia no main
git checkout main
git merge develop --no-ff -m "release: dia 1 — schema, seed e correcao do EJB"
git checkout develop
```

---

## DIA 2 — Backend: dominio, repositorio, DTOs e CRUD

Foco: construir a espinha dorsal da API antes de expor qualquer endpoint.

```bash
# --- branch: feature/backend-domain ---
git checkout -b feature/backend-domain

# pom.xml primeiro — dependencias definem o que voce vai poder fazer
git add backend-module/pom.xml
git commit -m "add: pom.xml do backend com spring-boot, jpa, validation e springdoc"

# Application e config de infra juntos — sao boilerplate que nao tem valor isolado
git add backend-module/src/main/java/com/example/backend/BackendApplication.java
git add backend-module/src/main/java/com/example/backend/config/JpaConfig.java
git commit -m "add: BackendApplication e configuracao de auditoria JPA"

# Entidade proprio commit — e o modelo central
git add backend-module/src/main/java/com/example/backend/domain/Beneficio.java
git commit -m "add: entidade Beneficio com auditoria de criado_em e atualizado_em"

# DTOs em um commit — andam juntos como contrato da API
git add backend-module/src/main/java/com/example/backend/dto/BeneficioDto.java
git commit -m "add: DTOs de request e response usando Java records"

# Repositorio
git add backend-module/src/main/java/com/example/backend/repository/BeneficioRepository.java
git commit -m "add: BeneficioRepository com query de locking pessimista para transferencia"

# Excecoes e handler — infraestrutura de erro antes de expor endpoints
git add backend-module/src/main/java/com/example/backend/exception/
git commit -m "add: excecoes de dominio e GlobalExceptionHandler com RFC 7807 Problem Details"

git checkout develop
git merge feature/backend-domain --no-ff -m "merge: backend-domain — dominio, DTOs, repositorio e tratamento de erros"


# --- branch: feature/backend-crud ---
git checkout -b feature/backend-crud

# Resources de configuracao primeiro
git add backend-module/src/main/resources/application.properties
git add backend-module/src/main/resources/db/
git commit -m "add: application.properties com H2, JPA e inicializacao automatica do schema"

# Service sem o metodo de transferencia ainda — CRUD puro
git add backend-module/src/main/java/com/example/backend/service/BeneficioService.java
git commit -m "add: BeneficioService com CRUD paginado, busca por nome e ordenacao"

# Controller logo em seguida para poder testar manualmente
git add backend-module/src/main/java/com/example/backend/controller/BeneficioController.java
git commit -m "add: BeneficioController com endpoints CRUD e documentacao Swagger"

# Configs que nao afetam funcionalidade mas melhoram a experiencia
git add backend-module/src/main/java/com/example/backend/config/CorsConfig.java
git add backend-module/src/main/java/com/example/backend/config/OpenApiConfig.java
git commit -m "add: configuracao de CORS para o frontend e metadados da spec OpenAPI"

# Profiles de test separados para nao contaminar o application.properties principal
git add backend-module/src/main/resources/application-test.properties
git commit -m "add: profile de teste com H2 dedicado e SQL verbose"

git checkout develop
git merge feature/backend-crud --no-ff -m "merge: backend-crud — CRUD completo disponivel na API"

# Merge do dia no main
git checkout main
git merge develop --no-ff -m "release: dia 2 — backend com CRUD funcional e documentacao Swagger"
git checkout develop
```

---

## DIA 3 — Backend: transferencia e testes / Frontend: estrutura e lista

Dia mais longo. Backend fecha, frontend comeca.

```bash
# --- branch: feature/backend-transfer ---
git checkout -b feature/backend-transfer

# Adicionar o metodo transfer ao service — e uma mudanca cirurgica, commit proprio
git add backend-module/src/main/java/com/example/backend/service/BeneficioService.java
git commit -m "add: metodo transfer no BeneficioService com locking pessimista e prevencao de deadlock"

# Expor o endpoint no controller
git add backend-module/src/main/java/com/example/backend/controller/BeneficioController.java
git commit -m "add: endpoint POST /transferencia no BeneficioController com documentacao Swagger"

git checkout develop
git merge feature/backend-transfer --no-ff -m "merge: backend-transfer — endpoint de transferencia implementado"


# --- branch: feature/backend-tests ---
git checkout -b feature/backend-tests

# Testes unitarios do service primeiro — mais rapidos de escrever e rodar
git add backend-module/src/test/java/com/example/backend/service/BeneficioServiceTest.java
git commit -m "test: testes unitarios do BeneficioService com Mockito

Cobre: create, findById nao encontrado, update, delete,
transfer bem-sucedida, saldo insuficiente, ids iguais e beneficio inativo."

# Testes de integracao do controller — mais lentos, commit separado e intencional
git add backend-module/src/test/java/com/example/backend/controller/BeneficioControllerTest.java
git commit -m "test: testes de integracao do BeneficioController via MockMvc

Cobre todos os endpoints: GET lista, GET por id, GET 404,
POST create, POST validacao, PUT update, DELETE, transfer sucesso,
transfer 422 e listagem de ativos."

git checkout develop
git merge feature/backend-tests --no-ff -m "merge: backend-tests — cobertura de unidade e integracao no backend"


# --- branch: feature/frontend-structure ---
git checkout -b feature/frontend-structure

# Arquivos de configuracao do projeto Angular
git add frontend/package.json
git add frontend/tsconfig.json
git add frontend/tsconfig.app.json
git add frontend/tsconfig.spec.json
git add frontend/angular.json
git commit -m "add: configuracao do projeto Angular 17 com standalone components"

# Ponto de entrada e html base
git add frontend/src/main.ts
git add frontend/src/index.html
git add frontend/src/styles.scss
git commit -m "add: bootstrap da aplicacao, index.html e estilos globais"

# Environments
git add frontend/src/environments/
git commit -m "add: environments de desenvolvimento e producao com apiUrl"

# Estrutura do app — routes, config e app component
git add frontend/src/app/app.routes.ts
git add frontend/src/app/app.config.ts
git add frontend/src/app/app.component.ts
git commit -m "add: AppComponent, rotas e configuracao de providers com HttpClient"

# Core: model e servico
git add frontend/src/app/core/models/beneficio.model.ts
git commit -m "add: interfaces de modelo Beneficio, DTOs e tipos de paginacao"

git add frontend/src/app/core/services/beneficio.service.ts
git commit -m "add: BeneficioService com todos os metodos de comunicacao com a API"

git add frontend/src/app/core/services/toast.service.ts
git commit -m "add: ToastService com signals para notificacoes globais"

git add frontend/src/app/core/interceptors/error.interceptor.ts
git commit -m "add: interceptor HTTP para tratamento centralizado de erros de API"

git checkout develop
git merge feature/frontend-structure --no-ff -m "merge: frontend-structure — estrutura base do Angular pronta"


# --- branch: feature/frontend-beneficio-list ---
git checkout -b feature/frontend-beneficio-list

# Shared que a lista vai precisar
git add frontend/src/app/shared/pipes/brl.pipe.ts
git commit -m "add: BrlPipe para formatacao de moeda em BRL"

git add frontend/src/app/shared/components/toast/toast.component.ts
git commit -m "add: ToastComponent para exibir notificacoes de sucesso e erro"

git add frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts
git commit -m "add: ConfirmDialogComponent para confirmacao de exclusao"

# O componente de lista em si
git add frontend/src/app/features/beneficios/components/beneficio-list/beneficio-list.component.ts
git commit -m "add: BeneficioListComponent com tabela, paginacao e ordenacao por coluna"

git checkout develop
git merge feature/frontend-beneficio-list --no-ff -m "merge: frontend-beneficio-list — tabela de beneficios com paginacao"

# Merge do dia no main
git checkout main
git merge develop --no-ff -m "release: dia 3 — backend completo com testes e frontend com lista"
git checkout develop
```

---

## DIA 4 — Frontend: formularios, transferencia, pagina principal e CI

Ultimo dia. Fechar o frontend, CI e documentacao.

```bash
# --- branch: feature/frontend-forms ---
git checkout -b feature/frontend-forms

git add frontend/src/app/features/beneficios/components/beneficio-form/beneficio-form.component.ts
git commit -m "add: BeneficioFormComponent com reactive form para criacao e edicao"

git checkout develop
git merge feature/frontend-forms --no-ff -m "merge: frontend-forms — modal de criacao e edicao com validacao"


# --- branch: feature/frontend-transfer ---
git checkout -b feature/frontend-transfer

git add frontend/src/app/features/beneficios/components/transfer-modal/transfer-modal.component.ts
git commit -m "add: TransferModalComponent com selecao de destino e exibicao de saldo"

# Pagina principal integra tudo — e o ultimo componente a ser criado
git add frontend/src/app/features/beneficios/pages/beneficio-page/beneficio-page.component.ts
git commit -m "add: BeneficioPageComponent integrando lista, formularios e transferencia"

# Testes do servico
git add frontend/src/app/core/services/beneficio.service.spec.ts
git commit -m "test: testes do BeneficioService com HttpClientTestingModule"

git checkout develop
git merge feature/frontend-transfer --no-ff -m "merge: frontend-transfer — modal de transferencia e pagina principal integrada"


# --- branch: docs/readme-and-openapi ---
git checkout -b docs/readme-and-openapi

git add README.md
git commit -m "docs: adiciona README com instrucoes de execucao e explicacao do bug corrigido"

git add .github/workflows/ci.yml
git commit -m "ci: pipeline GitHub Actions para ejb, backend e frontend"

git checkout develop
git merge docs/readme-and-openapi --no-ff -m "merge: docs — README completo e CI configurado"

# Merge final no main
git checkout main
git merge develop --no-ff -m "release: dia 4 — frontend completo, testes, CI e documentacao"
```

---

## Historico final esperado no main

```
* release: dia 4 — frontend completo, testes, CI e documentacao
* release: dia 3 — backend completo com testes e frontend com lista
* release: dia 2 — backend com CRUD funcional e documentacao Swagger
* release: dia 1 — schema, seed e correcao do EJB
```

## Historico no develop (resumido)

```
* merge: docs — README completo e CI configurado
* merge: frontend-transfer — modal de transferencia e pagina principal integrada
* merge: frontend-forms — modal de criacao e edicao com validacao
* merge: frontend-beneficio-list — tabela de beneficios com paginacao
* merge: frontend-structure — estrutura base do Angular pronta
* merge: backend-tests — cobertura de unidade e integracao no backend
* merge: backend-transfer — endpoint de transferencia implementado
* merge: backend-crud — CRUD completo disponivel na API
* merge: backend-domain — dominio, DTOs, repositorio e tratamento de erros
* merge: ejb-transfer-fix — bug de concorrencia corrigido com testes
* merge: db-setup — schema e seed prontos
```

---

## Convencoes de mensagem de commit

O padrao seguido foi `tipo: descricao no imperativo, sem ponto final`.

| Prefixo | Quando usar                                          |
|---------|------------------------------------------------------|
| add     | Codigo novo, arquivo novo, funcionalidade nova       |
| fix     | Correcao de bug ou comportamento incorreto           |
| test    | Adicao ou ajuste de testes                           |
| docs    | README, comentarios, documentacao de API             |
| ci      | Arquivos de pipeline e automacao                     |
| refactor| Mudanca interna sem alteracao de comportamento       |
| chore   | Atualizacao de dependencias, gitignore, etc.         |

Commits que mudam algo significativo (como o fix do EJB) devem ter corpo
explicativo separado por linha em branco, descrevendo o problema e a solucao.
ENDOFREADME
