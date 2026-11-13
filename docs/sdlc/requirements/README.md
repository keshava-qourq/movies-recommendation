# Product Requirements

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
## Summary

### REQ-001 · approved · source: requirements:technology-stack

The product owner approved a fixed technology stack: FastAPI backend, React frontend, PostgreSQL database, hosted on AWS. Design must use exactly these, with no substitutions.

- Backend: FastAPI 0.115. Runs the whole product on the server: email/password signup with hashed passwords, session login, viewer and admin roles, CSV validation with row-numbered errors, TF-IDF and cosine similarity code. Python suits the maths; at about 5,000 movies the similarity matrix fits in memory. First admin is created at startup from environment variables.
- Frontend: React 19. Covers the search box, similar-movies list, like/unlike buttons, "For you" page and admin CSV upload screen. Compiles to plain files that the backend serves itself, so there are no CDN fonts or outside assets.
- Database: PostgreSQL 16. Holds users, movies and likes; handles hundreds of users comfortably. Runs in the same deployment next to the app and calls no outside service.
- Cloud: AWS (see REQ-002).
- CONFLICT NOTE: the analyst originally assumed an embedded SQLite file. The product owner replaced it with PostgreSQL 16 because SQLite is not on the list of databases the platform can build with. PostgreSQL is the approved choice.

**Related:** REQ-002

### REQ-002 · approved · source: requirements:services

The whole app runs on one AWS virtual server together with its database. At runtime it uses no other AWS services and makes no outside calls.

- Hosting: one virtual server on AWS runs the app and its database together.
- Runtime: no other AWS services needed.
- No outside calls at build time or run time: no movie APIs, no email sending, no third-party login, no AI/LLM calls.
- Budget: the product owner states the budget allows this easily.

**Related:** REQ-001, NFR-009, NFR-011

### REQ-003 · approved · source: requirements:scope-in

Lists the capabilities that are in scope for WatchNext.

- Viewer signup and login with email and password
- Built-in sample catalog of about 50 well-known movies
- Movie search by title
- Similar-movies list ranked by cosine similarity
- Movie detail page
- Like and unlike movies, saved to the account
- "For you" home page built from all of a viewer's likes
- Prompt to like some movies when there are no likes yet
- Generated placeholder artwork instead of posters
- Basic setup and usage documentation
- Similarity from TF-IDF over plot, genres, director and cast, coded in-house
- Sample movies are original hand-written entries with short plot summaries
- "For you" list excludes movies the viewer already liked
- New signups are always viewers
- No password reset or email verification, since email is excluded
- No poster images, CDN fonts or downloaded assets
- English-only interface

**Related:** REQ-004

### REQ-004 · approved · source: requirements:scope-out

Lists what must not be designed or built.

- Movie poster images
- Email sending (verification, password reset emails) and third-party/social login
- AI/LLM-based recommendations and external movie data APIs

**Related:** REQ-003

### REQ-005 · approved · source: requirements:feature:sign-in-and-accounts

Covers account creation, login/logout, first admin creation, role-based access and the absence of reset/verification flows.

- Sign up with email: a new visitor creates an account with an email and a password of at least 8 characters. Duplicate emails are refused in any letter case. Every new account is a viewer, and the user is signed in straight away.
- Log in and log out: registered users log in with email and password and log out when done. Wrong details give one generic message. Inactive sessions expire and signed-in pages need a login.
- First admin from settings: at startup the app creates the first admin account from the server settings, once only. If no admin details are set, the app still starts and logs a clear message.
- Role-based access: viewers cannot open admin pages or actions. Only admins can reach the upload screen.
- No reset or email checks: no password reset, no email verification, and the app never sends email. New users can use the app straight after signing up.

**Related:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-005

### REQ-006 · approved · source: requirements:feature:movie-catalog

The app ships with a built-in sample catalog loaded on first start.

- Built-in sample movies: on first start the app loads about 50 well-known movies with title, year, genres, director, cast and a short original plot.
- Movies are not duplicated on restart.

**Related:** NFR-010

### REQ-007 · approved · source: requirements:feature:finding-movies

Covers title search, the movie detail page, generated artwork and the similar-movies list.

- Search by title: signed-in viewers search by part of a title in any letter case. Matching movies are listed with title and year, or a "no movies found" message is shown.
- Movie detail page: each movie has a page with title, year, genres, director, cast, plot and a like/unlike button showing the current state. A missing movie shows a not-found message.
- Generated placeholder artwork: every movie shows artwork made by the app, which looks the same each time. No poster images are used.
- Similar movies list: a movie's page lists other movies ranked from most to least similar, 10 by default and never including the movie itself. Similarity uses plot, genres, director and cast.

