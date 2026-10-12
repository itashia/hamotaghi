# Hamotaghi API

Laravel 13 REST API for the Hamotaghi student room application. This backend uses Laravel Sanctum sessions for the first-party browser client and short-lived/revocable personal access tokens for the Tauri desktop client. It contains no payment gateway or third-party services.

## Requirements

- PHP 8.4 or newer with SQLite support
- Composer 2
- Node.js and npm are only needed when building the Laravel welcome assets; the React client is built from the repository root

## Local setup

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

The default database is SQLite at `database/database.sqlite`. Migrations are additive and can be run against an existing database with `php artisan migrate`; do not use `migrate:fresh` against a database containing user data. To reset a throwaway local database, back it up and remove it manually first.

The SPA uses cookie sessions and CSRF protection. `FRONTEND_ORIGINS` must list the exact browser origins, and `SANCTUM_STATEFUL_DOMAINS` must list their hostnames with ports. For production, set `SESSION_SECURE_COOKIE=true`, use HTTPS for both applications, and set `SESSION_DOMAIN` to the shared parent domain when the SPA and API are on separate subdomains. Never use wildcard CORS origins with credentials.

The Tauri client uses a Sanctum bearer token because its custom application origin is not a browser first-party domain. Tokens expire after seven days by default and are revocable at logout. Set `SANCTUM_TOKEN_PREFIX` to a deployment-specific secret prefix if desired. The API origin is configured in the frontend with `VITE_API_URL`.

## Run the frontend

At the repository root:

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_API_URL=http://localhost:8000/api/v1` for local development. Configure the same API URL in the Tauri build environment; a packaged desktop app must point to a reachable HTTPS API host.

## API surface

Scramble generates the OpenAPI 3.1 specification automatically from the Laravel routes, controller responses, and validation rules. In the local environment:

- Swagger-style interactive documentation: `http://localhost:8000/docs/api`
- OpenAPI JSON: `http://localhost:8000/docs/api.json`

The documentation routes are restricted to local environments by default. Set `API_VERSION` to change the specification version shown in the document. Run `php artisan scramble:cache` to warm the generated document and `php artisan scramble:clear` after route or validation changes when using the cache.

All routes are under `/api/v1` and return JSON. Validation failures use Laravel's standard `422` response with a field-keyed `errors` object. Unauthenticated requests receive `401`; requests outside a room's active membership are hidden with `404`; owner-only actions return `403`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create account and start session/token |
| POST | `/auth/login` | Authenticate by email or Iranian mobile |
| POST | `/auth/logout` | Revoke token or destroy session |
| GET | `/auth/me` | Current account |
| PATCH | `/auth/profile` | Update profile |
| PUT | `/auth/password` | Change password |
| POST | `/auth/forgot-password` | Send Laravel password reset mail |
| POST | `/auth/reset-password` | Reset password using signed broker token |
| GET | `/rooms/current` | Current active room workspace |
| POST | `/rooms` | Create dormitory and room transactionally |
| GET | `/rooms/invitations/{code}` | Preview invitation target |
| POST | `/rooms/join` | Join an available room |
| PUT | `/rooms/{room}/workspace` | Validate and save the current room workspace transactionally |
| PATCH | `/rooms/{room}` | Update room and dormitory details |
| POST | `/rooms/{room}/invitation` | Rotate invitation code (owner only) |
| DELETE | `/rooms/{room}/members/{user}` | Remove a member (owner only) |
| POST | `/rooms/{room}/leave` | Leave room; owners must transfer ownership |
| POST | `/rooms/{room}/activity/read` | Save the member's read marker |

The workspace payload is bounded by Form Request style Laravel validation in the controller and all nested records are scoped through the authorized room relation. Expense shares are recomputed on the server using integer division and a stable remainder order. Settlements are append-only and validated against current balances. Room IDs and nested model IDs are scoped to the room to prevent IDOR access.

## Data model

- `users`, `dormitories`, `rooms`, and `room_user` hold account, room ownership, capacity, membership role, and invitation data.
- `expenses` and `expense_shares` store integer Toman amounts and deterministic participant allocations; `settlements` preserves transfer history.
- `room_tasks` and `chore_rotations` store task occurrences and recurrence rotation state.
- `shopping_items`, `room_announcements`, `room_activities`, and `supervisor_history` back the existing frontend pages.
- Foreign keys protect financial references; room-owned records cascade with their room, while users referenced by financial history are restricted from deletion.

## Tests and formatting

```sh
cd backend
php artisan test
vendor/bin/pint --dirty --format agent
```

Feature tests use an in-memory SQLite database and do not modify the local development database.

## Password recovery mail

The default local mailer logs reset links. Reset links point at `FRONTEND_URL`; configure a production mail transport and sender before enabling account recovery in deployment. Do not expose the logged reset token in production logs.

For a local visual walkthrough, run `php artisan db:seed` only with `APP_ENV=local`. The development fixture account uses `demo@example.com` / `DemoPass123`, with invitation `AFTAB5`. This seeder is intentionally disabled outside local development and is never run by migrations.
