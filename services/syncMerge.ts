// Чистая логика LWW-синхронизации (last-write-wins) между локальным кешем и Firestore.
// Без сайд-эффектов и импортов firebase — чтобы слияние можно было тестировать изолированно.

/** Объект с меткой свежести: `updatedAt` (мс), иначе `timestamp` (мс), иначе 0. */
export interface SyncTimestamped {
  updatedAt?: number;
  timestamp?: number;
}

/** Свежесть записи для LWW-сравнения. Старые записи без `updatedAt` считаются по `timestamp`. */
export const freshnessOf = (x: SyncTimestamped): number => x.updatedAt ?? x.timestamp ?? 0;

/**
 * LWW-слияние графа чек-инов по датам.
 *
 * Возвращает:
 *  - `merged` — итоговая карта записей (новая запись побеждает старую);
 *  - `localNewer` — локальные записи, которых нет удалённо либо которые новее удалённых
 *    (их нужно отправить в Firestore, чтобы вернуть базу в консистентное состояние).
 */
export const mergeGraphByFreshness = <T extends SyncTimestamped & { date: string }>(
  local: Record<string, T>,
  remote: Record<string, T>
): { merged: Record<string, T>; localNewer: T[] } => {
  const merged: Record<string, T> = { ...local };
  const localNewer: T[] = [];
  const dates = new Set<string>([...Object.keys(local), ...Object.keys(remote)]);

  for (const date of dates) {
    const l = local[date];
    const r = remote[date];
    if (!r) {
      if (l) localNewer.push(l); // удалённо нет — локальная выигрывает и отправляется
      continue;
    }
    if (!l) {
      merged[date] = r; // локально нет — тянем удалённую
      continue;
    }
    if (freshnessOf(r) >= freshnessOf(l)) {
      merged[date] = r; // удалённая такая же или новее — она выигрывает
    } else {
      merged[date] = l;
      localNewer.push(l); // локальная новее — отправляем, чтобы удалённая не перекрыла её
    }
  }

  return { merged, localNewer };
};

/**
 * LWW для одиночного документа (профиль Плутчика / стрик).
 * `null` означает «документа нет». Возвращает победителя и флаг, нужно ли отправить локальную
 * копию (локальная есть и новее удалённой, либо удалённой нет вовсе).
 */
export const pickNewer = <T extends SyncTimestamped>(
  local: T | null,
  remote: T | null
): { winner: T | null; pushLocal: boolean } => {
  if (!remote) return { winner: local, pushLocal: local !== null };
  if (!local) return { winner: remote, pushLocal: false };
  if (freshnessOf(remote) >= freshnessOf(local)) return { winner: remote, pushLocal: false };
  return { winner: local, pushLocal: true };
};