**Related:** NFR-004, NFR-007, NFR-012, NFR-014

### REQ-008 · approved · source: requirements:feature:likes-and-for-you

Covers liking/unliking, the personalised "For you" page and the prompt shown when a viewer has no likes.

- Like and unlike movies: viewers like and unlike movies. Likes are saved to the account, stay after logging in again or on another device, and are never counted twice.
- For you recommendations: the For you home page ranks movies by how similar they are to all of the viewer's likes. Movies already liked are left out, and the list updates when likes change.
- Prompt to like movies: a viewer with no likes sees a message asking them to like some movies, with a way to search. Recommendations replace it after the first like.

**Related:** NFR-006, NFR-012

### REQ-009 · approved · source: requirements:feature:admin-movie-upload

Admins grow the catalog by uploading CSV files, with row validation, duplicate handling and immediate availability of new movies.

- Upload movies by CSV: admins upload a CSV with title, year, genres, director, cast and plot, using '|' between several genres or cast members. A file that is not a CSV or lacks columns is rejected. The result shows rows added, skipped and rejected.
- Row checks and duplicates: rows with an empty title, a bad year or an empty plot are rejected and listed with row number and reason. Rows matching an existing title and year, or repeated in the file, are skipped.
- New movies used straight away: after an upload, new movies appear in search, similar lists and For you without a restart. Admins can only upload, with no editing or deleting of movies.

**Related:** NFR-005, NFR-015

### REQ-010 · approved · source: requirements:feature:setup-and-documentation

Short English documentation explains installing and configuring the app and states its limits.

- Setup and usage guide covers: installing, starting, the first-admin and session settings, and the CSV format with an example.
- It also states the limits: no password reset or email checks, no outside services, and about 5,000 movies.

**Related:** NFR-011, NFR-013

### NFR-001 · approved · source: requirements:NFR-001

Security: passwords are stored only as salted hashes.

- Every password, including the first admin's password taken from server settings, is stored only as a salted hash.
- Never stored in plain text.

**Related:** REQ-005

### NFR-002 · approved · source: requirements:NFR-002

Security: sessions end on logout and after inactivity.

- A session ends when the user logs out and after the configured period of inactivity.
- After either, requests to signed-in pages or actions are refused until the user logs in again.
- Target: session lifetime is set in server configuration; no fixed number was stated.

**Related:** REQ-005

### NFR-003 · approved · source: requirements:NFR-003

Security: login errors do not reveal which detail was wrong.

- A failed login shows the same generic message whether the email or the password was wrong.
- This prevents the form being used to find out which emails are registered.

**Related:** REQ-005

### NFR-004 · approved · source: requirements:NFR-004

Security: all movie features require sign-in.

- Anyone not signed in is sent to login, or receives an authentication error, when opening For you, search, like or upload.
- No data is changed by such requests.

**Related:** REQ-005, REQ-007, REQ-008, REQ-009

### NFR-005 · approved · source: requirements:NFR-005

Security: admin-only actions are enforced on the server.

- Only admins can open the CSV upload page or send an upload.
- Viewers and signed-out users are refused and the catalog stays unchanged.
- Signup can never create an admin, whatever is submitted.

**Related:** REQ-005, REQ-009

### NFR-006 · approved · source: requirements:NFR-006

Privacy: likes are visible only to their owner.

- A viewer can see only their own likes and recommendations, never those of another viewer.

**Related:** REQ-008

### NFR-007 · approved · source: requirements:NFR-007

Performance: similar movies are returned within 2 seconds at full catalog size.

- With 5,000 movies and normal use by a few hundred users, a similar-movies request returns within 2 seconds.
- Target: within 2 seconds for 5,000 movies under normal use by a few hundred users.

**Related:** REQ-007, NFR-008

### NFR-008 · approved · source: requirements:NFR-008

Scalability: sized for about 5,000 movies and dozens to hundreds of users.

- Similarity is computed in memory on the app server.
- Larger scale is not required.
- Target: up to about 5,000 movies; dozens to hundreds of users.

**Related:** NFR-007

### NFR-009 · approved · source: requirements:NFR-009

Compatibility: fully self-contained with no outside services.

