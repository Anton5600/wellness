# Graph Report - wellness  (2026-09-11)

## Corpus Check
- 153 files · ~110,501 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 856 nodes · 2232 edges · 39 communities (35 shown, 4 thin omitted)
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
- shortlist.ts
- WearableService
- dependencies
- «Внутренний Компас» — защита проекта перед экспертами
- ProgressScreen.tsx
- aromaRecommendationService.ts
- compilerOptions
- inference.ts
- ruStoreUpdate.ts
- MyTrackerService
- Интеграция автообновлений Capgo (Capacitor Updater)
- Как опубликовать приложение в Apple App Store
- Как опубликовать приложение в RuStore
- AdminScreen.tsx
- BreathingCircle.tsx
- Run and deploy your AI Studio app
- capacitor.config.ts
- CLAUDE.md
- EmotionKey
- practices/index.ts
- types.ts
- firestoreService.ts
- App.tsx
- ProfileScreen.tsx
- compassService.ts
- DailyRitual.tsx
- PlutchikVector
- constants.ts
- DashboardScreen.tsx
- breathing.ts
- BottomNavBar.tsx
- color.ts

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 49 edges
2. `CompassService` - 43 edges
3. `EmotionKey` - 36 edges
4. `DailyRitual()` - 22 edges
5. `EmotionalGraphEntry` - 22 edges
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
- `AromaRecommendation` --references--> `EmotionKey`  [EXTRACTED]
  services/aromaRecommendationService.ts → types.ts
