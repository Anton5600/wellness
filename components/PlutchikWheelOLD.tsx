import React from 'react';
import { PlutchikVector, EmotionKey } from '../types';

interface PlutchikWheelProps {
  vector: PlutchikVector;
  baseline?: PlutchikVector;
  interactive?: boolean;
  onChange?: (newVector: PlutchikVector) => void;
  size?: number;
}

interface EmotionMeta {
  key: EmotionKey;
  label: string;
  color: string;
  lightColor: string;
  angle: number; // in degrees
}

const EMOTIONS: EmotionMeta[] = [
  { key: 'joy', label: 'Радость', color: '#f59e0b', lightColor: '#fef3c7', angle: 0 },
  { key: 'trust', label: 'Доверие', color: '#10b981', lightColor: '#d1fae5', angle: 45 },
  { key: 'fear', label: 'Страх', color: '#059669', lightColor: '#a7f3d0', angle: 90 },
  { key: 'surprise', label: 'Удивление', color: '#0284c7', lightColor: '#e0f2fe', angle: 135 },
  { key: 'sadness', label: 'Печаль', color: '#3b82f6', lightColor: '#dbeafe', angle: 180 },
  { key: 'disgust', label: 'Отвращение', color: '#8b5cf6', lightColor: '#ede9fe', angle: 225 },
  { key: 'anger', label: 'Гнев', color: '#ef4444', lightColor: '#fee2e2', angle: 270 },
  { key: 'anticipation', label: 'Ожидание', color: '#f97316', lightColor: '#ffedd5', angle: 315 },
];

export const PlutchikWheel: React.FC<PlutchikWheelProps> = ({
  vector,
  baseline,
  interactive = false,
  onChange,
  size = 320,
}) => {
  const center = size / 2;
  const maxRadius = size * 0.4;

  const getCoordinates = (angleDeg: number, val: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const r = maxRadius * Math.max(0.1, Math.min(1.0, val));
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
    };
  };

  // Generate polygon points for the vector
  const points = EMOTIONS.map((e) => {
    const val = vector[e.key] ?? 0.5;
    const { x, y } = getCoordinates(e.angle, val);
    return `${x},${y}`;
  }).join(' ');

  // Optional baseline polygon points
  const baselinePoints = baseline
    ? EMOTIONS.map((e) => {
        const val = baseline[e.key] ?? 0.5;
        const { x, y } = getCoordinates(e.angle, val);
        return `${x},${y}`;
      }).join(' ')
    : null;

  const handleSectorClick = (key: EmotionKey) => {
    if (!interactive || !onChange) return;
    const current = vector[key] ?? 0.5;
    const nextVal = current >= 1.0 ? 0.2 : parseFloat((current + 0.2).toFixed(1));
    onChange({ ...vector, [key]: nextVal });
  };

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Radial Grid Lines */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={maxRadius * level}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-stone-200 dark:text-stone-800"
            strokeDasharray={level === 1.0 ? 'none' : '3 3'}
          />
        ))}

        {/* Axis lines and petal sectors */}
        {EMOTIONS.map((e) => {
          const { x, y } = getCoordinates(e.angle, 1.0);
          const val = vector[e.key] ?? 0.5;
          const currentPoint = getCoordinates(e.angle, val);

          return (
            <g key={e.key} onClick={() => handleSectorClick(e.key)} className={interactive ? 'cursor-pointer hover:opacity-80' : ''}>
              {/* Axis Line */}
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-stone-300 dark:text-stone-700"
              />

              {/* Point Indicator */}
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="6"
                fill={e.color}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-300 shadow-md"
              />

              {/* Label */}
              <text
                x={getCoordinates(e.angle, 1.18).x}
                y={getCoordinates(e.angle, 1.18).y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight="700"
                fill={e.color}
              >
                {e.label}
              </text>
            </g>
          );
        })}

        {/* Baseline polygon if present */}
        {baselinePoints && (
          <polygon
            points={baselinePoints}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-60"
          />
        )}

        {/* Current Vector Polygon */}
        <polygon
          points={points}
          fill="rgba(152, 194, 129, 0.35)"
          stroke="#98c281"
          strokeWidth="3"
          strokeLinejoin="round"
          className="transition-all duration-500 drop-shadow-md"
        />
      </svg>

      {/* Dominant emotion pill */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {EMOTIONS.map((e) => {
          const val = vector[e.key] ?? 0;
          return (
            <div
              key={e.key}
              onClick={() => handleSectorClick(e.key)}
              style={{ backgroundColor: e.lightColor, color: e.color }}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-black/5 transition-transform ${
                interactive ? 'cursor-pointer hover:scale-105' : ''
              }`}
            >
              <span>{e.label}</span>
              <span className="opacity-75">{Math.round(val * 100)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
