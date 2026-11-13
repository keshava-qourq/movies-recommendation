# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
58 tests · Passed 58 · Failed 0 · Skipped 0 · Not run 0

Acceptance criteria covered: 15/64 · passing: 15/64
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start tests -->
## Sprint 1

### US-001: Sign up with email and password

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-008 | test_ac008_revoked_session_is_401 | Unit | Passed | `backend/tests/unit/test_deps.py` |
| AC-009 | test_ac009_idle_boundary_and_refresh | Unit | Passed | `backend/tests/unit/test_deps.py` |
| AC-010 | test_ac010_bad_headers_are_401_with_challenge | Unit | Passed | `backend/tests/unit/test_deps.py` |
| NFR-005 | test_nfr005_require_admin_refuses_viewer | Unit | Passed | `backend/tests/unit/test_deps.py` |
| AC-002 | test_ac002_email_normalisation_trims_and_lowercases | Unit | Passed | `backend/tests/unit/test_security.py` |
| AC-005 | test_ac005_password_hash_is_salted_argon2 | Unit | Passed | `backend/tests/unit/test_security.py` |
| — | test_session_token_is_long_and_hashed_sha256 | Unit | Passed | `backend/tests/unit/test_security.py` |
| — | test_utcnow_is_timezone_aware | Unit | Passed | `backend/tests/unit/test_security.py` |
| AC-008 | App > [AC-008] logout clears the token even when the call fails | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-009 | App > [AC-009] a 401 from /auth/me redirects to login with the expiry notice | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-010 | App > [AC-010] redirects to login without a token and renders no page | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-010 | App > [AC-010] shows Upload movies only for admins | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-010 | App > [AC-010] validates the token with /auth/me and shows the page | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-006 | Login > [AC-006] stores the token and user and goes to For you | Unit | Passed | `frontend/src/screens/Login.test.tsx` |
| AC-007 | Login > [AC-007] shows a specific message on 422 | Unit | Passed | `frontend/src/screens/Login.test.tsx` |
| AC-007 | Login > [AC-007] shows one generic message on 401 and does not navigate | Unit | Passed | `frontend/src/screens/Login.test.tsx` |
| AC-001 | Signup > [AC-001] stores the token and user and goes to For you on 201 | Unit | Passed | `frontend/src/screens/Signup.test.tsx` |
| AC-002 | Signup > [AC-002] shows the taken message and Go to log in on 409 | Unit | Passed | `frontend/src/screens/Signup.test.tsx` |
| AC-003 | Signup > [AC-003] maps a 422 by loc to the email and password fields | Unit | Passed | `frontend/src/screens/Signup.test.tsx` |
| AC-003 | Signup > [AC-003] shows specific messages for empty fields | Unit | Passed | `frontend/src/screens/Signup.test.tsx` |
| AC-003 | Signup > [AC-003] validates on the client and sends no request | Unit | Passed | `frontend/src/screens/Signup.test.tsx` |
| AC-001 | test_ac001_signup_returns_viewer_and_token_works | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-002 | test_ac002_duplicate_email_other_case_returns_409 | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-003 | test_ac003_eight_character_password_is_accepted | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-003 | test_ac003_invalid_email_returns_422_and_creates_nothing | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-003 | test_ac003_short_password_returns_422_and_creates_nothing | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-004 | test_ac004_role_and_is_admin_are_ignored | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-005 | test_ac005_no_response_contains_password_or_hash | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-006 | test_ac006_login_returns_token_and_user_even_with_other_case | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-007, NFR-003 | test_ac007_nfr003_wrong_password_and_unknown_email_are_identical | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-007 | test_ac007_password_is_case_sensitive | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-008 | test_ac008_logout_revokes_only_that_token | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-008 | test_ac008_logout_without_token_returns_401 | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| AC-010, NFR-004 | test_ac010_nfr004_me_without_valid_token_returns_401 | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| — | test_bootstrap_admin_and_smoke_viewer_sign_in | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| NFR-001 | test_nfr001_passwords_and_tokens_are_not_stored_in_plain_text | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| NFR-002 | test_nfr002_logout_ends_session | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| NFR-004 | test_nfr004_movie_features_refuse_signed_out_users | Integration | Passed | `backend/tests/integration/test_auth_api.py` |
| NFR-013, NFR-015 | test_nfr013_nfr015_validation_messages_are_specific_english | Integration | Passed | `backend/tests/integration/test_auth_api.py` |

### US-005: Sample catalog available after install

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-017 | test_ac017_fresh_install_loads_about_50_complete_movies | Integration | Passed | `backend/tests/integration/test_sample_catalog.py` |
| AC-018, NFR-010 | test_ac018_nfr010_restart_does_not_duplicate_or_remove | Integration | Passed | `backend/tests/integration/test_sample_catalog.py` |
| AC-019 | test_ac019_sample_is_bundled_hand_written_file_not_fetched | Integration | Passed | `backend/tests/integration/test_sample_catalog.py` |
| NFR-013 | test_nfr013_sample_text_is_english_latin | Integration | Passed | `backend/tests/integration/test_sample_catalog.py` |
| AC-017, AC-019 | test_ac017_ac019_file_exists_and_has_required_fields | Integration | Passed | `backend/tests/unit/test_seed_movies.py` |
| AC-017 | test_ac017_empty_database_loads_sample | Integration | Passed | `backend/tests/unit/test_seed_movies.py` |
| AC-018 | test_ac018_rerun_keeps_admin_added_movies_and_adds_no_duplicates | Integration | Passed | `backend/tests/unit/test_seed_movies.py` |
| AC-019 | test_ac019_seed_opens_no_sockets | Integration | Passed | `backend/tests/unit/test_seed_movies.py` |
| NFR-010 | test_nfr010_three_startups_leave_one_of_each | Integration | Passed | `backend/tests/unit/test_seed_movies.py` |

### US-007: Single deployable app with embedded database

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-023, NFR-011 | test_ac023_nfr011_no_extra_service_in_compose_or_docs | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| AC-024 | test_ac024_accounts_and_sample_movies_survive_restart | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| AC-024 | test_ac024_likes_survive_restart | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| AC-024, NFR-010 | test_ac024_nfr010_first_admin_and_catalog_not_duplicated | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| NFR-013 | test_nfr013_documentation_is_english_latin | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_seeds_admin_and_viewer_once | Unit | Passed | `backend/tests/unit/test_bootstrap.py` |
| — | test_seeds_nothing_without_settings | Unit | Passed | `backend/tests/unit/test_bootstrap.py` |
| — | test_health_reports_ok | Integration | Passed | `backend/tests/integration/test_health.py` |
| — | test_the_openapi_document_builds | Integration | Passed | `backend/tests/integration/test_health.py` |
| — | the app loads | E2E | Passed | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
