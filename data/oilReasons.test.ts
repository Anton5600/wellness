import { describe, it, expect } from 'vitest';
import { OIL_EMOTIONAL_REASONS, emotionalReasonFor } from './oilReasons';
import { findOilById } from './oilDatabase';
import { EMOTION_OILS, oilsForEmotion } from './emotionOils';
import { EMOTION_LABELS } from '../services/recommendation/inference';
import { EmotionKey } from '../types';

const EMOTIONS = Object.keys(EMOTION_LABELS) as EmotionKey[];

describe('OIL_EMOTIONAL_REASONS', () => {
  it('все ключи — существующие id масел', () => {
    for (const id of Object.keys(OIL_EMOTIONAL_REASONS)) {
      expect(findOilById(id), `описание ссылается на несуществующее масло «${id}»`).toBeDefined();
    }
  });

  it('главное масло каждой эмоции имеет описание', () => {
    for (const emotion of EMOTIONS) {
      const id = EMOTION_OILS[emotion].primary;
      expect(emotionalReasonFor(id), `нет описания для главного масла эмоции ${emotion} («${id}»)`).toBeTruthy();
    }
  });

  it('все альтернативы из привязки имеют описание', () => {
    for (const emotion of EMOTIONS) {
      for (const id of oilsForEmotion(emotion)) {
        expect(emotionalReasonFor(id), `нет описания для масла «${id}» (эмоция ${emotion})`).toBeTruthy();
      }
    }
  });

  it('описания непустые и не дублируют название масла', () => {
    for (const [id, text] of Object.entries(OIL_EMOTIONAL_REASONS)) {
      const oil = findOilById(id)!;
      expect(text!.trim().length, `пустое описание для «${id}»`).toBeGreaterThan(10);
      expect(text!.toLowerCase()).not.toContain(oil.name.toLowerCase());
    }
  });
});
