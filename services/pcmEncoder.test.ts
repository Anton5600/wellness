import { describe, it, expect } from 'vitest';
import { resampleLinear, floatToPcm16, encodeSttPcm, STT_SAMPLE_RATE } from './pcmEncoder';

describe('resampleLinear', () => {
  it('возвращает тот же массив при совпадении частот', () => {
    const s = new Float32Array([0, 1, 2, 3]);
    expect(resampleLinear(s, 16000, 16000)).toBe(s);
  });

  it('децимирует 48000 → 16000 ровно в 3 раза', () => {
    const s = new Float32Array([0, 1, 2, 3, 4, 5]);
    const out = resampleLinear(s, 48000, 16000);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(3);
  });

  it('линейно интерполирует дробные позиции', () => {
    const s = new Float32Array([0, 10, 20]);
    const out = resampleLinear(s, 20000, 16000); // ratio 1.25
    expect(out).toHaveLength(2);
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(12.5); // pos 1.25 → 10 + 10*0.25
  });

  it('не падает на пустом входе', () => {
    expect(resampleLinear(new Float32Array(0), 48000, 16000)).toHaveLength(0);
  });
});

describe('floatToPcm16', () => {
  it('масштабирует и клипает значения', () => {
    const out = floatToPcm16(new Float32Array([0, 1, -1, 2, -2]));
    expect(out).toBeInstanceOf(Int16Array);
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(0x7fff);
    expect(out[2]).toBe(-0x8000);
    expect(out[3]).toBe(0x7fff); // клип сверху
    expect(out[4]).toBe(-0x8000); // клип снизу
  });
});

describe('encodeSttPcm', () => {
  it('приводит к 16 кГц и 16 битам', () => {
    expect(STT_SAMPLE_RATE).toBe(16000);
    const out = encodeSttPcm(new Float32Array([1, -1, 1, -1, 1, -1]), 48000);
    expect(out).toBeInstanceOf(Int16Array);
    expect(out).toHaveLength(2);
  });
});
