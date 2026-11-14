# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
208 tests · Passed 198 · Failed 0 · Skipped 0 · Not run 10

Acceptance criteria covered: 63/64 · passing: 59/64
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
| AC-003 | test_ac003_login_accepts_malformed_email_and_signup_rejects | Unit | Passed | `backend/tests/unit/test_schemas.py` |
| AC-002 | test_ac002_email_normalisation_trims_and_lowercases | Unit | Passed | `backend/tests/unit/test_security.py` |
| AC-005 | test_ac005_password_hash_is_salted_argon2 | Unit | Passed | `backend/tests/unit/test_security.py` |
| — | test_session_token_is_long_and_hashed_sha256 | Unit | Passed | `backend/tests/unit/test_security.py` |
| — | test_utcnow_is_timezone_aware | Unit | Passed | `backend/tests/unit/test_security.py` |
| AC-005, NFR-001 | test_ac005_nfr001_seeded_passwords_are_stored_as_salted_argon2 | Unit | Passed | `backend/tests/unit/test_seed_passwords.py` |
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
| AC-001 | [AC-001] new visitor signs up and lands signed in on For you | E2E | Passed | `frontend/e2e/signup.spec.ts` |
| AC-002, NFR-013, NFR-015 | [AC-002][NFR-013][NFR-015] duplicate email in another letter case shows already-registered message | E2E | Passed | `frontend/e2e/signup.spec.ts` |
| AC-003, NFR-015 | [AC-003][NFR-015] 7-character password shows a specific message and creates no account | E2E | Passed | `frontend/e2e/signup.spec.ts` |
| AC-003, NFR-015 | [AC-003][NFR-015] invalid email shows a specific message and creates no account | E2E | Passed | `frontend/e2e/signup.spec.ts` |
| AC-004, NFR-005 | [AC-004][NFR-005] signed-up user is a viewer with no Upload entry | E2E | Passed | `frontend/e2e/signup.spec.ts` |
| AC-004, NFR-005 | [AC-004][NFR-005] signup request carrying role admin still yields viewer | E2E | Passed | `frontend/e2e/signup.spec.ts` |

### US-002: Log in and log out

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-006, NFR-013 | [AC-006][NFR-013] login with email in another letter case lands on For you | E2E | Passed | `frontend/e2e/login.spec.ts` |
| AC-007, NFR-003 | [AC-007][NFR-003] wrong password and unknown email show the identical message and 401 body | E2E | Passed | `frontend/e2e/login.spec.ts` |
| AC-008, NFR-002 | [AC-008][NFR-002] logout revokes the token, protected page redirects, second session stays valid | E2E | Passed | `frontend/e2e/login.spec.ts` |
| AC-009, NFR-002 | [AC-009][NFR-002] a revoked or unknown token sends the user to login with the expired notice | E2E | Passed | `frontend/e2e/login.spec.ts` |
| AC-010, NFR-004 | [AC-010][NFR-004] signed out API calls return 401 and change nothing | E2E | Passed | `frontend/e2e/login.spec.ts` |
| AC-010, NFR-004 | [AC-010][NFR-004] signed out, For you, Search and Upload redirect to login | E2E | Passed | `frontend/e2e/login.spec.ts` |
| NFR-005 | [NFR-005] a viewer has no Upload entry and is refused the admin page | E2E | Passed | `frontend/e2e/login.spec.ts` |
| NFR-005 | [NFR-005] the bootstrap admin signs in and sees the Upload entry | E2E | Passed | `frontend/e2e/login.spec.ts` |

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
| AC-023, NFR-011 | test_ac023_nfr011_session_idle_and_cors_settings | Unit | Passed | `backend/tests/unit/test_config_settings.py` |
| AC-023, NFR-011 | test_ac023_nfr011_no_extra_service_in_compose_or_docs | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| AC-023 | test_ac023_readme_names_no_extra_service | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| AC-024 | test_ac024_accounts_and_sample_movies_survive_restart | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| AC-024 | test_ac024_likes_survive_restart | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| AC-024, NFR-010 | test_ac024_nfr010_first_admin_and_catalog_not_duplicated | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| NFR-011 | test_nfr011_readme_covers_required_topics | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |
| NFR-013 | test_nfr013_documentation_is_english_latin | Integration | Passed | `backend/tests/integration/test_restart_persistence.py` |

