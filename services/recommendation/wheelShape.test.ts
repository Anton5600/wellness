import { describe, it, expect } from 'vitest';
import { PlutchikVector } from '../../types';
import { classifyShape, strategyFor } from './wheelShape';

const vec = (overrides: Partial<PlutchikVector>): PlutchikVector => ({
  joy: 0,
  trust: 0,
  fear: 0,
  surprise: 0,
  sadness: 0,
  disgust: 0,
  anger: 0,
  anticipation: 0,
  ...overrides,
});

describe('classifyShape', () => {
  it('все равны → circle', () => {
    expect(classifyShape(vec({ joy: 0.5, trust: 0.5, fear: 0.5, surprise: 0.5, sadness: 0.5, disgust: 0.5, anger: 0.5, anticipation: 0.5 }))).toBe('circle');
  });

  it('низкий разброс → circle', () => {
    expect(classifyShape(vec({ joy: 0.4, trust: 0.5, fear: 0.45, surprise: 0.4, sadness: 0.5, disgust: 0.45, anger: 0.4, anticipation: 0.5 }))).toBe('circle');
  });

  it('два противоположных пика (радость + грусть) → star', () => {
    expect(classifyShape(vec({ joy: 0.8, sadness: 0.8, trust: 0.1, fear: 0.1, surprise: 0.1, disgust: 0.1, anger: 0.1, anticipation: 0.1 }))).toBe('star');
  });

  it('три разбросанных пика → star', () => {
    expect(classifyShape(vec({ joy: 0.8, surprise: 0.7, anger: 0.75, trust: 0.1, fear: 0.1, sadness: 0.1, disgust: 0.1, anticipation: 0.1 }))).toBe('star');
  });

  it('доминанты в смежной дуге, противоположная пуста → crescent', () => {
    // joy, trust, fear — позиции 0,1,2 (смежные); антиподы (sadness, disgust, anger) пусты
    expect(classifyShape(vec({ joy: 0.8, trust: 0.75, fear: 0.65, surprise: 0.1, sadness: 0.1, disgust: 0.1, anger: 0.1, anticipation: 0.1 }))).toBe('crescent');
  });

  it('один доминант → crescent (баланс к противоположному полюсу)', () => {
    expect(classifyShape(vec({ joy: 0.8, trust: 0.1, fear: 0.1, surprise: 0.1, sadness: 0.1, disgust: 0.1, anger: 0.1, anticipation: 0.1 }))).toBe('crescent');
  });
});

describe('strategyFor', () => {
  it('star → awaken', () => expect(strategyFor('star')).toBe('awaken'));
  it('crescent → balance', () => expect(strategyFor('crescent')).toBe('balance'));
  it('circle → support', () => expect(strategyFor('circle')).toBe('support'));
});
