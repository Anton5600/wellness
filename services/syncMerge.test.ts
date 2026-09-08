import { describe, it, expect } from 'vitest';
import { freshnessOf, mergeGraphByFreshness, pickNewer, SyncTimestamped } from './syncMerge';

type E = SyncTimestamped & { date: string };

const entry = (date: string, updatedAt?: number, timestamp = 1000): E => ({ date, timestamp, updatedAt });

describe('freshnessOf', () => {
  it('updatedAt приоритетнее timestamp', () => {
    expect(freshnessOf({ updatedAt: 5, timestamp: 100 })).toBe(5);
  });

  it('без updatedAt использует timestamp', () => {
    expect(freshnessOf({ timestamp: 42 })).toBe(42);
  });

  it('без меток — 0 (самая старая запись)', () => {
    expect(freshnessOf({})).toBe(0);
  });
});

describe('mergeGraphByFreshness', () => {
  it('только локальная запись → остаётся и отправляется', () => {
    const local = { a: entry('a', 10) };
    const { merged, localNewer } = mergeGraphByFreshness(local, {});
    expect(merged.a).toBe(local.a);
    expect(localNewer.map((e) => e.date)).toEqual(['a']);
  });

  it('только удалённая запись → тянется локально', () => {
    const remote = { a: entry('a', 10) };
    const { merged, localNewer } = mergeGraphByFreshness({}, remote);
    expect(merged.a).toBe(remote.a);
    expect(localNewer).toEqual([]);
  });

  it('удалённая новее → побеждает, локальная не пушится', () => {
    const local = { a: entry('a', 10) };
    const remote = { a: entry('a', 20) };
    const { merged, localNewer } = mergeGraphByFreshness(local, remote);
    expect(merged.a).toBe(remote.a);
    expect(localNewer).toEqual([]);
  });

  it('локальная новее → побеждает и отправляется', () => {
    const local = { a: entry('a', 20) };
    const remote = { a: entry('a', 10) };
    const { merged, localNewer } = mergeGraphByFreshness(local, remote);
    expect(merged.a).toBe(local.a);
    expect(localNewer.map((e) => e.date)).toEqual(['a']);
  });

  it('равная свежесть → удалённая побеждает (стабильная развязка)', () => {
    const local = { a: entry('a', 10) };
    const remote = { a: entry('a', 10) };
    const { merged, localNewer } = mergeGraphByFreshness(local, remote);
    expect(merged.a).toBe(remote.a);
    expect(localNewer).toEqual([]);
  });

  it('смешанный набор: тянет, пушит и сохраняет по LWW', () => {
    const local = {
      onlyLocal: entry('onlyLocal', 30),
      localNewer: entry('localNewer', 50),
      remoteNewer: entry('remoteNewer', 5),
    };
    const remote = {
      onlyRemote: entry('onlyRemote', 40),
      localNewer: entry('localNewer', 10),
      remoteNewer: entry('remoteNewer', 60),
    };
    const { merged, localNewer } = mergeGraphByFreshness(local, remote);

    expect(merged.onlyLocal).toBe(local.onlyLocal);
    expect(merged.onlyRemote).toBe(remote.onlyRemote);
    expect(merged.localNewer).toBe(local.localNewer);
    expect(merged.remoteNewer).toBe(remote.remoteNewer);

    const pushed = new Set(localNewer.map((e) => e.date));
    expect(pushed).toEqual(new Set(['onlyLocal', 'localNewer']));
  });
});

describe('pickNewer', () => {
  it('оба пусты → пусто, не пушить', () => {
    expect(pickNewer(null, null)).toEqual({ winner: null, pushLocal: false });
  });

  it('удалённо пусто, локально есть → локальная побеждает и пушится', () => {
    const local = { current: 3, longest: 5, lastActiveDate: 'x', updatedAt: 1 };
    expect(pickNewer(local, null)).toEqual({ winner: local, pushLocal: true });
  });

  it('локально пусто, удалённо есть → удалённая побеждает, не пушить', () => {
    const remote = { current: 3, longest: 5, lastActiveDate: 'x', updatedAt: 1 };
    expect(pickNewer(null, remote)).toEqual({ winner: remote, pushLocal: false });
  });

  it('удалённая новее → побеждает, не пушить', () => {
    const local = { current: 1, longest: 1, lastActiveDate: '', updatedAt: 10 };
    const remote = { current: 5, longest: 5, lastActiveDate: '2026-09-08', updatedAt: 20 };
    expect(pickNewer(local, remote)).toEqual({ winner: remote, pushLocal: false });
  });

  it('локальная новее → побеждает и пушится', () => {
    const local = { current: 5, longest: 5, lastActiveDate: '2026-09-08', updatedAt: 20 };
    const remote = { current: 1, longest: 1, lastActiveDate: '', updatedAt: 10 };
    expect(pickNewer(local, remote)).toEqual({ winner: local, pushLocal: true });
  });

  it('равная свежесть → удалённая побеждает, не пушить', () => {
    const local = { current: 1, longest: 1, lastActiveDate: '', updatedAt: 10 };
    const remote = { current: 1, longest: 1, lastActiveDate: '', updatedAt: 10 };
    expect(pickNewer(local, remote)).toEqual({ winner: remote, pushLocal: false });
  });
});
