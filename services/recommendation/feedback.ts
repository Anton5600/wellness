import { EveningFeedback } from '../../types';

export interface FeedbackOption {
  value: EveningFeedback;
  label: string;
  icon: string;
}

/**
 * Подписи вечернего фидбека «как сработало масло» зависят от знака доминанты.
 * В позитивном/нейтральном состоянии цель — заякорить, а не «улучшить из плохого»,
 * поэтому «Стало лучше» → «Закрепить», «Не помогло» → «Сбило».
 * Значения (`better`/`same`/`worse`) не меняются — бан масла по `worse` работает как раньше.
 */
export const eveningFeedbackOptions = (positive: boolean): FeedbackOption[] =>
  positive
    ? [
        { value: 'better', label: 'Закрепить', icon: 'thumb_up' },
        { value: 'same', label: 'Без изменений', icon: 'remove' },
        { value: 'worse', label: 'Сбило', icon: 'thumb_down' },
      ]
    : [
        { value: 'better', label: 'Стало лучше', icon: 'thumb_up' },
        { value: 'same', label: 'Без изменений', icon: 'remove' },
        { value: 'worse', label: 'Не помогло', icon: 'thumb_down' },
      ];