- The app builds and runs with no outside network access.
- No calls to movie APIs, email services, third-party login or AI services.
- All fonts, scripts, styles and images are served by the app itself, with no requests to other web addresses.

**Related:** REQ-002, REQ-004

### NFR-010 · approved · source: requirements:NFR-010

Availability: data survives restarts without duplicates.

- After a restart, accounts, likes and uploaded movies are still there.
- The sample catalog and the first admin account are not duplicated or removed.

**Related:** REQ-006, REQ-005

### NFR-011 · approved · source: requirements:NFR-011

Maintainability: simple installation as one app.

- The app can be installed and started by following the setup documentation.
- It needs no extra services beyond the app and its database.
- The documentation covers installing, starting, the first-admin and session settings, the CSV format and the known limits.

**Related:** REQ-010, REQ-002

### NFR-012 · approved · source: requirements:NFR-012

Maintainability: similarity scoring is verifiable and repeatable.

- Scores match hand-calculated expected values within a small tolerance and always lie between 0 and 1.
- The same catalog and movie always give the same order, with ties broken consistently.
- A movie with an empty field is still scored without error.
- Target: scores between 0 and 1, within a small tolerance of hand-calculated values.

**Related:** REQ-007, REQ-008

### NFR-013 · approved · source: requirements:NFR-013

Usability: English-only interface.

- All screens, messages and documentation are in English only.

**Related:** REQ-010

### NFR-014 · approved · source: requirements:NFR-014

Usability: placeholder artwork looks the same every time.

- Each movie's generated placeholder artwork looks identical on every page and every visit.

**Related:** REQ-007

### NFR-015 · approved · source: requirements:NFR-015

Usability: clear, specific error and validation messages.

- Signup forms show specific validation messages.
- CSV uploads list each rejected row with its row number and reason, and show counts of rows added, skipped and rejected.

**Related:** REQ-005, REQ-009

### NFR-016 · approved · source: requirements:NFR-016

Compliance (accepted risk): no regulated data or region-specific rules apply.

- The product is accepted as holding no regulated data beyond email addresses and hashed passwords.
- It takes no payments and follows no region-specific regulation.
- Recorded as an accepted risk.
<!-- sdlc:auto:end narrative -->

<!-- sdlc:auto:start summary -->
**Requirements version:** v1  
**Delivery scope:** lightweight  
**Approved:** 2026-11-13

**Capabilities in scope:** Viewer signup and login with email and password, Built-in sample catalog of about 50 well-known movies, Movie search by title, Similar-movies list ranked by cosine similarity, Movie detail page, Like and unlike movies, saved to the account, "For you" home page built from all of a viewer's likes, Prompt to like some movies when there are no likes yet, Generated placeholder artwork instead of posters, Basic setup and usage documentation, Similarity from TF-IDF over plot, genres, director and cast, coded in-house, Sample movies are original hand-written entries with short plot summaries, "For you" list excludes movies the viewer already liked, New signups are always viewers, No password reset or email verification, since email is excluded, No poster images, CDN fonts or downloaded assets, English-only interface

**Approved technology stack:**

| Layer | Choice | Rationale |
|---|---|---|
| backend | FastAPI | It runs the whole product on the server: email/password signup with hashed passwords, session login, viewer and admin roles, CSV validation with row-numbered errors, and the TF-IDF and cosine similarity code. Python suits that maths, and at about 5,000 movies the similarity matrix fits easily in memory. The first admin is created at startup from environment variables. |
| cloud | AWS | The app is small, so one virtual server on AWS can run the app and its database together. At runtime it needs no other AWS services and no outside calls, which keeps the app self-contained. Your budget allows this easily. |
| database | PostgreSQL | The analyst assumed an embedded SQLite file, but SQLite is not on the list of databases this platform can build with, so I picked the closest available option. PostgreSQL runs in the same deployment next to the app and calls no outside service. It holds users, movies and likes, and handles hundreds of users comfortably. |
| frontend | React | WatchNext needs a search box, a similar-movies list, like/unlike buttons, a "For you" page and an admin CSV upload screen. React handles all of that. It compiles to plain files that the backend can serve itself, so you still ship one app with no CDN fonts or outside assets, as you required. |
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start epics -->
## EPIC-001: Accounts, roles and sign-in

Viewers sign up and log in with email and password so likes are saved to their account. Two roles exist: viewer and admin. Assumptions surfaced: (1) there is no password reset and no email verification, because email sending is excluded; an admin manually resetting passwords is not included in this version; (2) new signups are always viewers; (3) the first admin account comes from environment/config variables on the server; (4) passwords are stored hashed and login uses sessions.

