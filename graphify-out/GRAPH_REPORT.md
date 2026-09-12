# Graph Report - wellness  (2026-09-12)

## Corpus Check
- 157 files · ~114,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 871 nodes · 2288 edges · 35 communities (31 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41df0301`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuth
- DevDateTraveller.tsx
- devDependencies
- PullToRefresh.tsx
- types.ts
- WearableService
- dependencies
- «Внутренний Компас» — защита проекта перед экспертами
- DashboardScreen.tsx
- aromaRecommendationService.ts
- compilerOptions
- server.ts
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
- practiceMemory.ts
- AuthContext.tsx
- firestoreService.ts
- App.tsx
- BottomNavBar.tsx
- compassService.ts
- devBridgeOverride.ts
- QuizResultScreen.tsx
- ResourcesScreen.tsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 49 edges
2. `CompassService` - 43 edges
3. `EmotionKey` - 39 edges
4. `DailyRitual()` - 23 edges
5. `EmotionalGraphEntry` - 22 edges
6. `WearableService` - 19 edges
7. `PlutchikVector` - 19 edges
8. `PracticeId` - 19 edges
9. `startServer()` - 18 edges
10. `usePracticeTimer()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `EmotionMeta` --references--> `EmotionKey`  [EXTRACTED]
  components/PlutchikWheel.tsx → types.ts
- `OilSelection` --references--> `EmotionKey`  [EXTRACTED]
  server.ts → types.ts
- `AromaRecommendation` --references--> `EmotionKey`  [EXTRACTED]
  services/aromaRecommendationService.ts → types.ts
- `usePlutchikProfileGate()` --calls--> `useAuth()`  [EXTRACTED]
  App.tsx → context/AuthContext.tsx
- `usePlutchikProfileGate()` --calls--> `checkPlutchikProfile()`  [EXTRACTED]
  App.tsx → services/firestoreService.ts

## Import Cycles
- None detected.

## Communities (35 total, 4 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.38
Nodes (6): useAuth(), SecurityScreen(), SignInScreen(), VerifyEmailScreen(), AUTH_ERROR_MESSAGES, friendlyAuthError()

### Community 1 - "DevDateTraveller.tsx"
Cohesion: 0.57
Nodes (5): DevDateTraveller(), shiftDays(), toDateStr(), readDevDateOverride(), setDevDateOverride()

### Community 2 - "devDependencies"
Cohesion: 0.04
Nodes (44): @capacitor/assets, @capacitor/cli, esbuild, fast-check, author, description, devDependencies, @capacitor/assets (+36 more)

### Community 3 - "PullToRefresh.tsx"
Cohesion: 0.30
Nodes (12): findScroller(), isAtTop(), PullToRefresh(), PullToRefreshProps, ENGAGE_AT, isRefreshTriggered(), MAX_PULL, PULL_RESISTANCE (+4 more)

### Community 4 - "types.ts"
Cohesion: 0.06
Nodes (49): EmotionMeta, EMOTIONS, PlutchikWheel(), PlutchikWheelProps, QUIZ_QUESTIONS, OIL_DATABASE, EXPECTED_BY_DYAD, OnboardingResultScreen() (+41 more)

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
Cohesion: 0.11
Nodes (23): EmotionSymbol(), EmotionSymbolProps, FeatureLock(), FeatureLockProps, EMOTIONS, METAPHORIC_CARDS, MetaphoricCard, getQuoteForDay() (+15 more)

### Community 9 - "aromaRecommendationService.ts"
Cohesion: 0.10
Nodes (30): pad2(), TimeWheelPicker(), TimeWheelPickerProps, WheelColumnProps, WheelItem, OILS_CATALOG, NotificationsScreen(), RitualSetupScreen() (+22 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 11 - "server.ts"
Cohesion: 0.08
Nodes (46): EMOTION_OILS, EmotionOilBinding, oilsForEmotion(), primaryOilFor(), EMOTIONS, findOilByName(), emotionalReasonFor(), OIL_EMOTIONAL_REASONS (+38 more)

### Community 12 - "ruStoreUpdate.ts"
Cohesion: 0.25
Nodes (3): AppUpdateInfo, RuStoreAppUpdate, RuStoreAppUpdatePlugin

### Community 13 - "MyTrackerService"
Cohesion: 0.19
Nodes (5): privacyPolicyText, termsOfServiceText, LegalScreen(), MyTrackerService, Window

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
Cohesion: 0.06
Nodes (64): DailyRitual(), findCrossedUnlock(), QUICK_OPTIONS, UNLOCK_FEATURE_LABELS, Phase, PracticePlayerProps, PRACTICE_COMPONENTS, CARE_OPTIONS (+56 more)

### Community 26 - "practiceMemory.ts"
Cohesion: 0.10
Nodes (45): PracticePlayer(), BodyScanPractice(), zoneIndexFor(), ZONES, ExpressiveWritingPractice(), LOCAL_STARTERS, breathPhase(), buildPath() (+37 more)

### Community 27 - "AuthContext.tsx"
Cohesion: 0.12
Nodes (24): TELEGRAM_USERNAME, AuthContext, AuthContextType, AuthProvider(), app, auth, db, firebaseConfig (+16 more)

### Community 28 - "firestoreService.ts"
Cohesion: 0.17
Nodes (34): checkPlutchikProfile(), getEmotionalGraphEntries(), getEmotionalGraphEntry(), getEmotionHistory(), getLocalHistory(), getPlutchikProfile(), getStreakInfo(), graphKey() (+26 more)

### Community 29 - "App.tsx"
Cohesion: 0.11
Nodes (17): App(), AppRoutes(), AppShell(), ProfileGateState, RequireNoOnboarding(), RequireOnboarding(), sleep(), usePlutchikProfileGate() (+9 more)

### Community 30 - "BottomNavBar.tsx"
Cohesion: 0.19
Nodes (9): BottomNavBar(), NavItemProps, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), CheckInScreen() (+1 more)

### Community 31 - "compassService.ts"
Cohesion: 0.06
Nodes (38): formatTime(), PatternCard(), PatternCardProps, StreakDayScroller(), THRESHOLD_DAYS, CompassService, DEFAULT_PLUTCHIK, defaultProfile() (+30 more)

### Community 32 - "devBridgeOverride.ts"
Cohesion: 0.12
Nodes (25): DevBridgeTester(), PATTERN_OPTIONS, SCENARIO_LABELS, UNLOCK_OPTIONS, EntryBridgeScreen(), FEEDBACK_OPTIONS, UNLOCK_PARTICLES, buildDevEntryContext() (+17 more)

### Community 35 - "QuizResultScreen.tsx"
Cohesion: 0.26
Nodes (12): CartContext, CartContextType, CartProvider(), useCart(), CabinetScreen(), CartIcon(), QuizResultScreen(), addUserOil() (+4 more)

### Community 37 - "ResourcesScreen.tsx"
Cohesion: 0.38
Nodes (5): CRISIS_RESOURCES, CrisisResource, GROUNDING_EXERCISES, GroundingExercise, ResourcesScreen()

## Knowledge Gaps
- **210 isolated node(s):** `ProfileGateState`, `config`, `AromaBreathingModalProps`, `Phase`, `NavItemProps` (+205 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CompassService` connect `compassService.ts` to `devBridgeOverride.ts`, `types.ts`, `DashboardScreen.tsx`, `aromaRecommendationService.ts`, `DailyRitual.tsx`, `App.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `EmotionKey` connect `DailyRitual.tsx` to `types.ts`, `DashboardScreen.tsx`, `aromaRecommendationService.ts`, `server.ts`, `practiceMemory.ts`, `firestoreService.ts`, `compassService.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `BottomNavBar()` connect `BottomNavBar.tsx` to `QuizResultScreen.tsx`, `types.ts`, `WearableService`, `ResourcesScreen.tsx`, `DashboardScreen.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `ProfileGateState`, `config`, `AromaBreathingModalProps` to the rest of the system?**
  _210 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062206572769953054 - nodes in this community are weakly interconnected._
- **Should `WearableService` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._