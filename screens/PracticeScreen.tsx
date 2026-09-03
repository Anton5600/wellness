import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EmotionalGraphEntry, PracticeId } from '../types';
import { PRACTICE_BY_ID } from '../data/practices';
import { compassService } from '../services/compassService';
import { inferArousal } from '../services/recommendation/practice';
import { PracticePlayer } from '../components/PracticePlayer';

/**
 * Экран соматической практики (immersive, без BottomNavBar).
 * Маршрут `/practice/:id`. Невалидный id → на главную.
 */
const PracticeScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [entry, setEntry] = useState<EmotionalGraphEntry | null>(null);
  const [starters, setStarters] = useState<string[] | undefined>(undefined);

  const def = id ? PRACTICE_BY_ID[id as PracticeId] : undefined;

  useEffect(() => {
    compassService.setCurrentUserId(user?.uid);
    let cancelled = false;
    compassService.getTodayEntry().then((e) => {
      if (!cancelled) setEntry(e);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Затравки для Expressive Writing: AI при наличии ключей, иначе фолбэк в компоненте.
  useEffect(() => {
    if (def?.id !== 'expressiveWriting') return;
    let cancelled = false;
    fetch('/api/ai/practice-starters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        microInput: entry?.microInput ?? '',
        dominant: entry?.dominant ?? 'anticipation',
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.starters) && d.starters.length > 0) {
          setStarters(d.starters);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [def?.id, entry?.dominant, entry?.microInput]);

  if (!def) return <Navigate to="/" replace />;

  const dominant = entry?.dominant ?? 'anticipation';

  return (
    <PracticePlayer
      practiceId={def.id}
      dominant={dominant}
      arousal={inferArousal(dominant)}
      dayColor={entry?.color}
      uid={user?.uid ?? 'guest'}
      starters={starters}
      onExit={() => navigate(-1)}
    />
  );
};

export default PracticeScreen;