## Sprint 2

### US-003: First admin account from server config

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-011 | test_ac011_admin_created_and_can_log_in | Integration | Passed | `backend/tests/unit/test_first_admin.py` |
| AC-012 | test_ac012_restarts_keep_one_admin_and_hash | Integration | Passed | `backend/tests/unit/test_first_admin.py` |
| AC-013 | test_ac013_unset_or_half_set_warns_and_seeds_nothing | Integration | Passed | `backend/tests/unit/test_first_admin.py` |
| AC-014 | test_ac014_require_admin_401_403_and_signup_never_admin | Integration | Passed | `backend/tests/unit/test_first_admin.py` |
| — | test_smoke_viewer_seeded_once_and_not_when_unset | Integration | Passed | `backend/tests/unit/test_first_admin.py` |
| AC-011, NFR-005 | [AC-011][NFR-005] the first admin signs in on the login screen and sees Upload movies | E2E | Passed | `frontend/e2e/first-admin.spec.ts` |
| AC-014, NFR-005 | [AC-014][NFR-005] a signed-out visit to /admin-upload ends on the login screen | E2E | Passed | `frontend/e2e/first-admin.spec.ts` |
| AC-014, NFR-005 | [AC-014][NFR-005] a signup viewer has no Upload movies item and /admin-upload redirects to For you | E2E | Passed | `frontend/e2e/first-admin.spec.ts` |
| AC-014, NFR-005 | [AC-014][NFR-005] a viewer who signed up on screen is refused an upload with 403 and a signed-out caller gets 401 | E2E | Passed | `frontend/e2e/first-admin.spec.ts` |
| AC-015, NFR-005 | [AC-015][NFR-005] signup creates a viewer, never an admin | E2E | Passed | `frontend/e2e/first-admin.spec.ts` |
| NFR-001 | [NFR-001] signup and /auth/me never return the password or a hash | E2E | Passed | `frontend/e2e/nfr.spec.ts` |
| NFR-010 | [NFR-010] the first admin exists once and the sample catalog has no duplicates | E2E | Passed | `frontend/e2e/nfr.spec.ts` |
| NFR-013 | [NFR-013] login and signup screens are English only | E2E | Passed | `frontend/e2e/nfr.spec.ts` |

### US-004: No password reset or email verification

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-015 | no reset or verification > [AC-015] login page has no reset or verification text, links or calls | Unit | Passed | `frontend/src/screens/NoVerification.test.tsx` |
| AC-015 | no reset or verification > [AC-015] signup page has no reset or verification text, links or calls | Unit | Passed | `frontend/src/screens/NoVerification.test.tsx` |
| AC-016 | no reset or verification > [AC-016] signup signs in from the response token and goes to For you | Unit | Passed | `frontend/src/screens/NoVerification.test.tsx` |
| AC-015 | [AC-015] login and signup offer no reset or verification option and send no email request | E2E | Passed | `frontend/e2e/no-reset-verification.spec.ts` |
| AC-015 | [AC-015] signing up makes no reset, verify or email API call | E2E | Passed | `frontend/e2e/no-reset-verification.spec.ts` |
| AC-016, NFR-013 | [AC-016][NFR-013] a new account uses the app immediately with no verification step | E2E | Passed | `frontend/e2e/no-reset-verification.spec.ts` |

