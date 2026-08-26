import { EmotionHistoryEntry, EmotionKey } from '../types';
import { OILS_CATALOG } from '../data/oils';
import { findOilById } from '../data/oilDatabase';
import { DEFAULT_PLUTCHIK } from './recommendation/inference';

export type AromaGoal = 'morning' | 'focus' | 'antistress' | 'evening' | 'stuck_support';

export interface AromaRecommendation {
  goal: AromaGoal;
  title: string;
  badge: string;
  oilId: string;
  oilName: string;
  oilIcon: string;
  reason: string;
  practice: string;
  isStuckAlert: boolean;
  emotionSource?: EmotionKey;
}

const HEAVY_EMOTIONS: EmotionKey[] = ['sadness', 'fear', 'disgust', 'anger'];

export const checkIsStuck = (history: EmotionHistoryEntry[]): boolean => {
  if (!history || history.length < 2) return false;
  const recent = history.slice(0, 3);
  const heavyCount = recent.filter(e => HEAVY_EMOTIONS.includes(e.emotionKey)).length;
  return heavyCount >= 2;
};

/** Заголовок и бейдж для каждой цели (используется и серверным, и локальным путём). */
const GOAL_META: Record<AromaGoal, { title: string; badge: string }> = {
  stuck_support: { title: 'Бережная Арома-поддержка', badge: 'Мягкая опора' },
  morning: { title: 'Утренний Настрой', badge: 'Заряд бодрости' },
  focus: { title: 'Ясность и Концентрация', badge: 'Фокус ума' },
  antistress: { title: 'Снятие Напряжения', badge: 'Баланс & Покой' },
  evening: { title: 'Вечерний Покой', badge: 'Глубокий сон' },
};

/** Репрезентативная фраза для каждой эмоции — для серверного микроввода. */
export const EMOTION_PHRASE: Record<EmotionKey, string> = {
  joy: 'мне радостно',
  trust: 'я спокоен',
  fear: 'мне тревожно',
  surprise: 'я удивлён',
  sadness: 'мне грустно',
  disgust: 'мне неприятно',
  anger: 'меня всё бесит',
  anticipation: 'я в предвкушении',
};

/** Определяет цель по явному запросу, stuck-флагу или часу суток. */
export const resolveGoal = (
  history: EmotionHistoryEntry[],
  requestedGoal?: AromaGoal,
  hour: number = new Date().getHours()
): AromaGoal => {
  if (requestedGoal) return requestedGoal;
  if (checkIsStuck(history)) return 'stuck_support';
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'focus';
  if (hour >= 17 && hour < 22) return 'antistress';
  return 'evening';
};

/** Отображение результата сервера в структуру рекомендации. Чистая, тестируемая. */
export const serverResultToAromaRecommendation = (
  result: {
    aromaId?: string;
    aroma?: string;
    aromaReason?: string;
    insight?: string;
    dominant?: EmotionKey;
  },
  goal: AromaGoal,
  isStuck: boolean
): AromaRecommendation => {
  const oil = result.aromaId ? findOilById(result.aromaId) : undefined;
  const meta = GOAL_META[goal];
  return {
    goal,
    title: meta.title,
    badge: meta.badge,
    oilId: result.aromaId ?? 'lavender',
    oilName: oil?.name ?? result.aroma ?? 'Лаванда',
    oilIcon: oil?.icon ?? 'spa',
    reason: result.aromaReason ?? 'Поддерживает эмоциональный баланс.',
    practice: oil?.instruction ?? result.insight ?? 'Нанесите 1 каплю на запястья и сделайте 3 глубоких вдоха.',
    isStuckAlert: isStuck,
    emotionSource: result.dominant,
  };
};

/**
 * Локальный (оффлайн) подбор по цели и последней эмоции — жёстко зашитый
 * «кураторский» вариант, остаётся фолбэком при отсутствии сети/сервера.
 */
