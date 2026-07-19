import React, { useState } from 'react';

interface EmotionSymbolProps {
  emotionKey: string;
  className?: string;
  size?: number;
}

export const EmotionSymbol: React.FC<EmotionSymbolProps> = ({ emotionKey, className = '', size = 100 }) => {
  const [hasError, setHasError] = useState(false);
  const imagePath = `/symbols/symbol_${emotionKey}.png`;

  if (hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20 rounded-2xl shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="material-symbols-outlined text-gray-400 opacity-60" style={{ fontSize: size * 0.3 }}>add_photo_alternate</span>
        <span className="text-[10px] text-gray-400 mt-2 font-mono opacity-80">{emotionKey}.png</span>
      </div>
    );
  }

  return (
    <img 
      src={imagePath}
      alt={`Символ: ${emotionKey}`}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={() => setHasError(true)}
    />
  );
};
