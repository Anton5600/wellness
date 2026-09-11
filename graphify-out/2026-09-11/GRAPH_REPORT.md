# Graph Report - wellness  (2026-09-10)

## Corpus Check
- 157 files · ~109,439 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 863 nodes · 2186 edges · 43 communities (34 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `09b77149`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AdminOrdersScreen.tsx
- compassService.ts
- devDependencies
- QuizResultScreen.tsx
- types.ts
- WearableService
- dependencies
- «Внутренний Компас» — защита проекта перед экспертами
- DashboardScreen.tsx
- aromaRecommendationService.ts
- compilerOptions
- EmotionKey
- ruStoreUpdate.ts
- MyTrackerService
- Интеграция автообновлений Capgo (Capacitor Updater)
- Как опубликовать приложение в Apple App Store
- Как опубликовать приложение в RuStore
- OperationType
- BreathingCircle.tsx
- Run and deploy your AI Studio app
- capacitor.config.ts
- CLAUDE.md
- DailyRitual.tsx
- practices/index.ts
- inference.ts
- firestoreService.ts
- App.tsx
- BottomNavBar.tsx
- patternMemory.ts
- devBridgeOverride.ts
- AuthContext.tsx
- EntryBridgeScreen.tsx
- diag_now.mjs
- diag_users.mjs
- diag_lastsignin.mjs
- diag_auth.mjs
- diag_check.mjs
- diag_graph_full.mjs
- diag_profile_full.mjs
- diag_readrules.mjs

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 48 edges
2. `CompassService` - 43 edges
3. `EmotionKey` - 36 edges
4. `DailyRitual()` - 22 edges
5. `EmotionalGraphEntry` - 21 edges
6. `WearableService` - 19 edges
7. `PlutchikVector` - 19 edges
8. `PracticeId` - 19 edges
9. `usePracticeTimer()` - 17 edges
10. `startServer()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `PatternCardProps` --references--> `TimeOfDayPattern`  [EXTRACTED]
  components/PatternCard.tsx → services/recommendation/pattern.ts
- `EmotionMeta` --references--> `EmotionKey`  [EXTRACTED]
  components/PlutchikWheel.tsx → types.ts
- `CartIcon()` --calls--> `useCart()`  [EXTRACTED]
  screens/DashboardScreen.tsx → context/CartContext.tsx
- `OilSelection` --references--> `EmotionKey`  [EXTRACTED]
  server.ts → types.ts
- `AromaRecommendation` --references--> `EmotionKey`  [EXTRACTED]
  services/aromaRecommendationService.ts → types.ts

## Import Cycles
- None detected.

## Communities (43 total, 9 thin omitted)

### Community 0 - "AdminOrdersScreen.tsx"
Cohesion: 0.16
Nodes (13): app, auth, db, firebaseConfig, AdminOilsScreen(), AdminOrdersScreen(), STATUS_COLORS, STATUS_LABELS (+5 more)

### Community 1 - "compassService.ts"
Cohesion: 0.06
Nodes (32): DevDateTraveller(), shiftDays(), toDateStr(), StreakDayScroller(), THRESHOLD_DAYS, findOilByName(), CompassService, DEFAULT_PLUTCHIK (+24 more)

### Community 2 - "devDependencies"
Cohesion: 0.04
Nodes (44): @capacitor/assets, @capacitor/cli, esbuild, fast-check, author, description, devDependencies, @capacitor/assets (+36 more)

### Community 3 - "QuizResultScreen.tsx"
Cohesion: 0.21
Nodes (16): TELEGRAM_USERNAME, CartContext, CartContextType, CartProvider(), useCart(), CabinetScreen(), CartScreen(), QuizResultScreen() (+8 more)

### Community 4 - "types.ts"
Cohesion: 0.06
Nodes (51): EmotionMeta, EMOTIONS, PlutchikWheel(), PlutchikWheelProps, OIL_DATABASE, EXPECTED_BY_DYAD, OnboardingResultScreen(), dominantEmotionOf() (+43 more)

### Community 5 - "WearableService"
Cohesion: 0.10
Nodes (14): AromaBreathingModal(), AromaBreathingModalProps, parsePattern(), Phase, WearableWidgetProps, AromaBioRecommendation, BioImpactRecord, BiometricsData (+6 more)

### Community 6 - "dependencies"
Cohesion: 0.05
Nodes (41): @capacitor/android, @capacitor/app, @capacitor/browser, @capacitor/core, @capacitor/haptics, @capacitor/ios, @capacitor/local-notifications, @capgo/capacitor-updater (+33 more)

### Community 7 - "«Внутренний Компас» — защита проекта перед экспертами"
Cohesion: 0.08
Nodes (24): 0. Резюме (elevator pitch), 10. Качество и сопровождение, 11. Статус реализации (честная карта), 12. Честные ограничения (называем сами, до вопросов), 1. Проблема и решение, 2. Научно-методологическая база, 3.1 Онбординг и калибровка, 3.2 Дашборд «Сегодня» (точка входа в привычку) (+16 more)

### Community 8 - "DashboardScreen.tsx"
Cohesion: 0.12
Nodes (23): EmotionSymbol(), EmotionSymbolProps, FeatureLock(), FeatureLockProps, EMOTIONS, METAPHORIC_CARDS, MetaphoricCard, getQuoteForDay() (+15 more)

### Community 9 - "aromaRecommendationService.ts"
Cohesion: 0.10
Nodes (30): pad2(), TimeWheelPicker(), TimeWheelPickerProps, WheelColumnProps, WheelItem, OILS_CATALOG, NotificationsScreen(), RitualSetupScreen() (+22 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 11 - "EmotionKey"
Cohesion: 0.09
Nodes (35): Phase, PracticePlayerProps, PRACTICE_COMPONENTS, PulseCheckInProps, PulseResult, MANTRAS, PRACTICE_BY_ID, PracticeDefinition (+27 more)

### Community 12 - "ruStoreUpdate.ts"
Cohesion: 0.12
Nodes (7): App(), root, rootElement, CapgoUpdateInfo, AppUpdateInfo, RuStoreAppUpdate, RuStoreAppUpdatePlugin

### Community 13 - "MyTrackerService"
Cohesion: 0.22
Nodes (4): privacyPolicyText, termsOfServiceText, LegalScreen(), MyTrackerService

### Community 14 - "Интеграция автообновлений Capgo (Capacitor Updater)"
Cohesion: 0.18
Nodes (10): 1. Подготовка архива обновлений, 1. Подготовка и вход, 2. Вызов обновления из React, 2. Первая инициализация приложения в облаке, 3. Сборка и отправка обновления, Вариант 1: Использование облака Capgo (Рекомендуется), Вариант 2: Самостоятельный хостинг (Self-Hosting), Интеграция автообновлений Capgo (Capacitor Updater) (+2 more)

### Community 15 - "Как опубликовать приложение в Apple App Store"
Cohesion: 0.25
Nodes (7): Важные нюансы, Как опубликовать приложение в Apple App Store, Шаг 1: Подготовка, Шаг 2: Сборка проекта, Шаг 3: Настройка в Xcode, Шаг 4: Тестирование на iPhone, Шаг 5: Публикация в App Store

### Community 16 - "Как опубликовать приложение в RuStore"
Cohesion: 0.29
Nodes (6): Как опубликовать приложение в RuStore, Полезные советы, Шаг 1: Подготовка на компьютере, Шаг 2: Сборка приложения, Шаг 3: Создание APK/AAB файла, Шаг 4: Публикация в RuStore

### Community 17 - "OperationType"
Cohesion: 0.29
Nodes (7): OperationType, CREATE, DELETE, GET, LIST, UPDATE, WRITE

### Community 25 - "DailyRitual.tsx"
Cohesion: 0.07
Nodes (50): DailyRitual(), findCrossedUnlock(), QUICK_OPTIONS, UNLOCK_FEATURE_LABELS, formatTime(), PatternCard(), PatternCardProps, PracticePlayer() (+42 more)

### Community 26 - "practices/index.ts"
Cohesion: 0.16
Nodes (28): BodyScanPractice(), zoneIndexFor(), ZONES, ExpressiveWritingPractice(), LOCAL_STARTERS, breathPhase(), buildPath(), FingerTracingPractice() (+20 more)

### Community 27 - "inference.ts"
Cohesion: 0.10
Nodes (35): defaultAromaReason(), defaultInsight(), defaultTomorrowTeaser(), ensureAdminAuth(), mintFirebaseCustomToken(), MODE_REASON, modeFor(), OilSelection (+27 more)

### Community 28 - "firestoreService.ts"
Cohesion: 0.16
Nodes (33): checkPlutchikProfile(), getEmotionalGraphEntries(), getEmotionalGraphEntry(), getEmotionHistory(), getLocalHistory(), getPlutchikProfile(), getStreakInfo(), graphKey() (+25 more)

### Community 29 - "App.tsx"
Cohesion: 0.16
Nodes (16): AppRoutes(), RequireNoOnboarding(), RequireOnboarding(), sleep(), usePlutchikProfileGate(), useAuth(), useFirestoreSync(), LockScreen() (+8 more)

### Community 30 - "BottomNavBar.tsx"
Cohesion: 0.17
Nodes (10): BottomNavBar(), NavItemProps, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), HistoryScreen() (+2 more)

### Community 31 - "patternMemory.ts"
Cohesion: 0.24
Nodes (14): AppliedPattern, applyPattern(), dismissPattern(), getPatternMemory(), hasEveningHarderBias(), markPatternSeen(), PatternMemory, readLocal() (+6 more)

### Community 32 - "devBridgeOverride.ts"
Cohesion: 0.25
Nodes (14): DevBridgeTester(), PATTERN_OPTIONS, SCENARIO_LABELS, UNLOCK_OPTIONS, DEV_ENTRY_SCENARIOS, DevEntryScenario, DevPatternOverride, readDevEntryOverride() (+6 more)

### Community 33 - "AuthContext.tsx"
Cohesion: 0.27
Nodes (8): QUIZ_QUESTIONS, AuthContext, AuthContextType, AuthProvider(), QuizQuestionScreen(), deleteAllUserData(), vectorFromAnswers(), User

### Community 34 - "EntryBridgeScreen.tsx"
Cohesion: 0.36
Nodes (5): EntryBridgeScreen(), FEEDBACK_OPTIONS, UNLOCK_PARTICLES, determineEntryScenario(), getGreeting()

### Community 35 - "diag_now.mjs"
Cohesion: 0.40
Nodes (4): auth, db, key, sorted

### Community 36 - "diag_users.mjs"
Cohesion: 0.40
Nodes (4): db, key, ouids, uids

### Community 37 - "diag_lastsignin.mjs"
Cohesion: 0.50
Nodes (3): auth, key, sorted

## Knowledge Gaps
- **224 isolated node(s):** `config`, `AromaBreathingModalProps`, `Phase`, `NavItemProps`, `BreathingCircleProps` (+219 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CompassService` connect `compassService.ts` to `AuthContext.tsx`, `EntryBridgeScreen.tsx`, `types.ts`, `DashboardScreen.tsx`, `aromaRecommendationService.ts`, `EmotionKey`, `DailyRitual.tsx`, `App.tsx`, `BottomNavBar.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `EmotionKey` connect `EmotionKey` to `AuthContext.tsx`, `compassService.ts`, `types.ts`, `DashboardScreen.tsx`, `aromaRecommendationService.ts`, `DailyRitual.tsx`, `practices/index.ts`, `inference.ts`, `firestoreService.ts`, `patternMemory.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `BottomNavBar()` connect `BottomNavBar.tsx` to `QuizResultScreen.tsx`, `types.ts`, `WearableService`, `DashboardScreen.tsx`, `DailyRitual.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `config`, `AromaBreathingModalProps`, `Phase` to the rest of the system?**
  _224 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compassService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06438631790744467 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061815336463223784 - nodes in this community are weakly interconnected._