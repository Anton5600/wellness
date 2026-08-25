/**
 * Пороговые значения движка рекомендации.
 * Стартовые значения — калибруются на реальных данных после запуска.
 */
export interface RecommendationConfig {
  /** Сколько дней масло в бане после отзыва «Не помогло». */
  banDays: number;
  /** Порог «доминирующей» эмоции (0..1) для форм «звезда»/«серп». */
  dominanceThreshold: number;
  /** Порог «спящей» эмоции (0..1) — ниже считается пустой. */
  restThreshold: number;
  /** Максимальный размер смежной дуги (позиций) для формы «серп». */
  maxArcPositions: number;
  /** Максимальный разброс значений, при котором колесо считаем «кругом». */
  circleSpreadThreshold: number;
}

export const DEFAULT_CONFIG: RecommendationConfig = {
  banDays: 7,
  dominanceThreshold: 0.6,
  restThreshold: 0.2,
  maxArcPositions: 4,
  circleSpreadThreshold: 0.2,
};
