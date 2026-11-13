# Data Model

<!-- sdlc:auto:start entities -->
### users

| Field | Type | PK | FK | Nullable |
|---|---|---|---|---|
| id | bigint generated identity | True | — | False |
| email | varchar(320) unique, stored lowercased | False | — | False |
| password_hash | text (Argon2 salted hash) | False | — | False |
| role | varchar(10) check in ('viewer','admin') | False | — | False |
| created_at | timestamptz | False | — | False |

### sessions

| Field | Type | PK | FK | Nullable |
|---|---|---|---|---|
| id | bigint generated identity | True | — | False |
| token_hash | char(64) unique (sha256 of opaque token) | False | — | False |
| user_id | bigint | False | users.id | False |
| created_at | timestamptz | False | — | False |
| last_seen_at | timestamptz | False | — | False |
| revoked_at | timestamptz | False | — | True |

### movies

| Field | Type | PK | FK | Nullable |
|---|---|---|---|---|
| id | bigint generated identity | True | — | False |
| title | varchar(300) | False | — | False |
| title_key | varchar(300) (lowercased trimmed title, unique with year) | False | — | False |
| year | smallint | False | — | False |
| genres | text[] | False | — | False |
| director | varchar(200) | False | — | True |
| cast_members | text[] | False | — | False |
| plot | text | False | — | False |
| created_at | timestamptz | False | — | False |

### likes

| Field | Type | PK | FK | Nullable |
|---|---|---|---|---|
| user_id | bigint (composite primary key with movie_id) | True | users.id | False |
| movie_id | bigint (composite primary key with user_id) | True | movies.id | False |
| created_at | timestamptz | False | — | False |
<!-- sdlc:auto:end entities -->

<!-- sdlc:auto:start relationships -->
| Source | Target | Type |
|---|---|---|
| users | sessions | one-to-many |
| users | likes | one-to-many |
| movies | likes | one-to-many |
<!-- sdlc:auto:end relationships -->

<!-- sdlc:auto:start er-diagram -->
```mermaid
erDiagram
  users {
    bigint_generated_identity id PK
    varchar_320__unique__stored_lowercased email
    text__Argon2_salted_hash_ password_hash
    varchar_10__check_in___viewer___admin__ role
    timestamptz created_at
  }
  sessions {
    bigint_generated_identity id PK
    char_64__unique__sha256_of_opaque_token_ token_hash
    bigint user_id FK
    timestamptz created_at
    timestamptz last_seen_at
    timestamptz revoked_at
  }
  movies {
    bigint_generated_identity id PK
    varchar_300_ title
    varchar_300___lowercased_trimmed_title__unique_with_year_ title_key
    smallint year
    text__ genres
    varchar_200_ director
    text__ cast_members
    text plot
    timestamptz created_at
  }
  likes {
    bigint__composite_primary_key_with_movie_id_ user_id PK,FK
    bigint__composite_primary_key_with_user_id_ movie_id PK,FK
    timestamptz created_at
  }
  users ||--o{ sessions : "one-to-many"
  users ||--o{ likes : "one-to-many"
  movies ||--o{ likes : "one-to-many"
```
<!-- sdlc:auto:end er-diagram -->