### US-008: Search movies by title

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-025 | Search > [AC-025] submitting Heat calls GET /movies?q=Heat and lists Heat | Unit | Passed | `frontend/src/screens/Search.test.tsx` |
| AC-026 | Search > [AC-026] a result opens the detail screen by numeric id | Unit | Passed | `frontend/src/screens/Search.test.tsx` |
| AC-026 | Search > [AC-026] lists title and year, shows total and pages with Load more | Unit | Passed | `frontend/src/screens/Search.test.tsx` |
| AC-027 | Search > [AC-027] a failed request shows an error, not No movies found | Unit | Passed | `frontend/src/screens/Search.test.tsx` |
| AC-027 | Search > [AC-027] shows No movies found when total is 0 | Unit | Passed | `frontend/src/screens/Search.test.tsx` |
| AC-027 | Search > [AC-027] upload hint is hidden for non-admins | Unit | Passed | `frontend/src/screens/Search.test.tsx` |
| AC-028 | Search > [AC-028] makes no request without a session token | Unit | Passed | `frontend/src/screens/Search.test.tsx` |
| AC-025 | [AC-025] clicking a result opens the movie detail page | E2E | Passed | `frontend/e2e/search.spec.ts` |
| AC-025 | [AC-025] searching heat and HEAT both list the movie Heat | E2E | Passed | `frontend/e2e/search.spec.ts` |
| AC-026 | [AC-026] a partial title search lists Heat with title and year | E2E | Passed | `frontend/e2e/search.spec.ts` |
| AC-026 | [AC-026] every movie whose title contains the text is listed with title and year | E2E | Passed | `frontend/e2e/search.spec.ts` |
| AC-027 | [AC-027] a nonsense string shows No movies found | E2E | Passed | `frontend/e2e/search.spec.ts` |
| AC-028, NFR-004 | [AC-028][NFR-004] GET /movies without a token returns 401 and changes nothing | E2E | Passed | `frontend/e2e/search.spec.ts` |
| AC-028, NFR-004 | [AC-028][NFR-004] a signed-out visit to /search ends on the login screen | E2E | Passed | `frontend/e2e/search.spec.ts` |
| NFR-013 | [NFR-013] the search screen is English only | E2E | Passed | `frontend/e2e/search.spec.ts` |

### US-009: Movie detail page

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-029 | MovieDetail > [AC-029] a failed like keeps the state and shows an error | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-029 | MovieDetail > [AC-029] a title param is resolved through the movie lookup | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-029 | MovieDetail > [AC-029] like then unlike use PUT and DELETE and update after success | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-029 | MovieDetail > [AC-029] shows an empty state when there are no similar movies | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-029 | MovieDetail > [AC-029] shows the movie details and the liked state from /me/likes | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-029 | MovieDetail > [AC-029] similar movies show score and open the detail page; empty state otherwise | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-030 | MovieDetail > [AC-030] uses generated SVG artwork with no image or upload control | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-031 | MovieDetail > [AC-031] a 404 from the API shows Movie not found | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-031 | MovieDetail > [AC-031] an unmatched title shows Movie not found | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-045 | MovieDetail > [AC-045] the status line reports the number of liked movies | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-046 | MovieDetail > [AC-046] a viewer with no likes sees 0 movies | Unit | Passed | `frontend/src/screens/MovieDetail.test.tsx` |
| AC-029 | [AC-029] Similar movies lists at most 10 and selecting one opens its detail page | E2E | Passed | `frontend/e2e/movie-detail.spec.ts` |
| AC-029 | [AC-029] opening a movie from search shows its details and a like control | E2E | Passed | `frontend/e2e/movie-detail.spec.ts` |
| AC-030 | [AC-030] generated placeholder image, no third-party requests, no upload control | E2E | Passed | `frontend/e2e/movie-detail.spec.ts` |
| NFR-013 | [NFR-013] the movie not found message screen is English only | E2E | Passed | `frontend/e2e/movie-detail.spec.ts` |

### US-012: Similarity computed in-house

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-039 | test_ac039_each_field_changes_vector_and_scores | Unit | Passed | `backend/tests/unit/test_similarity.py` |
| AC-039 | test_ac039_terms_are_namespaced_and_lowercased | Unit | Passed | `backend/tests/unit/test_similarity.py` |
| AC-040 | test_ac040_hand_calculated_scores_and_range | Unit | Passed | `backend/tests/unit/test_similarity.py` |
| AC-041 | test_ac041_empty_fields_are_scored_without_error | Unit | Passed | `backend/tests/unit/test_similarity.py` |
| NFR-012 | test_nfr012_order_is_deterministic_with_ties_by_id | Unit | Passed | `backend/tests/unit/test_similarity.py` |
| NFR-012 | test_nfr012_rank_caps_at_ten | Unit | Passed | `backend/tests/unit/test_similarity.py` |
| NFR-009 | test_nfr009_backend_imports_no_network_clients | Integration | Passed | `backend/tests/integration/test_nfr009_self_contained.py` |
| NFR-009 | test_nfr009_frontend_loads_no_outside_assets | Integration | Passed | `backend/tests/integration/test_nfr009_self_contained.py` |
| AC-039, AC-041 | test_ac039_ac041_every_sample_movie_is_scored_without_error | Integration | Passed | `backend/tests/integration/test_similarity.py` |
| AC-040, NFR-012 | test_ac040_nfr012_repeated_calls_give_same_order | Integration | Passed | `backend/tests/integration/test_similarity.py` |
| AC-040, NFR-012 | test_ac040_nfr012_scores_in_range_sorted_and_capped | Integration | Passed | `backend/tests/integration/test_similarity.py` |
| AC-039, AC-040, AC-041, NFR-012 | test_ac039_ac040_ac041_nfr012_hand_calculated_scores_via_upload | Integration | Passed | `backend/tests/integration/test_similarity_upload.py` |