### US-001: Sign up with email and password

**Priority:** critical

> As a new visitor, I want to create an account with my email and a password, so that my likes are saved and I get personal recommendations.

| ID | Given | When | Then |
|---|---|---|---|
| AC-001 | I am not signed in and the email is not registered | I submit the signup form with a valid email and a valid password | an account is created with the viewer role and I am signed in |
| AC-002 | an account already exists for an email | I try to sign up with that same email in any letter case | signup is rejected with a clear message and no second account is created |
| AC-003 | I am on the signup form | I submit an invalid email or a password shorter than 8 characters | the form shows a specific validation message and no account is created |
| AC-004 | I sign up, whatever I submit in the form | the account is created | its role is always viewer and signup cannot produce an admin |
| AC-005 | an account has been created | its stored data is inspected | the password is stored only as a salted hash, never in plain text |

### US-002: Log in and log out

**Priority:** critical

> As a registered user, I want to log in with my email and password and log out when I'm done, so that only I can access my likes and recommendations.

| ID | Given | When | Then |
|---|---|---|---|
| AC-006 | I have an account | I log in with the correct email and password | I am signed in and taken to my home page |
| AC-007 | I am on the login page | I submit a wrong password or an unknown email | login fails with a generic message that does not reveal which of the two was wrong |
| AC-008 | I am signed in | I log out | my session ends and further requests to signed-in pages or actions are refused until I log in again |
| AC-009 | I am signed in and have been inactive longer than the configured session lifetime | I make another request | I am treated as signed out and asked to log in |
| AC-010 | I am not signed in | I open a page or call an action that needs an account (For you, like, upload) | I am redirected to login or receive an authentication error and no data is changed |

### US-003: First admin account from server config

**Priority:** high

> As a server operator, I want the first admin account to be created from environment/config variables, so that an admin can upload movies without any outside service.

| ID | Given | When | Then |
|---|---|---|---|
| AC-011 | admin email and password are set in the server configuration and no such admin exists | the app starts | an admin account with that email is created, can log in with the configured password, and the password is stored hashed |
| AC-012 | the admin account already exists | the app restarts | no duplicate account is created |
| AC-013 | admin credentials are not configured | the app starts | the app still starts, no admin exists, and a clear log message says so |
| AC-014 | I am signed in as a viewer | I try to open admin-only pages or actions | access is denied and nothing is changed |

### US-004: No password reset or email verification

**Priority:** medium

> As a product owner, I want the app to omit password reset and email verification, so that it never needs to send email.

| ID | Given | When | Then |
|---|---|---|---|
| AC-015 | I am on the login or signup page | I look for reset or verification options | none are offered and the app never attempts to send an email |
| AC-016 | I sign up with a well-formed email | the account is created | I can use the app immediately without verifying the address |

## EPIC-002: Built-in sample catalog and self-contained operation

The app ships with about 50 well-known movies so it works right after install. Assumptions surfaced: the sample is original, hand-written metadata with short original plot summaries bundled with the app; the app is a single deployable web app with an embedded SQLite database; the interface is English only; no poster images, CDN fonts or downloaded assets are used. Scale: up to about 5,000 movies and dozens to hundreds of users.

### US-005: Sample catalog available after install

**Priority:** critical

> As a person installing the app, I want about 50 well-known movies loaded on first start, so that the app is usable immediately.

| ID | Given | When | Then |
|---|---|---|---|
| AC-017 | a fresh install with an empty database | the app starts for the first time | about 50 movies are loaded, each with title, year, genres, director, cast and a short plot summary |
| AC-018 | the sample has already been loaded | the app restarts | no sample movies are duplicated or removed |
| AC-019 | the sample data is reviewed | compared with the files shipped with the app | it consists of hand-written original entries stored with the app and not fetched from any outside source |

### US-006: No outside dependencies at build or run time

**Priority:** critical

> As a server operator, I want the app to build and run without calling any outside service, API or download, so that it works in an isolated environment.

| ID | Given | When | Then |
|---|---|---|---|
| AC-020 | the app's code and its declared dependencies are already available locally | it is built and started on a machine with no outside network access | it starts and every feature works |
| AC-021 | a user browses any page | the browser loads it | all fonts, scripts, styles and images are served by the app itself, with no requests to other web addresses |
| AC-022 | the app is running | it is used for search, similarity, likes and upload | it makes no outgoing calls to movie APIs, email services, third-party login or AI/LLM services |

