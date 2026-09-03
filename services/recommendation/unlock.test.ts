import { describe, it, expect } from 'vitest';
import { computeUnlockedFeatures, UNLOCK_DAYS } from './unlock';

describe('computeUnlockedFeatures', () => {
  it('день 1: открыт только утренний ритуал', () => {
    const f = computeUnlockedFeatures(1);
    expect(f.morningRitual).toBe(true);
    expect(f.eveningCheckin).toBe(false);
    expect(f.mapDay).toBe(false);
    expect(f.cards).toBe(false);
    expect(f.patterns).toBe(false);
    expect(f.catalog).toBe(false);
    expect(f.exportPdf).toBe(false);
  });

  it('день 0/отрицательный клампится к 1', () => {
    expect(computeUnlockedFeatures(0).morningRitual).toBe(true);
    expect(computeUnlockedFeatures(-5).cards).toBe(false);
  });

  it('пороги открываются по одному', () => {
    expect(computeUnlockedFeatures(3).eveningCheckin).toBe(false);
    expect(computeUnlockedFeatures(4).eveningCheckin).toBe(true);
    expect(computeUnlockedFeatures(7).mapDay).toBe(false);
    expect(computeUnlockedFeatures(8).mapDay).toBe(true);
    expect(computeUnlockedFeatures(14).cards).toBe(true);
    expect(computeUnlockedFeatures(21).patterns).toBe(true);
    expect(computeUnlockedFeatures(30).catalog).toBe(true);
    expect(computeUnlockedFeatures(30).exportPdf).toBe(true);
  });

  it('границы: день до порога ещё закрыт, день порога открыт', () => {
    expect(computeUnlockedFeatures(UNLOCK_DAYS.cards - 1).cards).toBe(false);
    expect(computeUnlockedFeatures(UNLOCK_DAYS.cards).cards).toBe(true);
  });

  it('максимальный streak открывает всё', () => {
    const f = computeUnlockedFeatures(1000);
    expect(Object.values(f).every(Boolean)).toBe(true);
  });
});
