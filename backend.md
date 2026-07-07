<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../frontend/public/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="../frontend/public/logo-light.png">
    <img src="../frontend/public/logo-dark.png" alt="OmakeBox Logo" width="80" height="80">
  </picture>
</p>

<h1 align="center">OmakeBox — Backend</h1>

<p align="center">
  <strong>API REST · Node.js · Express · PostgreSQL · Sequelize</strong>
  <br>
  Documentação técnica da camada de servidor.
</p>

---

## 📑 Índice

- [Arquitetura](#-arquitetura)
- [Stack](#-stack)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Modelagem de Dados](#-modelagem-de-dados)
- [Endpoints da API](#-endpoints-da-api)
- [Serviços](#-serviços)
- [Integração Jikan API](#-integração-jikan-api)
- [Autenticação](#-autenticação)
- [Migrações](#-migrações)
- [Deploy](#-deploy)

---

## 🏛️ Arquitetura

O backend segue o padrão **MVC (Model-View-Controller)** enriquecido com camadas adicionais (Service, Repository) para respeitar os princípios **SOLID**.

```
HTTP Request
    │
    ▼
┌─────────────┐     ┌──────────────┐
│   Route     │────▶│  Middleware   │ (auth JWT, validação Joi, optionalAuth)
└─────────────┘     └──────────────┘
    │
    ▼
┌─────────────┐
│  Controller  │  (interpreta req/res, chama Service)
└─────────────┘
    │
    ▼
┌─────────────┐
│   Service   │  (regra de negócio pura)
└─────────────┘
    │
    ▼
┌─────────────┐
│ Repository  │  (abstração de acesso a dados)
└─────────────┘
    │
    ▼
┌─────────────┐
│    Model    │  (Sequelize — tabela PostgreSQL)
└─────────────┘
```

### Princípios SOLID Aplicados

| Princípio | Aplicação |
|-----------|-----------|
| **S** — Single Responsibility | Controller só traduz HTTP; Service só executa regras; Repository só acessa dados |
| **O** — Open/Closed | Sistema de notificações extensível via estratégias |
| **L** — Liskov Substitution | Repositories implementam interfaces substituíveis |
| **I** — Interface Segregation | Serviços coesos (AuthService, TrackingService, FeedService...) |
| **D** — Dependency Inversion | Dependências injetadas via abstrações |

---

## 🛠️ Stack

| Tecnologia | Versão | Finalidade |
|-----------|--------|------------|
| Node.js | 22.x | Runtime |
| Express | 4.21.x | Framework HTTP |
| Sequelize | 6.37.x | ORM |
| PostgreSQL | 16 | Banco de dados (via Neon) |
| JWT (jsonwebtoken) | 9.x | Autenticação stateless |
| bcrypt | 5.x | Hash de senhas |
| Joi | 17.x | Validação de schemas |
| Multer | 2.x | Upload de arquivos |
| Umzug | 3.x | Migrations programáticas |
| Jest | 30.x | Testes unitários |

---

## 📂 Estrutura de Pastas

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js          # Config Sequelize CLI (ambientes)
│   │   ├── database.js        # Conexão Sequelize (DATABASE_URL ou params)
│   │   ├── environment.js     # Variáveis de ambiente tipadas
│   │   └── migrator.js        # Umzug runner
│   │
│   ├── controllers/           # Handlers HTTP
│   │   ├── AnimeController.js       # Busca, trending, temporada, gênero
│   │   ├── AuthController.js        # Register, login, refresh
│   │   ├── AvatarController.js      # Upload/remoção de avatar
│   │   ├── CommunityController.js   # Votação, reviews, personagens
│   │   ├── ConnectionController.js  # Conexões entre usuários
│   │   ├── FeedController.js        # Posts, likes, comentários
│   │   ├── NotificationController.js# Notificações
│   │   ├── OnboardingController.js  # Primeiro acesso
│   │   ├── StatsController.js       # Estatísticas
│   │   ├── TrackingController.js    # Tracking pessoal
│   │   ├── TranslateController.js   # Tradução
│   │   └── UserController.js        # Perfil, edição
│   │
│   ├── integrations/
│   │   └── JikanClient.js     # Cliente Jikan API com cache stale-while-revalidate
│   │
│   ├── middlewares/
│   │   ├── auth.js            # Autenticação obrigatória (JWT)
│   │   ├── optionalAuth.js    # Autenticação opcional
│   │   ├── errorHandler.js    # Tratamento centralizado de erros
│   │   └── validate.js        # Validação via Joi
│   │
│   ├── models/                # Modelos Sequelize
│   │   ├── index.js           # Associações entre modelos
│   │   ├── Anime.js
│   │   ├── Character.js
│   │   ├── CharacterVote.js
│   │   ├── Comment.js
│   │   ├── Connection.js
│   │   ├── EpisodeWatchHistory.js
│   │   ├── Notification.js
│   │   ├── Post.js
│   │   ├── User.js
│   │   └── UserAnimeTracking.js
│   │
│   ├── repositories/          # Camada de dados
│   │   ├── BaseRepository.js
│   │   ├── AnimeRepository.js
│   │   ├── CharacterRepository.js
│   │   ├── CharacterVoteRepository.js
│   │   ├── CommentRepository.js
│   │   ├── ConnectionRepository.js
│   │   ├── EpisodeWatchHistoryRepository.js
│   │   ├── NotificationRepository.js
│   │   ├── PostRepository.js
│   │   ├── UserAnimeTrackingRepository.js
│   │   └── UserRepository.js
│   │
│   ├── routes/                # Definição de rotas
│   │   ├── index.js           # Agregador de rotas + health check
│   │   ├── animeRoutes.js
│   │   ├── authRoutes.js
│   │   ├── communityRoutes.js
│   │   ├── connectionRoutes.js
│   │   ├── feedRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── onboardingRoutes.js
│   │   ├── statsRoutes.js
│   │   ├── trackingRoutes.js
│   │   ├── translateRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── services/              # Regras de negócio
│   │   ├── AuthService.js
│   │   ├── CommunityService.js
│   │   ├── ConnectionService.js
│   │   ├── FeedService.js
│   │   ├── NotificationService.js
│   │   ├── OnboardingService.js
│   │   ├── StatsService.js
│   │   ├── TrackingService.js
│   │   ├── TranslateService.js
│   │   └── UserService.js
│   │
│   ├── utils/
│   │   └── AppError.js       # Classe de erro com statusCode
│   │
│   └── validators/
│       ├── authValidators.js
│       ├── communityValidators.js
│       └── feedValidators.js
│
├── migrations/                # Migrations do banco
│   ├── 20260707000001-initial-schema.js
│   ├── 20260707000002-indexes.js
│   └── 20260707000003-add-user-fields.js
│
├── tests/                     # Testes unitários (Jest)
│   ├── setup.js
│   ├── __mocks__/
│   └── services/
│
├── server.js                  # Entry point
├── render.yaml                # Configuração Render
└── package.json
```

---

## 🗄️ Modelagem de Dados

### Diagrama de Entidade-Relacionamento

```
┌──────────┐       ┌───────────────────┐       ┌───────────┐
│   User   │───1:N─│ UserAnimeTracking │───N:1─│   Anime   │
└──────────┘       └───────────────────┘       └───────────┘
     │                                              │
     │ 1:N                                          │ 1:N
     ▼                                              ▼
┌──────────┐       ┌───────────────┐       ┌───────────┐
│   Post   │───1:N─│   Comment     │       │ Character │
└──────────┘       └───────────────┘       └───────────┘
     │                                          │
     │ 1:N                                      │ 1:N
     ▼                                          ▼
┌──────────────┐       ┌────────────────┐       ┌───────────────┐
│ Notification │       │ CharacterVote  │       │     User      │
└──────────────┘       └────────────────┘       └───────────────┘

┌──────────────┐       ┌────────────────┐
│  Connection  │───N:1─│     User       │ (solicitante / destinatario)
└──────────────┘       └────────────────┘

┌──────────────────────┐
│ EpisodeWatchHistory  │───N:1─ User, Anime
└──────────────────────┘
```

### Entidades

| Entidade | Descrição | Principais Campos |
|----------|-----------|-------------------|
| **User** | Conta do usuário | nickname (UNIQUE), email (UNIQUE), senha_hash, avatar_url, bio, links_sociais (JSONB) |
| **Anime** | Cache local de obras | mal_id (UNIQUE), titulo, capa_url, sinopse, total_episodios, generos (JSONB), status |
| **Character** | Personagens (caching) | mal_id (UNIQUE), nome, imagem_url, anime_id (FK) |
| **UserAnimeTracking** | Tracking por usuário X anime | status, ultimo_episodio_assistido, nota (0-10), impressao_texto, UNIQUE(user_id, anime_id) |
| **CharacterVote** | Voto em personagem | user_id (FK), character_id (FK), anime_id (FK), UNIQUE(user_id, anime_id) |
| **Post** | Postagem no feed | user_id (FK), anime_id (FK), texto, marcado_como_spoiler, likes_count |
| **Comment** | Comentário em post | post_id (FK), user_id (FK), texto (VARCHAR 1000) |
| **Connection** | Conexão entre usuários | solicitante_id (FK), destinatario_id (FK), status (pendente/aceita), UNIQUE(solicitante, destinatario) |
| **Notification** | Notificação | user_id (FK), tipo, referencia_tipo, referencia_id, lida |
| **EpisodeWatchHistory** | Histórico de episódios | user_id (FK), anime_id (FK), episode_number |

### Índices

A migration `20260707000002-indexes.js` cria índices estratégicos para performance:

- `posts_criado_em_idx` — Ordenação do feed
- `connections_unique_pair_idx` — Evita conexões duplicadas
- `notifications_user_id_criado_em_idx` — Listagem de notificações
- `uat_unique_user_anime_idx` — Garante 1 tracking por usuário/anime
- `cv_user_anime_unique_idx` — Garante 1 voto por usuário/anime
- `ewh_user_anime_ep_idx` — Histórico de episódios

---

## 🔌 Endpoints da API

Todas as rotas são prefixadas com `/api`.

### Health Check

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Status do servidor |

### Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/auth/register` | Cadastro | — |
| `POST` | `/api/auth/login` | Login | — |
| `POST` | `/api/auth/refresh` | Refresh token | — |

### Usuários

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/users/me` | Dados do usuário logado | JWT |
| `PATCH` | `/api/users/me` | Editar perfil | JWT |
| `POST` | `/api/users/me/favorite-anime` | Definir anime favorito | JWT |
| `POST` | `/api/users/me/avatar/url` | Definir avatar por URL | JWT |
| `POST` | `/api/users/me/avatar/upload` | Upload de avatar | JWT |
| `GET` | `/api/users/:nickname` | Perfil público | — |
| `GET` | `/api/users/:nickname/trackings` | Trackings públicos | — |
| `GET` | `/api/users/:nickname/posts` | Posts públicos | — |
| `GET` | `/api/users/:nickname/stats` | Estatísticas públicas | — |

### Onboarding

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/onboarding/favorite-anime` | Escolher anime favorito inicial | JWT |

### Discovery (Animes)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/anime/trending?page=` | Animes em alta (top) | — |
| `GET` | `/api/anime/search?q=&page=` | Busca por título | — |
| `GET` | `/api/anime/season?year=&season=&page=` | Animes da temporada | — |
| `GET` | `/api/anime/by-genre?genre=&page=` | Animes por gênero | — |

### Comunidade

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/anime/:malId` | Detalhes do anime | — |
| `GET` | `/api/anime/:malId/characters` | Personagens | — |
| `GET` | `/api/anime/:malId/characters/ranking` | Ranking de votação | — |
| `POST` | `/api/anime/:malId/characters/:charMalId/vote` | Votar em personagem | JWT |
| `GET` | `/api/anime/:malId/my-vote` | Meu voto atual | JWT |
| `POST` | `/api/anime/:malId/rating` | Avaliar (0-10) | JWT |
| `GET` | `/api/anime/:malId/rating` | Média das avaliações | — |
| `POST` | `/api/anime/:malId/reviews` | Adicionar impressão | JWT |
| `GET` | `/api/anime/:malId/reviews` | Listar impressões | — |

### Tracking

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/tracking` | Meus trackings | JWT |
| `GET` | `/api/tracking/stats` | Estatísticas de tracking | JWT |
| `GET` | `/api/tracking/:animeMalId` | Tracking de um anime | JWT |
| `POST` | `/api/tracking/:animeMalId` | Criar/atualizar tracking | JWT |
| `DELETE` | `/api/tracking/:animeMalId` | Remover tracking | JWT |
| `POST` | `/api/tracking/:animeMalId/watch-episode` | Assistir próximo episódio | JWT |
| `GET` | `/api/tracking/:animeMalId/details` | Detalhes + histórico | JWT |

### Feed

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/feed?page=` | Feed global | — |
| `GET` | `/api/feed/me/posts` | Meus posts | JWT |
| `GET` | `/api/feed/:postId` | Post com comentários | — |
| `POST` | `/api/feed` | Criar post | JWT |
| `DELETE` | `/api/feed/:postId` | Remover post (autor) | JWT |
| `POST` | `/api/feed/:postId/like` | Curtir post | JWT |
| `POST` | `/api/feed/:postId/comments` | Comentar | JWT |

### Conexões

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/connections` | Minhas conexões | JWT |
| `GET` | `/api/connections/pending` | Solicitações pendentes | JWT |
| `POST` | `/api/connections/:userId` | Enviar solicitação | JWT |
| `PATCH` | `/api/connections/:connectionId/accept` | Aceitar solicitação | JWT |
| `DELETE` | `/api/connections/:connectionId` | Remover conexão | JWT |

### Notificações

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/notifications?page=` | Listar notificações | JWT |
| `GET` | `/api/notifications/unread-count` | Contagem de não lidas | JWT |
| `PATCH` | `/api/notifications/:id/read` | Marcar como lida | JWT |
| `PATCH` | `/api/notifications/read-all` | Marcar todas como lidas | JWT |

### Estatísticas Agregadas

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/stats/global` | Estatísticas globais da plataforma | — |

### Tradução

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/translate` | Traduzir texto | — |

---

## ⚙️ Serviços

### AuthService
- **register(nickname, email, senha)** — Cadastro com hash bcrypt e geração de tokens
- **login(identifier, senha)** — Login por nickname ou email
- **refreshToken(token)** — Refresh de tokens JWT

### UserService
- **getProfile(nickname)** — Perfil público
- **getMe(userId)** — Dados do próprio usuário (inclui email)
- **updateProfile(userId, data)** — Edição de bio, links, avatar

### TrackingService
- **upsertTracking(userId, animeMalId, data)** — Iniciar/atualizar tracking com auto-detecção de completion
- **watchEpisode(userId, animeMalId)** — Incrementa episódio e registra histórico
- **getTrackingDetails(userId, animeMalId)** — Detalhes com progresso percentual e histórico
- **getTrackingStats(userId)** — Estatísticas agregadas (total episódios, tempo gasto, médias)

### CommunityService
- **voteCharacter(userId, animeMalId, charMalId)** — 1 voto ativo por usuário/anime
- **rateAnime(userId, animeMalId, nota)** — Avaliação 0-10 com média calculada
- **getReviews(animeMalId, currentUserId)** — Reviews com regra de visibilidade (spoiler block)
- **getCharacters(animeMalId)** — Personagens com cache Jikan

### FeedService
- **createPost(userId, data)** — Post vinculado a anime
- **getFeed(page, limit)** — Feed paginado
- **likePost(userId, postId)** — Like com notificação ao autor
- **addComment(userId, postId, texto)** — Comentário com notificação

### ConnectionService
- **sendRequest(userId, targetUserId)** — Solicitação com aceite automático se recíproca
- **acceptRequest(userId, connectionId)** — Aceitação com notificação
- **getConnections(userId)** — Lista de conexões ativas

### NotificationService
- **createNotification(userId, { tipo, referencia_tipo, referencia_id })** — Cria notificação
- **getNotifications(userId, page)** — Lista paginada
- **markAsRead / markAllAsRead** — Gerenciamento de leitura

### StatsService
- **getGlobalStats()** — Estatísticas da plataforma (total usuários, animes, posts, etc.)

### OnboardingService
- **syncAnimeFromJikan(malId)** — Busca anime da Jikan e persiste no cache local
- **syncCharactersFromJikan(animeId, malId)** — Busca personagens da Jikan

---

## 🔄 Integração Jikan API

O `JikanClient` implementa um padrão **stale-while-revalidate** com cache em memória:

```
Requisição → Cache fresco? → SIM → Retorna cache
                              ↓
                          NÃO → Busca Jikan API → Sucesso? → SIM → Atualiza cache + retorna
                                                              ↓
                                                           NÃO → Cache expirado? → SIM → Retorna stale + warning
                                                                                   ↓
                                                                                NÃO → Erro
```

- **Cache TTL:** 5 minutos por endpoint
- **Stale fallback:** Se a API falha, dados expirados são retornados com flag `_stale: true`
- **Rate limiting:** Debounce no frontend (400ms) + cache para minimizar chamadas à Jikan

---

## 🔐 Autenticação

O sistema usa **JWT (JSON Web Tokens)** com dois tokens:

| Token | Duração | Propósito |
|-------|---------|-----------|
| **Access Token** | 15 minutos | Autenticação de requisições |
| **Refresh Token** | 7 dias | Renovação do access token |

### Fluxo

1. Login/Register → recebe ambos os tokens
2. Access token enviado via `Authorization: Bearer <token>` em cada requisição
3. Quando access token expira (401), o frontend automaticamente tenta refresh via `/auth/refresh`
4. Se refresh falhar, usuário é redirecionado ao login

### Middlewares

- **auth.js** — Exige token válido (retorna 401 se ausente/inválido)
- **optionalAuth.js** — Extrai usuário se token presente, mas não bloqueia

---

## 📦 Migrações

As migrações usam **Umzug** (executado programaticamente na inicialização do servidor) e também são compatíveis com `sequelize-cli`.

```
20260707000001-initial-schema.js   → Criação de todas as tabelas + extensão uuid-ossp
20260707000002-indexes.js          → Índices estratégicos
20260707000003-add-user-fields.js  → Adição de avatar_url, bio, links_sociais
```

Comandos:
```bash
npm run migrate           # Executa migrations pendentes
npm run migrate:undo      # Reverte última migration
npm run migrate:undo:all  # Reverte todas
```

---

## 🚀 Deploy

### Render (backend)

O deploy é configurado via `render.yaml`:

```yaml
services:
  - type: web
    name: omakebox-api
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: "22.14.0"
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "10000"
      # ⚠ Neon Postgres: cole DATABASE_URL no Dashboard do Render
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: "15m"
      - key: JWT_REFRESH_EXPIRES_IN
        value: "7d"
      - key: FRONTEND_URL
        value: https://omake-box.vercel.app
```

**Importante:** A `DATABASE_URL` do Neon deve ser configurada manualmente no Dashboard do Render (Environment → Environment Variables).

---

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

Os testes estão em `tests/services/` e cobrem todos os serviços do backend usando mocks dos modelos Sequelize.

---

## 📊 Cobertura de Código

Relatórios de cobertura são gerados em `coverage/lcov-report/index.html` após executar `npm run test:coverage`.