### US-007: Single deployable app with embedded database

**Priority:** medium

> As a server operator, I want the app to run as one deployable web app using an embedded SQLite database, so that installation needs no separate database server.

| ID | Given | When | Then |
|---|---|---|---|
| AC-023 | the setup documentation is followed | I start the app | it runs without any separate database or other service being installed |
| AC-024 | the app is restarted | I log in again | accounts, likes and uploaded movies are still present |

## EPIC-003: Movie search and detail

Viewers find movies by title and open a detail page. Placeholder artwork is generated by the app instead of posters; no poster images are used.

### US-008: Search movies by title

**Priority:** critical

> As a viewer, I want to search for a movie by title, so that I can find one I liked and see similar movies.

| ID | Given | When | Then |
|---|---|---|---|
| AC-025 | the catalog contains a movie titled "Heat" | I search for "heat" in any letter case | the results include that movie |
| AC-026 | I search for part of a title | I submit the search | all movies whose titles contain that text are listed, with title and year |
| AC-027 | no movie title matches my search | I submit the search | I see a "no movies found" message |
| AC-028 | I am not signed in | I search | I am asked to log in, since all movie browsing is for signed-in users (assumption: browsing is not public) |

### US-009: Movie detail page

**Priority:** high

> As a viewer, I want to open a movie's detail page, so that I can read about it, like it and see similar movies.

| ID | Given | When | Then |
|---|---|---|---|
| AC-029 | I select a movie from results or lists | its detail page opens | I see title, year, genres, director, cast and plot, and a like/unlike control showing my current state |
| AC-030 | the detail page is shown | I look for artwork | a placeholder image generated by the app is shown, with no poster fetched from outside and no poster upload |
| AC-031 | I request a movie that does not exist | the page loads | I see a not-found message |

### US-010: Generated placeholder artwork

**Priority:** low

> As a viewer, I want each movie to show generated placeholder artwork, so that lists look complete without poster images.

| ID | Given | When | Then |
|---|---|---|---|
| AC-032 | any movie is shown in results, lists or detail | the page renders | a placeholder (for example based on the title and a colour) is displayed, produced by the app itself |
| AC-033 | the same movie is shown on different pages or visits | the placeholder renders | it looks the same each time |

## EPIC-004: Similar movies by cosine similarity

Similarity uses TF-IDF vectors over plot, genres, director and cast, with cosine similarity implemented in our own code and computed in memory on the app server (catalog up to about 5,000 movies). No external library service, API or AI/LLM is used.

### US-011: See similar movies ranked by similarity

**Priority:** critical

> As a viewer, I want to see movies similar to one I picked, ranked by similarity, so that I can discover what to watch next.

| ID | Given | When | Then |
|---|---|---|---|
| AC-034 | I open a movie's detail page | the similar movies section loads | it lists other movies ordered from highest to lowest cosine similarity score, up to a fixed number (default 10) |
| AC-035 | the similar list is shown | I check it | the selected movie itself is not in the list |
| AC-036 | two movies share director, genres and cast with the selected movie while a third shares none | the similar list is built | the movies with more shared attributes rank above the one with none |
| AC-037 | the same catalog and the same movie | the list is requested repeatedly | the order is identical each time, with ties broken consistently |
| AC-038 | a catalog of 5,000 movies | I request similar movies | the list is returned within 2 seconds under normal use by a few hundred users |

### US-012: Similarity computed in-house

**Priority:** high

> As a product owner, I want TF-IDF vectorisation and cosine similarity coded in the project, so that the app needs no outside service.

| ID | Given | When | Then |
|---|---|---|---|
| AC-039 | the movie text fields plot, genres, director and cast | similarity is computed | all four contribute to each movie's TF-IDF vector |
| AC-040 | known test movies with hand-calculated expected scores | the similarity code runs | the scores match the expected values within a small tolerance and lie between 0 and 1 |
| AC-041 | a movie with an empty field such as no plot | similarity is computed | no error occurs and the movie is still scored using its remaining fields |

## EPIC-005: Likes and For you list

Viewers like and unlike movies; likes are saved to the account. The For you list is built from all of a viewer's likes.

### US-013: Like and unlike movies

**Priority:** critical

> As a viewer, I want to like and unlike movies, so that my taste is saved to my account.

