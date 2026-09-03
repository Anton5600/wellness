import { EmotionKey, Arousal, PracticeId } from '../types';

/** Определение практики — «дорожка» внутри плеера. Конфиг, а не код. */
export interface PracticeDefinition {
  id: PracticeId;
  title: string;
  subtitle: string;
  icon: string;
  /** Чип ритма/каденции на экране подготовки. */
  wave: string;
  /** Длительность БЕЗ 3-секундного prep-шлюза. */
  durationSeconds: number;
  /** Целевая полоса активации. */
  arousal: Arousal;
  targetEmotions: EmotionKey[];
  description: string;
  /** Ключ реестра компонентов дорожки. */
  component: PracticeId;
}

export const PRACTICES: PracticeDefinition[] = [
  {
    id: 'bodyScan',
    title: 'Телесное сканирование',
    subtitle: 'Внимание в тело, зона за зоной',
    icon: 'accessibility_new',
    wave: '7 зон × ~8с',
    durationSeconds: 60,
    arousal: 'low',
    targetEmotions: ['sadness', 'fear', 'anger'],
    description: 'Медленно пройдите вниманием по телу — от лба до ног. Вернитесь из мыслей в ощущения.',
    component: 'bodyScan',
  },
  {
    id: 'grounding54321',
    title: 'Заземление 5-4-3-2-1',
    subtitle: 'Вернуться в настоящий момент через органы чувств',
    icon: 'sensors',
    wave: '5-4-3-2-1',
    durationSeconds: 90,
    arousal: 'high',
    targetEmotions: ['fear', 'surprise'],
    description: 'Пять вещей, которые видите. Четыре звука. Три ощущения. Два запаха. Один вкус.',
    component: 'grounding54321',
  },
  {
    id: 'pmr',
    title: 'Прогрессивная релаксация',
    subtitle: 'Сбросить напряжение через сжатие',
    icon: 'fitness_center',
    wave: '4×15с',
    durationSeconds: 60,
    arousal: 'high',
    targetEmotions: ['anger', 'anticipation'],
    description: 'Напрягите — и отпустите. Кулаки, плечи, челюсть, всё тело. Тепло вместо зажима.',
    component: 'pmr',
  },
  {
    id: 'fingerTracing',
    title: 'Пальцевая трассировка',
    subtitle: 'Дыхание по линии, ведомое пальцем',
    icon: 'gesture',
    wave: '4-4-6',
    durationSeconds: 60,
    arousal: 'low',
    targetEmotions: ['trust', 'joy', 'fear'],
    description: 'Ведите пальцем по светящейся линии. Вверх — вдох, вниз — выдох.',
    component: 'fingerTracing',
  },
  {
    id: 'vibroPacing',
    title: 'Вибро-ритм',
    subtitle: 'Пульс в ладони, ничего больше',
    icon: 'vibration',
    wave: '60→50 bpm',
    durationSeconds: 45,
    arousal: 'low',
    targetEmotions: ['fear', 'sadness'],
    description: 'Просто держите телефон и чувствуйте пульс. Никаких действий — только ощущение.',
    component: 'vibroPacing',
  },
  {
    id: 'expressiveWriting',
    title: 'Микро-письмо',
    subtitle: 'Выгрузить то, что застряло',
    icon: 'edit_note',
    wave: '90с свободно',
    durationSeconds: 90,
    arousal: 'low',
    targetEmotions: ['sadness', 'disgust'],
    description: 'Напишите всё, что крутится в голове. Эти слова исчезнут после ритуала.',
    component: 'expressiveWriting',
  },
  {
    id: 'thermalImagery',
    title: 'Тепловая визуализация',
    subtitle: 'Тепло масла расходится по телу',
    icon: 'local_fire_department',
    wave: 'тепло вниз',
    durationSeconds: 60,
    arousal: 'low',
    targetEmotions: ['fear', 'sadness'],
    description: 'Капля на запястье. Представьте, как тепло медленно заливает всё тело.',
    component: 'thermalImagery',
  },
  {
    id: 'mantraLoop',
    title: 'Мантра',
    subtitle: 'Одна фраза в ритме дыхания',
    icon: 'format_quote',
    wave: '14с ×4',
    durationSeconds: 60,
    arousal: 'low',
    targetEmotions: ['anger', 'fear'],
    description: 'Повторяйте фразу про себя или шёпотом. Каждый вдох — слово входит, каждый выдох — становится вами.',
    component: 'mantraLoop',
  },
];

export const PRACTICE_BY_ID: Record<PracticeId, PracticeDefinition> = Object.fromEntries(
  PRACTICES.map((p) => [p.id, p])
) as Record<PracticeId, PracticeDefinition>;

/** Фразы для мантры — подбираются по доминирующей эмоции. */
export const MANTRAS: Record<EmotionKey, string> = {
  anger: 'Я отпускаю то, что не могу контролировать.',
  fear: 'Я в безопасности здесь и сейчас.',
  sadness: 'Это чувство — волна, и она пройдёт.',
  disgust: 'Я разрешаю себе отстраниться и выдохнуть.',
  anticipation: 'Я делаю один шаг за раз.',
  joy: 'Я позволяю себе этот момент.',
  trust: 'Я опираюсь на себя.',
  surprise: 'Я открыт тому, что приходит.',
};
