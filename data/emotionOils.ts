import { EmotionKey } from '../types';

/**
 * Жёсткая привязка «эмоция → масло» — главное масло и дополнительные варианты.
 *
 * Источник: подборка «Для каждого из 8 эмоциональных состояний» (базовое масло плюс
 * варианты из справочников по ароматерапии). Значения — id масел из `OIL_DATABASE`.
 *
 * Зачем отдельная таблица: для диад роль такой привязки уже играет поле `oil.dyads`
 * (см. `services/recommendation/shortlist.ts`), а для одиночных эмоций выбор шёл
 * целиком от формы колеса — из-за чего при доминанте «Радость» первым кандидатом
 * оказывался Бергамот (балансирующее масло), а не масло самой радости.
 *
 * Порядок вариантов значим: главное масло идёт первым, дальше — дополнительные
 * в порядке из источника.
 */
export interface EmotionOilBinding {
  /** Главное масло для эмоции (id из OIL_DATABASE). */
  primary: string;
  /** Дополнительные варианты в порядке значимости. */
  alternatives: string[];
}

export const EMOTION_OILS: Record<EmotionKey, EmotionOilBinding> = {
  joy: { primary: 'wild_orange', alternatives: ['peppermint'] },
  trust: { primary: 'marjoram', alternatives: ['lavender', 'myrrh'] },
  fear: { primary: 'juniper_berry', alternatives: ['cedarwood', 'vetiver'] },
  surprise: { primary: 'green_mandarin', alternatives: ['lemon'] },
  sadness: { primary: 'sandalwood', alternatives: ['frankincense', 'console'] },
  disgust: { primary: 'tea_tree', alternatives: ['lemongrass', 'purify', 'eucalyptus'] },
  anger: { primary: 'cardamom', alternatives: ['thyme', 'forgive'] },
  anticipation: { primary: 'clary_sage', alternatives: ['motivate', 'geranium'] },
};

/** Id масел эмоции по порядку значимости: сначала главное, затем дополнительные. */
export const oilsForEmotion = (emotion: EmotionKey): string[] => {
  const binding = EMOTION_OILS[emotion];
  return [binding.primary, ...binding.alternatives];
};

/** Id главного масла эмоции. */
export const primaryOilFor = (emotion: EmotionKey): string => EMOTION_OILS[emotion].primary;