### US-013: Like and unlike movies

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-042, AC-043 | [AC-042][AC-043] Like shows liked, pressing again shows not liked | E2E | Passed | `frontend/e2e/likes.spec.ts` |
| AC-044 | [AC-044] a like survives logout/login and shows in a second browser context | E2E | Passed | `frontend/e2e/likes.spec.ts` |
| AC-045 | [AC-045] a double click on Like leaves the movie liked once | E2E | Passed | `frontend/e2e/likes.spec.ts` |
| AC-046, NFR-006 | [AC-046][NFR-006] a second viewer sees not liked and none of the first viewer's likes | E2E | Passed | `frontend/e2e/likes.spec.ts` |
| NFR-004 | [NFR-004] like, unlike and my likes without a token return 401 and change nothing | E2E | Passed | `frontend/e2e/likes.spec.ts` |
| NFR-004 | [NFR-004] signed out, the detail page redirects to login and like changes nothing | E2E | Passed | `frontend/e2e/likes.spec.ts` |
| NFR-013 | [NFR-013] the movie detail screen is English only | E2E | Passed | `frontend/e2e/likes.spec.ts` |

## Sprint 3

### US-011: See similar movies ranked by similarity

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-034, AC-035, AC-037, NFR-012 | test_ac034_ac035_ac037_nfr012_ranked_output_is_bounded_sorted_and_stable | Unit | Passed | `backend/tests/unit/test_similarity_scale.py` |
| AC-038 | test_ac038_catalog_cache_rebuilds_only_when_fingerprint_changes | Unit | Passed | `backend/tests/unit/test_similarity_scale.py` |
| AC-038, NFR-007, NFR-008 | test_ac038_nfr007_nfr008_5000_movies_vectorise_and_rank_fast | Unit | Passed | `backend/tests/unit/test_similarity_scale.py` |
| NFR-012 | test_nfr012_scores_stay_in_range_with_empty_fields | Unit | Passed | `backend/tests/unit/test_similarity_scale.py` |
| AC-034, AC-035 | [AC-034][AC-035] at most 10 similar entries, scores non-increasing, own title absent | E2E | Passed | `frontend/e2e/similar-movies.spec.ts` |
| AC-036 | [AC-036] a movie sharing director, genres and cast ranks above one sharing nothing | E2E | Passed | `frontend/e2e/similar-movies.spec.ts` |
| AC-037 | [AC-037] reloading twice gives the identical order | E2E | Passed | `frontend/e2e/similar-movies.spec.ts` |
| AC-038, NFR-007 | [AC-038][NFR-007] the similar section is visible within 2 seconds of page load | E2E | Passed | `frontend/e2e/similar-movies.spec.ts` |
| NFR-013 | [NFR-013] the similar section text is English only | E2E | Passed | `frontend/e2e/similar-movies.spec.ts` |

