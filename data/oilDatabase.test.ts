import { describe, it, expect } from 'vitest';
import { OIL_DATABASE } from './oilDatabase';
import { DYADS } from '../services/recommendation/dyads';
import { MixedEmotionKey } from '../types';

/** Авторитетная раскладка «подбор масел.txt»: диада → ожидаемые id масел. */
const EXPECTED_BY_DYAD: Record<MixedEmotionKey, string[]> = {
  love: ['rose', 'neroli', 'myrrh', 'thyme', 'forgive', 'whisper'],
  submission: ['lime', 'clove', 'ginger'],
  alarm: ['juniper_berry', 'turmeric', 'lavender', 'peace', 'deep_blue'],
  disappointment: ['geranium', 'marjoram', 'myrrh'],
  remorse: ['neroli', 'thyme', 'forgive'],
  contempt: ['grapefruit', 'pink_pepper', 'cardamom', 'forgive'],
  aggressiveness: ['cardamom', 'motivate', 'helichrysum'],
  optimism: ['bergamot', 'green_mandarin', 'melissa', 'elevation', 'cheer', 'citrus_bliss'],
};

describe('OIL_DATABASE: покрытие диад Плутчика', () => {
  it('каждая из 8 диад покрыта хотя бы одним маслом (по полю dyads)', () => {
    for (const dyad of DYADS) {
      const covering = OIL_DATABASE.filter((oil) => oil.dyads?.includes(dyad.key));
      expect(
        covering.length,
        `диада «${dyad.label}» не покрыта ни одним маслом`
      ).toBeGreaterThan(0);
    }
  });

  it('авторитетная раскладка из «подбор масел.txt» присутствует для каждой диады', () => {
    for (const dyad of DYADS) {
      const expected = EXPECTED_BY_DYAD[dyad.key];
      expect(expected, `нет эталона для диады «${dyad.label}»`).toBeDefined();
      for (const oilId of expected) {
        const oil = OIL_DATABASE.find((o) => o.id === oilId);
        expect(oil, `масло ${oilId} отсутствует в базе`).toBeDefined();
        expect(
          oil!.dyads,
          `масло ${oilId} не привязано к диаде «${dyad.label}»`
        ).toContain(dyad.key);
      }
    }
  });

  it('id масел уникальны', () => {
    const ids = OIL_DATABASE.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('у каждого масла есть непустые effects, chronotype и instruction', () => {
    for (const oil of OIL_DATABASE) {
      expect(oil.effects.length).toBeGreaterThan(0);
      expect(oil.chronotype.length).toBeGreaterThan(0);
      expect(oil.instruction.length).toBeGreaterThan(0);
    }
  });

  it('у каждого масла с привязкой dyads — валидные ключи диад', () => {
    const keys = new Set(DYADS.map((d) => d.key));
    for (const oil of OIL_DATABASE) {
      for (const key of oil.dyads ?? []) {
        expect(keys.has(key), `${oil.id}: неизвестная диада «${key}»`).toBe(true);
      }
    }
  });
});