- `usePlutchikProfileGate()` --calls--> `useAuth()`  [EXTRACTED]
  App.tsx → context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (39 total, 4 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.23
Nodes (11): AppRoutes(), AppShell(), useAuth(), SYNC_EVENT, syncNow(), useFirestoreSync(), SecurityScreen(), SignInScreen() (+3 more)

### Community 1 - "DevDateTraveller.tsx"
Cohesion: 0.57
Nodes (5): DevDateTraveller(), shiftDays(), toDateStr(), readDevDateOverride(), setDevDateOverride()

### Community 2 - "devDependencies"
Cohesion: 0.04
Nodes (44): @capacitor/assets, @capacitor/cli, esbuild, fast-check, author, description, devDependencies, @capacitor/assets (+36 more)

### Community 3 - "PullToRefresh.tsx"
Cohesion: 0.30
Nodes (12): findScroller(), isAtTop(), PullToRefresh(), PullToRefreshProps, ENGAGE_AT, isRefreshTriggered(), MAX_PULL, PULL_RESISTANCE (+4 more)

### Community 4 - "shortlist.ts"
Cohesion: 0.15
Nodes (19): chronotypeForHour(), DEFAULT_CONFIG, RecommendationConfig, bannedOilIds(), EveningFeedbackEntry, now, candidateShortlist(), CandidateShortlistInput (+11 more)

### Community 5 - "WearableService"
Cohesion: 0.10
Nodes (14): AromaBreathingModal(), AromaBreathingModalProps, parsePattern(), Phase, WearableWidgetProps, AromaBioRecommendation, BioImpactRecord, BiometricsData (+6 more)

### Community 6 - "dependencies"
Cohesion: 0.05
Nodes (41): @capacitor/android, @capacitor/app, @capacitor/browser, @capacitor/core, @capacitor/haptics, @capacitor/ios, @capacitor/local-notifications, @capgo/capacitor-updater (+33 more)

### Community 7 - "«Внутренний Компас» — защита проекта перед экспертами"
Cohesion: 0.08
Nodes (24): 0. Резюме (elevator pitch), 10. Качество и сопровождение, 11. Статус реализации (честная карта), 12. Честные ограничения (называем сами, до вопросов), 1. Проблема и решение, 2. Научно-методологическая база, 3.1 Онбординг и калибровка, 3.2 Дашборд «Сегодня» (точка входа в привычку) (+16 more)

### Community 8 - "ProgressScreen.tsx"
Cohesion: 0.21
Nodes (10): EmotionSymbol(), EmotionSymbolProps, FeatureLock(), FeatureLockProps, FEATURE_DAYS, FeatureKey, useUnlockedFeatures(), ProgressScreen() (+2 more)

### Community 9 - "aromaRecommendationService.ts"
Cohesion: 0.11
Nodes (30): pad2(), TimeWheelPicker(), TimeWheelPickerProps, WheelColumnProps, WheelItem, findOilById(), NotificationsScreen(), RitualSetupScreen() (+22 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 11 - "inference.ts"
Cohesion: 0.18
Nodes (24): findOilByName(), defaultAromaReason(), defaultInsight(), defaultTomorrowTeaser(), ensureAdminAuth(), mintFirebaseCustomToken(), MODE_REASON, modeFor() (+16 more)

### Community 12 - "ruStoreUpdate.ts"
Cohesion: 0.25
Nodes (3): AppUpdateInfo, RuStoreAppUpdate, RuStoreAppUpdatePlugin

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

### Community 17 - "AdminScreen.tsx"
Cohesion: 0.18
Nodes (11): AdminScreen(), AdminStats, FirestoreErrorInfo, handleFirestoreError(), OperationType, CREATE, DELETE, GET (+3 more)

### Community 25 - "EmotionKey"
Cohesion: 0.07
Nodes (54): Phase, PracticePlayer(), PracticePlayerProps, PRACTICE_COMPONENTS, CARE_OPTIONS, PulseCheckIn(), PulseResult, QUICK_OPTIONS (+46 more)

### Community 26 - "practices/index.ts"
Cohesion: 0.16
Nodes (28): BodyScanPractice(), zoneIndexFor(), ZONES, ExpressiveWritingPractice(), LOCAL_STARTERS, breathPhase(), buildPath(), FingerTracingPractice() (+20 more)

### Community 27 - "types.ts"
Cohesion: 0.13
Nodes (17): OIL_DATABASE, EXPECTED_BY_DYAD, parseDyad(), dyadFor(), DYADS, isAdjacent(), circle, crescent (+9 more)

### Community 28 - "firestoreService.ts"
Cohesion: 0.07
Nodes (66): TELEGRAM_USERNAME, AuthContext, AuthContextType, AuthProvider(), CartContext, CartContextType, useCart(), OILS_CATALOG (+58 more)

### Community 29 - "App.tsx"
Cohesion: 0.11
Nodes (13): App(), ProfileGateState, RequireNoOnboarding(), RequireOnboarding(), sleep(), usePlutchikProfileGate(), CartProvider(), root (+5 more)

### Community 30 - "ProfileScreen.tsx"
Cohesion: 0.32
Nodes (6): Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), ProfileScreen()

### Community 31 - "compassService.ts"
Cohesion: 0.05
Nodes (45): PulseCheckInProps, StreakDayScroller(), THRESHOLD_DAYS, CompassService, DEFAULT_PLUTCHIK, defaultProfile(), defaultStreak(), buildDevEntryContext() (+37 more)

### Community 32 - "DailyRitual.tsx"
Cohesion: 0.06
Nodes (44): DailyRitual(), findCrossedUnlock(), QUICK_OPTIONS, UNLOCK_FEATURE_LABELS, DevBridgeTester(), PATTERN_OPTIONS, SCENARIO_LABELS, UNLOCK_OPTIONS (+36 more)

### Community 33 - "PlutchikVector"
Cohesion: 0.21
Nodes (11): EmotionMeta, EMOTIONS, PlutchikWheel(), PlutchikWheelProps, OnboardingResultScreen(), dominantEmotionOf(), EMOTION_KEYS, ALL_EMOTIONS (+3 more)

### Community 34 - "constants.ts"
Cohesion: 0.27
Nodes (7): EMOTIONS, QUIZ_QUESTIONS, HistoryScreen(), QuizQuestionScreen(), vectorFromAnswers(), EmotionData, QuizQuestion

### Community 35 - "DashboardScreen.tsx"
Cohesion: 0.21
Nodes (11): METAPHORIC_CARDS, MetaphoricCard, getQuoteForDay(), getRandomQuote(), LOCAL_QUOTES, Quote, AdminCardsScreen(), CartIcon() (+3 more)

### Community 36 - "breathing.ts"
Cohesion: 0.60
Nodes (4): breathingPatternFor(), parseBreathPattern(), PATTERN_DEFAULT, PATTERN_STUCK

### Community 37 - "BottomNavBar.tsx"
Cohesion: 0.21
Nodes (8): BottomNavBar(), NavItemProps, CRISIS_RESOURCES, CrisisResource, GROUNDING_EXERCISES, GroundingExercise, CheckInScreen(), ResourcesScreen()

### Community 38 - "color.ts"
Cohesion: 0.46
Nodes (5): colorForDominant(), colorForDyad(), EMOTION_HEX, hexToRgb(), isValidHexColor()

## Knowledge Gaps
- **206 isolated node(s):** `ProfileGateState`, `config`, `AromaBreathingModalProps`, `Phase`, `NavItemProps` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CompassService` connect `compassService.ts` to `DailyRitual.tsx`, `PlutchikVector`, `constants.ts`, `DashboardScreen.tsx`, `color.ts`, `ProgressScreen.tsx`, `aromaRecommendationService.ts`, `EmotionKey`, `App.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `EmotionKey` connect `EmotionKey` to `PlutchikVector`, `constants.ts`, `shortlist.ts`, `color.ts`, `ProgressScreen.tsx`, `aromaRecommendationService.ts`, `inference.ts`, `practices/index.ts`, `types.ts`, `firestoreService.ts`, `compassService.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `BottomNavBar()` connect `BottomNavBar.tsx` to `PlutchikVector`, `constants.ts`, `DashboardScreen.tsx`, `WearableService`, `ProgressScreen.tsx`, `firestoreService.ts`, `ProfileScreen.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `ProfileGateState`, `config`, `AromaBreathingModalProps` to the rest of the system?**
  _206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `WearableService` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._