### US-014: For you list from all likes

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-047 | ForYou > [AC-047] shows an error when loading fails | Unit | Passed | `frontend/src/screens/ForYou.test.tsx` |
| AC-047 | ForYou > [AC-047] shows the ranked list in server order and opens a movie | Unit | Passed | `frontend/src/screens/ForYou.test.tsx` |
| AC-049 | ForYou > [AC-049] has_likes with no items shows the liked-everything state | Unit | Passed | `frontend/src/screens/ForYou.test.tsx` |
| AC-050 | ForYou > [AC-050] a failed like shows an error and keeps the list | Unit | Passed | `frontend/src/screens/ForYou.test.tsx` |
| AC-050 | ForYou > [AC-050] like and unlike call the API then reload | Unit | Passed | `frontend/src/screens/ForYou.test.tsx` |
| AC-051 | ForYou > [AC-051] no likes shows the prompt and no list, and Search movies goes to /search | Unit | Passed | `frontend/src/screens/ForYou.test.tsx` |
| AC-047, AC-049 | [AC-047][AC-049] recommendations are highest match first, capped at 10, and exclude liked titles | E2E | Passed | `frontend/e2e/for-you.spec.ts` |
| AC-048 | [AC-048] after liking two movies there are recommendations related to each | E2E | Passed | `frontend/e2e/for-you.spec.ts` |
| AC-050 | [AC-050] unliking a movie, or liking another, changes the list on the next visit | E2E | Passed | `frontend/e2e/for-you.spec.ts` |
| AC-051 | [AC-051] a new viewer sees the like prompt, a Search movies control and no recommendations | E2E | Passed | `frontend/e2e/for-you.spec.ts` |
| AC-051, AC-052 | [AC-051][AC-052] liking a first movie removes the prompt and shows a recommendations list | E2E | Passed | `frontend/e2e/for-you.spec.ts` |
| NFR-004 | [NFR-004] signed out, /for-you redirects to login and GET /me/for-you returns 401 | E2E | Passed | `frontend/e2e/for-you.spec.ts` |
| NFR-006 | [NFR-006] a second viewer with no likes sees the prompt, not the first viewer's recommendations | E2E | Passed | `frontend/e2e/for-you.spec.ts` |
| NFR-013 | [NFR-013] the For you screen is English only | E2E | Passed | `frontend/e2e/for-you.spec.ts` |

### US-016: Upload movies from a CSV file

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-053, AC-058, AC-059, AC-060 | test_ac053_ac058_ac059_ac060_mixed_rows | Unit | Passed | `backend/tests/unit/test_admin_upload.py` |
| AC-056 | test_ac056_bad_header_and_non_utf8_add_nothing | Unit | Passed | `backend/tests/unit/test_admin_upload.py` |
| AC-061 | test_ac061_no_edit_or_delete_routes | Unit | Passed | `backend/tests/unit/test_admin_upload.py` |
| AC-053, AC-054, AC-058 | AdminUpload > [AC-053] [AC-054] [AC-058] sends the file and shows counts and rows | Unit | Passed | `frontend/src/screens/AdminUpload.test.tsx` |
| AC-054 | AdminUpload > [AC-054] shows an empty state before any upload | Unit | Passed | `frontend/src/screens/AdminUpload.test.tsx` |
| AC-056 | AdminUpload > [AC-056] refuses a non-.csv file before any request | Unit | Passed | `frontend/src/screens/AdminUpload.test.tsx` |
| AC-056 | AdminUpload > [AC-056] shows the server detail on a 400 | Unit | Passed | `frontend/src/screens/AdminUpload.test.tsx` |
| AC-053, AC-054, AC-055, NFR-015 | [AC-053][AC-054][AC-055][NFR-015] valid upload adds rows, shows counts, splits genres and cast, shows Similar movies | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| AC-056, NFR-015 | [AC-056][NFR-015] a .txt file is refused, says nothing was added, and its title is not searchable | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| AC-056, NFR-015 | [AC-056][NFR-015] a CSV missing a required column shows an error and adds nothing | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| AC-057, NFR-005 | [AC-057][NFR-005] a viewer gets 403 and an anonymous caller 401 on upload, and the catalog is unchanged | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| AC-057, NFR-005 | [AC-057][NFR-005] a viewer is redirected from /admin-upload and sees no upload control | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| AC-058, NFR-015 | [AC-058][NFR-015] rejected rows list row number and reason, and valid rows are added | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| AC-059 | [AC-059] re-uploading the same title and year in another letter case is skipped | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| AC-060 | [AC-060] the same title and year twice in one file adds the first and skips the second | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| AC-061 | [AC-061] no edit or delete control on upload page or detail page, and PUT/PATCH/DELETE on /movies/{id} are refused | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |
| NFR-013, NFR-015 | [NFR-013][NFR-015] the upload page and its result are English only | E2E | Passed | `frontend/e2e/admin-upload.spec.ts` |

## Sprint 4

