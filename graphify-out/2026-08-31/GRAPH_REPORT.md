# Graph Report - wellness  (2026-08-31)

## Corpus Check
- 96 files · ~74,836 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 550 nodes · 1211 edges · 25 communities (21 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `05e60167`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- compassService.ts
- devDependencies
- firestoreService.ts
- types.ts
- WearableService
- dependencies
- «Внутренний Компас» — защита проекта перед экспертами
- DashboardScreen.tsx
- NotificationsScreen.tsx
- compilerOptions
- DailyRitual.tsx
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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 42 edges
2. `CompassService` - 27 edges
3. `WearableService` - 19 edges
4. `EmotionKey` - 17 edges
5. `NotificationsScreen()` - 16 edges
6. `compilerOptions` - 16 edges
7. `MyTrackerService` - 15 edges
8. `EmotionalGraphEntry` - 15 edges
9. `PlutchikVector` - 14 edges
10. `«Внутренний Компас» — защита проекта перед экспертами` - 14 edges

## Surprising Connections (you probably didn't know these)
- `CartIcon()` --calls--> `useCart()`  [EXTRACTED]
  screens/DashboardScreen.tsx → context/CartContext.tsx
- `RequireOnboarding()` --calls--> `hasPlutchikProfile()`  [EXTRACTED]
  App.tsx → services/firestoreService.ts
- `AppRoutes()` --calls--> `useAuth()`  [EXTRACTED]
  App.tsx → context/AuthContext.tsx
- `DailyRitual()` --calls--> `useAuth()`  [EXTRACTED]
  components/DailyRitual.tsx → context/AuthContext.tsx
- `DailyRitual()` --calls--> `getUserOils()`  [EXTRACTED]
  components/DailyRitual.tsx → services/firestoreService.ts

## Import Cycles
- None detected.

## Communities (25 total, 4 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (35): AppRoutes(), RequireOnboarding(), BottomNavBar(), NavItemProps, AuthContext, AuthContextType, AuthProvider(), useAuth() (+27 more)

### Community 1 - "compassService.ts"
Cohesion: 0.07
Nodes (35): findOilByName(), defaultAromaReason(), defaultInsight(), defaultTomorrowTeaser(), OilSelection, parseLooseJson(), selectOilWithLLM(), startServer() (+27 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (42): @capacitor/assets, @capacitor/cli, esbuild, author, description, devDependencies, @capacitor/assets, @capacitor/cli (+34 more)

### Community 3 - "firestoreService.ts"
Cohesion: 0.13
Nodes (37): TELEGRAM_USERNAME, CartContext, CartContextType, useCart(), OILS_CATALOG, db, AdminOilsScreen(), CabinetScreen() (+29 more)

### Community 4 - "types.ts"
Cohesion: 0.08
Nodes (37): EMOTIONS, PlutchikWheel(), PlutchikWheelProps, OIL_DATABASE, STATUS_COLORS, STATUS_LABELS, chronotypeForHour(), DEFAULT_CONFIG (+29 more)

### Community 5 - "WearableService"
Cohesion: 0.10
Nodes (14): AromaBreathingModal(), AromaBreathingModalProps, parsePattern(), Phase, WearableWidgetProps, AromaBioRecommendation, BioImpactRecord, BiometricsData (+6 more)

### Community 6 - "dependencies"
Cohesion: 0.06
Nodes (35): @capacitor/android, @capacitor/app, @capacitor/browser, @capacitor/core, @capacitor/ios, @capacitor/local-notifications, @capgo/capacitor-updater, cors (+27 more)

### Community 7 - "«Внутренний Компас» — защита проекта перед экспертами"
Cohesion: 0.08
Nodes (24): 0. Резюме (elevator pitch), 10. Качество и сопровождение, 11. Статус реализации (честная карта), 12. Честные ограничения (называем сами, до вопросов), 1. Проблема и решение, 2. Научно-методологическая база, 3.1 Онбординг и калибровка, 3.2 Дашборд «Сегодня» (точка входа в привычку) (+16 more)

### Community 8 - "DashboardScreen.tsx"
Cohesion: 0.08
Nodes (35): EmotionSymbol(), EmotionSymbolProps, FeatureLock(), FeatureLockProps, EmotionMeta, EMOTIONS, QUIZ_QUESTIONS, METAPHORIC_CARDS (+27 more)

### Community 9 - "NotificationsScreen.tsx"
Cohesion: 0.21
Nodes (18): pad2(), TimeWheelPicker(), TimeWheelPickerProps, WheelColumnProps, WheelItem, NotificationsScreen(), RitualSetupScreen(), cancelDailyReminder() (+10 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 11 - "DailyRitual.tsx"
Cohesion: 0.13
Nodes (19): DailyRitual(), FEEDBACK_OPTIONS, QUICK_OPTIONS, CRISIS_RESOURCES, CrisisResource, GROUNDING_EXERCISES, GroundingExercise, findOilById() (+11 more)

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

## Knowledge Gaps
- **170 isolated node(s):** `config`, `AromaBreathingModalProps`, `Phase`, `NavItemProps`, `BreathingCircleProps` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BottomNavBar()` connect `App.tsx` to `DailyRitual.tsx`, `DashboardScreen.tsx`, `firestoreService.ts`, `WearableService`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `CompassService` connect `compassService.ts` to `App.tsx`, `DashboardScreen.tsx`, `DailyRitual.tsx`, `NotificationsScreen.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `config`, `AromaBreathingModalProps`, `Phase` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07910014513788098 - nodes in this community are weakly interconnected._
- **Should `compassService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07115384615384615 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `firestoreService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12684989429175475 - nodes in this community are weakly interconnected._