| ID | Given | When | Then |
|---|---|---|---|
| AC-042 | I am signed in and have not liked a movie | I press like | the like is saved to my account and the control shows it as liked |
| AC-043 | I have liked a movie | I press unlike | the like is removed and the control shows it as not liked |
| AC-044 | I liked a movie | I log out and log in again, including on another device | the movie is still shown as liked |
| AC-045 | I like a movie I already like, such as with a double click or repeated request | the request is processed | only one like exists |
| AC-046 | another viewer has liked movies | I view my likes | I see only my own |

### US-014: For you list from all likes

**Priority:** critical

> As a viewer, I want a For you list built from everything I have liked, so that I get personal suggestions.

| ID | Given | When | Then |
|---|---|---|---|
| AC-047 | I have liked one or more movies | I open the For you home page | I see movies ranked by their combined cosine similarity to all my liked movies, highest first |
| AC-048 | I have liked several movies | the list is built | every liked movie contributes, not just the most recent |
| AC-049 | I have liked movies | the For you list is shown | none of the movies I have already liked appear in it |
| AC-050 | I like or unlike a movie | I next open the For you list | it reflects the change |

### US-015: Prompt when there are no likes

**Priority:** high

> As a viewer with no likes, I want to be asked to like some movies, so that I know how to get recommendations.

| ID | Given | When | Then |
|---|---|---|---|
| AC-051 | I am signed in with no likes | I open For you | I see a message asking me to like some movies, with a way to search or browse for movies, and no recommendations list |
| AC-052 | that message is shown | I like my first movie and return to For you | the prompt is replaced by recommendations |

## EPIC-006: Admin CSV movie upload

Only admins can add movies, by uploading a CSV file. Admins can only upload; there is no per-movie editing or deleting. Assumptions surfaced: CSV columns are title, year, genres, director, cast and plot, with '|' separating multiple genres or cast members; a row duplicating an existing title and year is skipped (the exact choice of skip or update is to be confirmed; this draft skips); invalid rows are reported with row numbers; similarity is recomputed after upload.

### US-016: Upload movies from a CSV file

**Priority:** high

> As a admin, I want to upload a CSV file of movies, so that the catalog grows beyond the sample.

| ID | Given | When | Then |
|---|---|---|---|
| AC-053 | I am signed in as admin | I upload a CSV with the header title, year, genres, director, cast, plot and valid rows | each valid row is added as a movie, with '\|' splitting genres and cast into separate values |
| AC-054 | the upload finishes | I view the result | I see how many rows were added, skipped and rejected |
| AC-055 | movies were added | the upload completes | similarity includes the new movies, so they appear in search, similar lists and For you without a restart |
| AC-056 | the file is not a CSV or lacks required columns | I upload it | it is rejected with a message and nothing is added |
| AC-057 | I am a viewer or not signed in | I try to open the upload page or send an upload | access is denied and the catalog is unchanged |

### US-017: Validate rows and handle duplicates

**Priority:** high

> As a admin, I want invalid rows reported with row numbers and duplicates handled predictably, so that I can fix my file and avoid duplicate movies.

| ID | Given | When | Then |
|---|---|---|---|
| AC-058 | a CSV where some rows have an empty title, a non-numeric or implausible year, or an empty plot | I upload it | those rows are not added, valid rows are added, and each invalid row is listed with its row number and reason |
| AC-059 | a row has the same title and year as an existing movie (compared ignoring letter case) | I upload it | no duplicate is created and the row is reported as skipped (assumption: skip rather than update) |
| AC-060 | the same title and year appear twice in one file | I upload it | only the first is added and the second is reported as a duplicate |
| AC-061 | a movie was added by upload | I look for edit or delete options | none exist; admins can only upload |

## EPIC-007: Setup and usage documentation

Basic documentation shipped with the app, in English.

### US-018: Setup and usage guide

**Priority:** medium

> As a person installing or using the app, I want short setup and usage documentation, so that I can install, configure and use WatchNext.

| ID | Given | When | Then |
|---|---|---|---|
| AC-062 | I have the project files | I read the documentation | it explains installing, starting the app, and setting the first-admin and session configuration variables |
| AC-063 | I read the documentation | I look for the CSV format | it lists the columns title, year, genres, director, cast and plot, the '\|' separator and an example file |
| AC-064 | I read the documentation | I look for limits | it states that there is no password reset or email verification, that the app needs no outside services, and the expected scale of about 5,000 movies |
<!-- sdlc:auto:end epics -->