### US-006: No outside dependencies at build or run time

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-021 | self-contained build > [AC-021] no src, href, url() or @import points at a web address | Unit | Passed | `frontend/src/self-contained.test.ts` |
| AC-021 | self-contained build > [AC-021] no web font is loaded from a web address | Unit | Passed | `frontend/src/self-contained.test.ts` |
| AC-021 | self-contained build > [AC-021] other http(s) URLs are only SVG xmlns declarations | Unit | Passed | `frontend/src/self-contained.test.ts` |
| AC-021 | self-contained build > [AC-021] scans index.html and the source files | Unit | Passed | `frontend/src/self-contained.test.ts` |
| AC-021, NFR-009 | [AC-021][NFR-009] every request on every page goes to the SPA or API origin and no font comes from elsewhere | E2E | Not run yet | `frontend/e2e/self-contained.spec.ts` |
| AC-021, NFR-009 | [AC-021][NFR-009] no stylesheet, script, link or image references a third-party host | E2E | Not run yet | `frontend/e2e/self-contained.spec.ts` |
| AC-022, NFR-009 | [AC-022][NFR-009] search, similar, like and unlike, For you and upload contact only the SPA and API hosts | E2E | Not run yet | `frontend/e2e/self-contained.spec.ts` |
| NFR-009, AC-021, AC-022 | [NFR-009][AC-021][AC-022] with all other hosts aborted every flow still works and nothing was blocked | E2E | Not run yet | `frontend/e2e/self-contained.spec.ts` |
| NFR-013 | [NFR-013] the pages visited in the self-contained flows are English only | E2E | Not run yet | `frontend/e2e/self-contained.spec.ts` |

### US-010: Generated placeholder artwork

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-032 | Artwork > [AC-032] has no image element and no http(s) URL | Unit | Passed | `frontend/src/lib/Artwork.test.tsx` |
| AC-033 | Artwork > [AC-033] casing and whitespace do not change the output | Unit | Passed | `frontend/src/lib/Artwork.test.tsx` |
| AC-033 | Artwork > [AC-033] different titles differ | Unit | Passed | `frontend/src/lib/Artwork.test.tsx` |
| AC-033 | Artwork > [AC-033] same input renders identical markup twice | Unit | Passed | `frontend/src/lib/Artwork.test.tsx` |
| AC-033 | Artwork > [AC-033] same title in a different year differs | Unit | Passed | `frontend/src/lib/Artwork.test.tsx` |
| AC-032 | [AC-032] every Search tile, the detail main and similar movies, and For you cards have artwork | E2E | Not run yet | `frontend/e2e/artwork.spec.ts` |
| AC-032, NFR-009 | [AC-032][NFR-009] artwork uses no <img> and no image is requested from another origin | E2E | Not run yet | `frontend/e2e/artwork.spec.ts` |
| AC-033, NFR-014 | [AC-033][NFR-014] Heat artwork is identical on Search, detail, similar and For you, after reload and in a second context | E2E | Not run yet | `frontend/e2e/artwork.spec.ts` |
| AC-033, NFR-014 | [AC-033][NFR-014] different movies have different artwork keys and markup | E2E | Not run yet | `frontend/e2e/artwork.spec.ts` |
| NFR-013 | [NFR-013] artwork pages are English only | E2E | Not run yet | `frontend/e2e/artwork.spec.ts` |

### US-018: Setup and usage guide

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-062, NFR-011 | test_ac062_nfr011_explains_install_start_and_settings | Integration | Passed | `backend/tests/integration/test_setup_guide.py` |
| AC-063, NFR-011 | test_ac063_nfr011_csv_format_columns_separator_and_example | Integration | Passed | `backend/tests/integration/test_setup_guide.py` |
| AC-064, NFR-011 | test_ac064_nfr011_limits_reset_verification_services_scale | Integration | Passed | `backend/tests/integration/test_setup_guide.py` |
| NFR-013 | test_nfr013_documentation_is_english_only | Integration | Passed | `backend/tests/integration/test_setup_guide.py` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_seeds_admin_and_viewer_once | Unit | Passed | `backend/tests/unit/test_bootstrap.py` |
| — | test_seeds_nothing_without_settings | Unit | Passed | `backend/tests/unit/test_bootstrap.py` |
| — | test_health_reports_ok | Integration | Passed | `backend/tests/integration/test_health.py` |
| — | test_the_openapi_document_builds | Integration | Passed | `backend/tests/integration/test_health.py` |
| — | the app loads | E2E | Passed | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
