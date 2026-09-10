// Минимальный in-memory `Storage` для тестов localStorage-модулей без jsdom/happy-dom.
// Память практик и паттернов пишет только через getItem/setItem/removeItem,
// поэтому полной эмуляции браузерного Storage не требуется.

export const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  } as Storage;
};

/** Подставляет фейковый localStorage в globalThis для текущего теста. */
export const installMemoryStorage = (): Storage => {
  const storage = createMemoryStorage();
  (globalThis as unknown as { localStorage: Storage }).localStorage = storage;
  return storage;
};
