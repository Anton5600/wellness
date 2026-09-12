import { describe, it, expect } from 'vitest';
import { EMOTION_OILS, oilsForEmotion, primaryOilFor } from './emotionOils';
import { findOilById } from './oilDatabase';
import { EMOTION_LABELS } from '../services/recommendation/inference';
import { EmotionKey } from '../types';

const EMOTIONS = Object.keys(EMOTION_LABELS) as EmotionKey[];

/**
 * Привязка — источник правды для подбора масла, поэтому проверяем не только форму,
 * но и согласованность с базой: каждое привязанное масло обязано иметь эффект на свою
 * эмоцию. Именно эта проверка вскрыла расхождение, когда «главные» масла из списка
 * (Майоран для доверия, Можжевельник для страха, Зелёный мандарин для удивления)
 * в базе на свою эмоцию не действовали.
 */
describe('EMOTION_OILS', () => {
  it('покрывает все 8 эмоций', () => {
    for (const emotion of EMOTIONS) {
      expect(EMOTION_OILS[emotion], `нет привязки для ${emotion}`).toBeDefined();
    }
    expect(Object.keys(EMOTION_OILS).sort()).toEqual([...EMOTIONS].sort());
  });

  it('все id существуют в базе масел', () => {
    for (const emotion of EMOTIONS) {
      for (const id of oilsForEmotion(emotion)) {
        expect(findOilById(id), `${emotion}: масло «${id}» не найдено в OIL_DATABASE`).toBeDefined();
      }
    }
  });

  it('главное и дополнительные масла действительно действуют на свою эмоцию', () => {
    for (const emotion of EMOTIONS) {
      for (const id of oilsForEmotion(emotion)) {
        const oil = findOilById(id)!;
        const effects = oil.effects.filter((e) => e.emotion === emotion);
        expect(effects.length, `${emotion}: у масла «${oil.name}» нет эффекта на эту эмоцию`).toBeGreaterThan(0);
      }
    }
  });

  it('внутри привязки нет повторов', () => {
    for (const emotion of EMOTIONS) {
      const ids = oilsForEmotion(emotion);
      expect(new Set(ids).size, `${emotion}: дубли в привязке`).toBe(ids.length);
    }
  });

  it('главное масло идёт первым', () => {
    for (const emotion of EMOTIONS) {
      expect(oilsForEmotion(emotion)[0]).toBe(primaryOilFor(emotion));
    }
  });

  it('у каждой эмоции есть хотя бы один дополнительный вариант', () => {
    for (const emotion of EMOTIONS) {
      expect(EMOTION_OILS[emotion].alternatives.length).toBeGreaterThan(0);
    }
  });
});