export const getLocalAromaRecommendation = (
  history: EmotionHistoryEntry[],
  requestedGoal?: AromaGoal
): AromaRecommendation => {
  const isStuck = checkIsStuck(history);
  const latestEntry = history && history.length > 0 ? history[0] : null;
  const latestEmotion: EmotionKey | undefined = latestEntry?.emotionKey;
  const goal = resolveGoal(history, requestedGoal);

  if (goal === 'stuck_support') {
    let oilId = 'lavender';
    let oilName = 'Лаванда & Ладан';
    let oilIcon = 'spa';
    let reason = 'Мы заметили, что последние дни принесли вам усталость или тревогу. Эфирный союз Лаванды и Ладана создаст тёплый защитный кокон и вернёт внутренний покой.';

    if (latestEmotion === 'sadness') {
      oilId = 'bergamot';
      oilName = 'Бергамот & Ладан';
      oilIcon = 'fluid_med';
      reason = 'Для бережного выхода из грусти. Бергамот мягко поднимает настроение, а Ладан снимает душевное напряжение.';
    } else if (latestEmotion === 'fear') {
      oilId = 'cedarwood';
      oilName = 'Кедр & Ветивер';
      oilIcon = 'waves';
      reason = 'Глубокое заземление. Древесные ароматы Кедра и Ветивера дарят ощущение прочной почвы под ногами и безопасности.';
    } else if (latestEmotion === 'anger') {
      oilId = 'roman_chamomile';
      oilName = 'Римская ромашка & Лаванда';
      oilIcon = 'balance';
      reason = 'Мягкое охлаждение вспышек раздражения. Снимает спазмы и дарит прощение и умиротворение.';
    }

    return {
      goal: 'stuck_support',
      title: 'Бережная Арома-поддержка',
      badge: 'Мягкая опора',
      oilId,
      oilName,
      oilIcon,
      reason,
      practice: 'Разотрите 1 каплю между ладонями, сложите их лодочкой у носа и сделайте 5 медленных глубоких вдохов.',
      isStuckAlert: isStuck,
      emotionSource: latestEmotion
    };
  }

  if (goal === 'morning') {
    let oilId = 'wild_orange';
    let oilName = 'Дикий апельсин & Мята';
    let oilIcon = 'energy_savings_leaf';
    let reason = 'Утренний союз солнечного Апельсина и бодрящей Мяты мгновенно активирует корковые центры мозга и наполняет вдохновением.';

    if (latestEmotion === 'sadness' || latestEmotion === 'disgust') {
      oilId = 'lemon';
      oilName = 'Лимон & Грейпфрут';
      oilIcon = 'lightbulb';
      reason = 'Цитрусовая свежесть рассеивает смутное утреннее утомление и пробуждает ясный оптимизм.';
    } else if (latestEmotion === 'fear') {
      oilId = 'bergamot';
      oilName = 'Бергамот & Ладан';
      oilIcon = 'spa';
      reason = 'Утро без тревоги и спешки. Создает ровную уверенность в своих силах.';
    }

    return {
      goal: 'morning',
      title: 'Утренний Настрой',
      badge: 'Заряд бодрости',
      oilId,
      oilName,
      oilIcon,
      reason,
      practice: 'Добавьте 2 капли в диффузор или нанесите на запястья перед утренним чаем.',
      isStuckAlert: isStuck,
      emotionSource: latestEmotion
    };
  }

  if (goal === 'focus') {
    return {
      goal: 'focus',
      title: 'Ясность и Концентрация',
      badge: 'Фокус ума',
      oilId: 'peppermint',
      oilName: 'Мята перечная & Розмарин',
      oilIcon: 'psychology',
      reason: 'Снимает ментальный туман, повышает скорость усвоения информации и помогает удерживать внимание на главных задачах.',
      practice: 'Вдохните прямо из флакона или нанесите на заднюю поверхность шеи.',
      isStuckAlert: isStuck,
      emotionSource: latestEmotion
    };
  }

  if (goal === 'antistress') {
    return {
      goal: 'antistress',
      title: 'Снятие Напряжения',
      badge: 'Баланс & Покой',
      oilId: 'bergamot',
      oilName: 'Бергамот & Иланг-иланг',
      oilIcon: 'self_improvement',
      reason: 'Защищает от дневного стресса, снижает мышечный зажим и возвращает легкое дыхание грудной клеткой.',
      practice: 'Нанесите разведенное масло на виски и пульсовые точки на запястьях.',
      isStuckAlert: isStuck,
      emotionSource: latestEmotion
    };
  }

  // Evening
  return {
    goal: 'evening',
    title: 'Вечерний Покой',
    badge: 'Глубокий сон',
    oilId: 'lavender',
    oilName: 'Лаванда & Сандал',
    oilIcon: 'eco',
    reason: 'Замедляет сердечный ритм, переключает нервную систему в режим отдыха и подготавливает к глубокому сну.',
    practice: 'Капните 1 каплю Лаванды на край подушки или включите диффузор за 20 минут до сна.',
    isStuckAlert: isStuck,
    emotionSource: latestEmotion
  };
};

/**
 * Гибридная рекомендация: по умолчанию (без явной цели и с последней эмоцией)
 * спрашиваем серверный движок «правила → LLM»; при недоступности или для
 * явных целей-вкладок возвращаем кураторский локальный подбор.
 */
export const getAromaRecommendation = async (
  history: EmotionHistoryEntry[],
  requestedGoal?: AromaGoal
): Promise<AromaRecommendation> => {
  const latestEmotion = history && history.length > 0 ? history[0]?.emotionKey : undefined;
  const goal = resolveGoal(history, requestedGoal);
  const isStuck = checkIsStuck(history);

  if (!requestedGoal && latestEmotion) {
    try {
      const response = await fetch('/api/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          microInput: EMOTION_PHRASE[latestEmotion] ?? 'как я себя чувствую',
          plutchikProfile: { baseline: DEFAULT_PLUTCHIK },
          emotionalHistory: [],
          context: { hour: new Date().getHours() },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result && typeof data.result === 'object') {
          return serverResultToAromaRecommendation(data.result, goal, isStuck);
        }
      }
    } catch (e) {
      console.warn('[AromaRecommendation] server fallback triggered', e);
    }
  }

  return getLocalAromaRecommendation(history, requestedGoal);
};

export const getOilById = (oilId: string) => {
  return OILS_CATALOG.find(o => o.id === oilId) || OILS_CATALOG[0];
};
