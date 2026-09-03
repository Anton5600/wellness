import { describe, it, expect } from 'vitest';
import { PlutchikVector, PulseEntry } from '../../types';
import { vectorDistance, classifyPulse, computeDailyVector, pulseGate, PULSE_CONFIG } from './pulse';

const V: PlutchikVector = {
  joy: 0.5, trust: 0.6, fear: 0.2, surprise: 0.3, sadness: 0.2, disgust: 0.1, anger: 0.2, anticipation: 0.6,
};

const pulse = (timestamp: number, over: Partial<PlutchikVector> = {}): PulseEntry => ({
  timestamp,
  microInput: '',
  inputType: 'tap',
  vector: { ...V, ...over },
  dominant: 'anticipation',
  scenario: 'stable',
  criticalShift: false,
});

describe('vectorDistance', () => {
  it('одинаковые векторы → 0', () => {
    expect(vectorDistance(V, V)).toBe(0);
  });

  it('одна ось сдвинута → точная разность', () => {
    expect(vectorDistance(V, { ...V, joy: 0.9 })).toBeCloseTo(0.4);
  });

  it('разность берётся по модулю (не зависит от направления)', () => {
    expect(vectorDistance(V, { ...V, fear: 0.0 })).toBeCloseTo(0.2);
    expect(vectorDistance({ ...V, fear: 0.0 }, V)).toBeCloseTo(0.2);
  });
});

describe('classifyPulse', () => {
  it('Δ ниже порога → stable', () => {
    expect(classifyPulse(V, { ...V, joy: 0.6 })).toBe('stable');
  });

  it('Δ на пороге → shift (>= порога)', () => {
    const shifted = { ...V, joy: V.joy + PULSE_CONFIG.shiftThreshold };
    expect(classifyPulse(V, shifted)).toBe('shift');
  });

  it('резкая смена доминанты → shift', () => {
    expect(classifyPulse(V, { ...V, joy: 0.1, fear: 0.9 })).toBe('shift');
  });
});

describe('computeDailyVector', () => {
  const H = 60 * 60 * 1000;

  it('пример из ТЗ: радость длилась дольше → итог ближе к радости', () => {
    const start = new Date(2026, 8, 1, 9, 0, 0).getTime(); // 09:00
    const anchor = { vector: { ...V, joy: 0.8 }, timestamp: start };
    const pulses = [
      pulse(start + 4 * H, { fear: 0.7 }),   // 13:00 страх
      pulse(start + 11 * H, { trust: 0.6 }), // 20:00 спокойствие
    ];
    const end = start + 15 * H; // 24:00
    const daily = computeDailyVector(anchor, pulses, end);

    // joy: 0.8×4ч + 0.5×7ч + 0.5×4ч = 3.2 + 3.5 + 2.0 = 8.7 / 15 = 0.58
    expect(daily.joy).toBeCloseTo(8.7 / 15, 5);
    // fear: 0.2×4ч + 0.7×7ч + 0.2×4ч = 0.8 + 4.9 + 0.8 = 6.5 / 15 = 0.4333…
    expect(daily.fear).toBeCloseTo(6.5 / 15, 5);
    // итог ближе к радости (0.58), чем к страху (0.433)
    expect(daily.joy).toBeGreaterThan(daily.fear);
  });

  it('пустой pulses → вектор якоря', () => {
    const anchor = { vector: { ...V, joy: 0.8 }, timestamp: 1000 };
    expect(computeDailyVector(anchor, [], 5000)).toEqual({ ...V, joy: 0.8 });
  });

  it('endTs раньше последнего чекина не роняет вычисление', () => {
    const anchor = { vector: V, timestamp: 1000 };
    const daily = computeDailyVector(anchor, [pulse(2000)], 1500);
    expect(daily.joy).toBeCloseTo(V.joy);
  });
});

describe('pulseGate', () => {
  const now = new Date(2026, 8, 1, 12, 0, 0).getTime();

  it('нет пульсов → allowed', () => {
    expect(pulseGate([], now)).toEqual({ allowed: true, count: 0, cooldownRemaining: 0 });
  });

  it('последний пульс < кулдауна → cooldown', () => {
    const res = pulseGate([pulse(now - 10 * 60 * 1000)], now);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('cooldown');
    expect(res.cooldownRemaining).toBeGreaterThan(0);
  });

  it('граница кулдауна ровно 30 мин → allowed', () => {
    const res = pulseGate([pulse(now - PULSE_CONFIG.cooldownMinutes * 60 * 1000)], now);
    expect(res.allowed).toBe(true);
  });

  it('5 пульсов → limit', () => {
    const pulses = Array.from({ length: PULSE_CONFIG.maxPerDay }, (_, i) =>
      pulse(now - (i + 1) * 60 * 60 * 1000)
    );
    const res = pulseGate(pulses, now);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('limit');
  });
});
