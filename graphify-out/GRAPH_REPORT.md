# Graph Report - wellness  (2026-08-31)

## Corpus Check
- 114 files · ~81,689 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 636 nodes · 1483 edges · 32 communities (28 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `05e60167`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AuthContext.tsx
- firestoreService.ts
- devDependencies
- QuizResultScreen.tsx
- types.ts
- WearableService
- dependencies
- «Внутренний Компас» — защита проекта перед экспертами
- DashboardScreen.tsx
- NotificationsScreen.tsx
- compilerOptions
- aromaRecommendationService.ts
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
- server.ts
- useAuth
- App.tsx
- BottomNavBar.tsx
- CartContext.tsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 44 edges
2. `CompassService` - 28 edges
3. `EmotionKey` - 24 edges
4. `WearableService` - 19 edges
5. `usePracticeTimer()` - 17 edges
6. `NotificationsScreen()` - 16 edges
7. `compilerOptions` - 16 edges
8. `EmotionalGraphEntry` - 16 edges
9. `MyTrackerService` - 15 edges
10. `PlutchikVector` - 14 edges

## Surprising Connections (you probably didn't know these)
- `AppRoutes()` --calls--> `useAuth()`  [EXTRACTED]
  App.tsx → context/AuthContext.tsx
- `CartIcon()` --calls--> `useCart()`  [EXTRACTED]
  screens/DashboardScreen.tsx → context/CartContext.tsx
- `AromaRecommendation` --references--> `EmotionKey`  [EXTRACTED]
  services/aromaRecommendationService.ts → types.ts
- `RequireOnboarding()` --calls--> `useAuth()`  [EXTRACTED]
  App.tsx → context/AuthContext.tsx
- `RequireOnboarding()` --calls--> `hasPlutchikProfile()`  [EXTRACTED]
  App.tsx → services/firestoreService.ts

## Import Cycles
- None detected.

## Communities (32 total, 4 thin omitted)

### Community 0 - "AuthContext.tsx"
Cohesion: 0.13
Nodes (18): AuthContext, AuthContextType, AuthProvider(), app, auth, db, firebaseConfig, AdminOrdersScreen() (+10 more)

### Community 1 - "firestoreService.ts"
Cohesion: 0.11
Nodes (30): CompassService, DEFAULT_PLUTCHIK, defaultProfile(), defaultStreak(), getEmotionalGraphEntries(), getEmotionalGraphEntry(), getEmotionHistory(), getLocalHistory() (+22 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (42): @capacitor/assets, @capacitor/cli, esbuild, author, description, devDependencies, @capacitor/assets, @capacitor/cli (+34 more)

### Community 3 - "QuizResultScreen.tsx"
Cohesion: 0.23
Nodes (14): TELEGRAM_USERNAME, useCart(), AdminOilsScreen(), CabinetScreen(), CartScreen(), QuizResultScreen(), addUserOil(), getOilsCatalog() (+6 more)

### Community 4 - "types.ts"
Cohesion: 0.07
Nodes (44): EMOTIONS, PlutchikWheel(), PlutchikWheelProps, QUIZ_QUESTIONS, OIL_DATABASE, OnboardingResultScreen(), QuizQuestionScreen(), dominantEmotionOf() (+36 more)

### Community 5 - "WearableService"
Cohesion: 0.10
Nodes (14): AromaBreathingModal(), AromaBreathingModalProps, parsePattern(), Phase, WearableWidgetProps, AromaBioRecommendation, BioImpactRecord, BiometricsData (+6 more)

### Community 6 - "dependencies"
Cohesion: 0.05
Nodes (39): @capacitor/android, @capacitor/app, @capacitor/browser, @capacitor/core, @capacitor/haptics, @capacitor/ios, @capacitor/local-notifications, @capgo/capacitor-updater (+31 more)

### Community 7 - "«Внутренний Компас» — защита проекта перед экспертами"
Cohesion: 0.08
Nodes (24): 0. Резюме (elevator pitch), 10. Качество и сопровождение, 11. Статус реализации (честная карта), 12. Честные ограничения (называем сами, до вопросов), 1. Проблема и решение, 2. Научно-методологическая база, 3.1 Онбординг и калибровка, 3.2 Дашборд «Сегодня» (точка входа в привычку) (+16 more)

### Community 8 - "DashboardScreen.tsx"
Cohesion: 0.20
Nodes (12): EMOTIONS, METAPHORIC_CARDS, MetaphoricCard, getQuoteForDay(), getRandomQuote(), LOCAL_QUOTES, Quote, AdminCardsScreen() (+4 more)

### Community 9 - "NotificationsScreen.tsx"
Cohesion: 0.21
Nodes (18): pad2(), TimeWheelPicker(), TimeWheelPickerProps, WheelColumnProps, WheelItem, NotificationsScreen(), RitualSetupScreen(), cancelDailyReminder() (+10 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 11 - "aromaRecommendationService.ts"
Cohesion: 0.20
Nodes (13): findOilById(), OILS_CATALOG, AromaGoal, AromaRecommendation, checkIsStuck(), EMOTION_PHRASE, getAromaRecommendation(), getLocalAromaRecommendation() (+5 more)

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
Nodes (46): DailyRitual(), FEEDBACK_OPTIONS, QUICK_OPTIONS, EmotionMeta, Phase, PracticePlayer(), PracticePlayerProps, PRACTICE_COMPONENTS (+38 more)

### Community 26 - "practices/index.ts"
Cohesion: 0.15
Nodes (29): BodyScanPractice(), zoneIndexFor(), ZONES, ExpressiveWritingPractice(), LOCAL_STARTERS, breathPhase(), buildPath(), FingerTracingPractice() (+21 more)

### Community 27 - "server.ts"
Cohesion: 0.14
Nodes (23): findOilByName(), defaultAromaReason(), defaultInsight(), defaultTomorrowTeaser(), OilSelection, parseLooseJson(), selectOilWithLLM(), startServer() (+15 more)

### Community 28 - "useAuth"
Cohesion: 0.22
Nodes (11): EmotionSymbol(), EmotionSymbolProps, FeatureLock(), FeatureLockProps, useAuth(), FEATURE_DAYS, FeatureKey, useUnlockedFeatures() (+3 more)

### Community 29 - "App.tsx"
Cohesion: 0.19
Nodes (8): AppRoutes(), RequireOnboarding(), LockScreen(), LockScreenProps, OnboardingScreen(), PracticeScreen(), SecurityScreen(), SignInScreen()

### Community 30 - "BottomNavBar.tsx"
Cohesion: 0.19
Nodes (9): BottomNavBar(), NavItemProps, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), HistoryScreen() (+1 more)

### Community 31 - "CartContext.tsx"
Cohesion: 0.50
Nodes (4): CartContext, CartContextType, CartProvider(), CartItem

## Knowledge Gaps
- **183 isolated node(s):** `config`, `AromaBreathingModalProps`, `Phase`, `NavItemProps`, `BreathingCircleProps` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BottomNavBar()` connect `BottomNavBar.tsx` to `QuizResultScreen.tsx`, `types.ts`, `WearableService`, `DashboardScreen.tsx`, `DailyRitual.tsx`, `useAuth`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `EmotionKey` connect `DailyRitual.tsx` to `firestoreService.ts`, `QuizResultScreen.tsx`, `types.ts`, `aromaRecommendationService.ts`, `practices/index.ts`, `server.ts`, `useAuth`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `config`, `AromaBreathingModalProps`, `Phase` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AuthContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `firestoreService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10980392156862745 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06944444444444445 - nodes in this community are weakly interconnected._