# JLPT Level Up - Starter Architecture

## Week 1 goal

Build the single-player shell first:

- Landing page
- Login placeholder
- Main map with JLPT islands
- Island detail page
- Local progress store
- Unlock flow from N5 to N4

## Recommended stack

- Vue 3
- Vite
- Vue Router
- Pinia
- LocalStorage for offline progress

## Folder structure

```text
src/
  components/
    AppShell.vue
    IslandNode.vue
  data/
    levels.js
  router/
    index.js
  stores/
    progress.js
  views/
    LandingView.vue
    LoginView.vue
    MapView.vue
    IslandView.vue
    ProfileView.vue
    NotFoundView.vue
  App.vue
  main.js
  styles.css
```

## Why this architecture

### 1. Keep game content separate from UI

`src/data/levels.js` stores level metadata, island categories, and starter progress.

That means later you can:

- move quiz data into JSON or database
- add N4, N3, N2, N1 content without changing layout code
- reuse the same structure for PvP matchmaking buckets

### 2. Treat the map as the main hub

`MapView.vue` is the central single-player screen:

- select island
- see progress
- open island detail
- preview unlock state

This matches your mockup and keeps the experience game-first instead of menu-first.

### 3. Put progression rules in one store

`src/stores/progress.js` handles:

- selected island
- unlocked levels
- completed levels
- category completion
- unlocking next island

This keeps future quiz pages thin. The quiz page only needs to say:

`completeCategory(levelId, categoryId, score)`

### 4. Build for PvP later without blocking now

This structure is ready for a future split:

- `content domain`: levels, categories, question banks
- `player domain`: profile, progress, rank
- `battle domain`: matchmaking, HP, timer, answer race

For now we only implement `content + player progression`.

## Week 1 implementation order

1. Finish the shell and map interactions.
2. Add one real N5 quiz page for `moji-goi`.
3. Save quiz result locally.
4. Connect island completion to unlock N4.

## Week 2 suggestion

After this starter is stable, add:

- `QuizView.vue`
- reusable `QuestionCard.vue`
- question bank in `src/data/quizzes/n5-moji-goi.js`
- result screen
- score calculation

## Important product rule

Do not build all categories at once.

Start with:

- N5 only
- Moji Goi only
- around 10 questions
- end-of-quiz result
- unlock logic proof

Once that feels fun, scale outward.
