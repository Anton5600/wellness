import { OilEntry } from '../types';

/**
 * Единая база масел — источник правды для движка рекомендации (правила → DeepSeek).
 *
 * В отличие от OILS_CATALOG (коммерческий каталог) и EMOTIONS[].oils (статические
 * подсказки квиза), здесь каждое масло описывается по трём осям, нужным правилам:
 *   - effects:    на какие эмоции действует и в каком режиме (будить/успокаивать/баланс/поддержка);
 *   - chronotype: в какое время суток уместно;
 *   - instruction: короткая инструкция применения.
 *
 * Маппинг «масло ↔ эмоция» выведен из EMOTIONS[].oils (constants.ts), временны́е
 * корзины — из aromaRecommendationService.ts (morning 5–12 / day 12–18 / evening 18–5).
 * ЧЕРНОВИК: требует выверки пользователем.
 */
export const OIL_DATABASE: OilEntry[] = [
  {
    id: 'peppermint',
    name: 'Мята перечная',
    description: 'Для ясности ума и концентрации.',
    icon: 'local_florist',
    effects: [
      { emotion: 'joy', mode: 'awaken' },
      { emotion: 'surprise', mode: 'awaken' },
    ],
    chronotype: ['morning', 'day'],
    instruction: 'Вдохните из флакона или нанесите 1 каплю на заднюю поверхность шеи.',
    price: 2100,
  },
  {
    id: 'wild_orange',
    name: 'Дикий апельсин',
    description: 'Повышает креативность и снижает тревогу.',
    icon: 'energy_savings_leaf',
    effects: [
      { emotion: 'joy', mode: 'awaken' },
      { emotion: 'anticipation', mode: 'awaken' },
    ],
    chronotype: ['morning', 'day'],
    instruction: '1–2 капли в диффузор или на запястья для бодрости.',
    price: 1500,
  },
  {
    id: 'rosemary',
    name: 'Розмарин',
    description: 'Улучшает память и придает бодрости.',
    icon: 'psychology',
    effects: [
      { emotion: 'joy', mode: 'awaken' },
    ],
    chronotype: ['morning', 'day'],
    instruction: 'Нанесите 1–2 капли (в разведении с базовым маслом) на заднюю поверхность шеи.',
    price: 1800,
  },
  {
    id: 'lavender',
    name: 'Лаванда',
    description: 'Способствует расслаблению и спокойному сну.',
    icon: 'eco',
    effects: [
      { emotion: 'trust', mode: 'calm' },
    ],
    chronotype: ['evening'],
    instruction: '1 капля на подушку или виски перед сном.',
    price: 2500,
  },
  {
    id: 'bergamot',
    name: 'Бергамот',
    description: 'Снижает стресс и поднимает настроение.',
    icon: 'fluid_med',
    effects: [
      { emotion: 'trust', mode: 'calm' },
      { emotion: 'sadness', mode: 'balance' },
    ],
    chronotype: ['day', 'evening'],
    instruction: 'Нанесите разведённое масло на виски и запястья.',
    price: 3200,
  },
  {
    id: 'frankincense',
    name: 'Ладан',
    description: 'Поддерживает чувство умиротворения.',
    icon: 'spa',
    effects: [
      { emotion: 'trust', mode: 'calm' },
      { emotion: 'sadness', mode: 'support' },
    ],
    chronotype: ['evening'],
    instruction: 'Нанесите 1 каплю на стопы или область сердца.',
    price: 7500,
  },
  {
    id: 'cedarwood',
    name: 'Кедр',
    description: 'Заземляющий аромат, способствующий релаксации.',
    icon: 'waves',
    effects: [
      { emotion: 'fear', mode: 'calm' },
    ],
    chronotype: ['evening'],
    instruction: 'Распылите или нанесите на стопы для заземления.',
    price: 1700,
  },
  {
    id: 'vetiver',
    name: 'Ветивер',
    description: 'Успокаивает ум и снимает нервозность.',
    icon: 'grass',
    effects: [
      { emotion: 'fear', mode: 'calm' },
    ],
    chronotype: ['evening'],
    instruction: '1 капля на стопы перед сном.',
    price: 4600,
  },
  {
    id: 'ylang_ylang',
    name: 'Иланг-иланг',
    description: 'Снимает напряжение и дарит позитивный настрой.',
    icon: 'filter_vintage',
    effects: [
      { emotion: 'fear', mode: 'balance' },
      { emotion: 'anger', mode: 'balance' },
    ],
    chronotype: ['morning', 'day', 'evening'],
    instruction: 'Нанесите на запястья или пульсовые точки.',
    price: 4100,
  },
  {
    id: 'lemon',
    name: 'Лимон',
    description: 'Поднимает настроение и дарит позитив.',
    icon: 'lightbulb',
    effects: [
      { emotion: 'surprise', mode: 'awaken' },
    ],
    chronotype: ['morning', 'day'],
    instruction: '1 капля в стакан воды или в диффузор.',
    price: 1400,
  },
  {
    id: 'grapefruit',
    name: 'Грейпфрут',
    description: 'Бодрит и помогает справиться со стрессом.',
    icon: 'eco',
    effects: [
      { emotion: 'surprise', mode: 'awaken' },
    ],
    chronotype: ['morning', 'day'],
    instruction: 'Нанесите на пульсовые точки (избегайте солнца 12 часов).',
    price: 1900,
  },
  {
    id: 'sandalwood',
    name: 'Сандал',
    description: 'Заземляет и помогает достичь эмоционального баланса.',
    icon: 'self_improvement',
    effects: [
      { emotion: 'sadness', mode: 'balance' },
    ],
    chronotype: ['evening'],
    instruction: '1 капля на область сердца или за уши.',
    price: 8200,
  },
  {
    id: 'tea_tree',
    name: 'Чайное дерево',
    description: 'Обладает очищающими и освежающими свойствами.',
    icon: 'potted_plant',
    effects: [
      { emotion: 'disgust', mode: 'support' },
    ],
    chronotype: ['day'],
    instruction: 'Нанесите на стопы или распылите для очищения.',
    price: 2100,
  },
  {
    id: 'eucalyptus',
    name: 'Эвкалипт',
    description: 'Способствует ясности ума.',
    icon: 'energy_savings_leaf',
    effects: [
      { emotion: 'disgust', mode: 'support' },
    ],
    chronotype: ['morning', 'day'],
    instruction: 'Вдохните из флакона или распылите для ясности.',
    price: 1700,
  },
  {
    id: 'juniper_berry',
    name: 'Можжевельник',
    description: 'Действует как природное очищающее средство.',
    icon: 'local_florist',
    effects: [
      { emotion: 'disgust', mode: 'support' },
    ],
    chronotype: ['day'],
    instruction: 'Нанесите на грудь или распылите.',
    price: 2200,
  },
  {
    id: 'patchouli',
    name: 'Пачули',
    description: 'Заземляет и балансирует эмоции.',
    icon: 'compost',
    effects: [
      { emotion: 'anger', mode: 'balance' },
    ],
    chronotype: ['evening'],
    instruction: 'Нанесите на виски или лоб для заземления.',
    price: 3100,
  },
  {
    id: 'roman_chamomile',
    name: 'Римская ромашка',
    description: 'Успокаивает и помогает унять гнев.',
    icon: 'camera_iris',
    effects: [
      { emotion: 'anger', mode: 'calm' },
    ],
    chronotype: ['evening'],
    instruction: 'Нанесите на запястья и шею.',
    price: 4500,
  },
  {
    id: 'clary_sage',
    name: 'Шалфей мускатный',
    description: 'Способствует расслаблению и равновесию.',
    icon: 'balance',
    effects: [
      { emotion: 'anticipation', mode: 'balance' },
    ],
    chronotype: ['evening'],
    instruction: 'Нанесите на пульсовые точки или распылите.',
    price: 3800,
  },
  {
    id: 'geranium',
    name: 'Герань',
    description: 'Помогает сбалансировать эмоции и успокоить нервы.',
    icon: 'spa',
    effects: [
      { emotion: 'anticipation', mode: 'balance' },
    ],
    chronotype: ['day', 'evening'],
    instruction: 'Нанесите на область живота или запястья.',
    price: 3400,
  },
];

/** Поиск масла по id; undefined, если не найдено (движок сам решает фолбэк). */
export const findOilById = (id: string): OilEntry | undefined =>
  OIL_DATABASE.find((o) => o.id === id);
