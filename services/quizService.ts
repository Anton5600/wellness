
import { EmotionKey, EmotionData } from '../types';
import { EMOTIONS } from '../constants';

export const calculateResult = (answers: EmotionKey[]): EmotionData => {
  if (answers.length === 0) {
    // Default to a neutral state if no answers are provided
    return EMOTIONS.anticipation;
  }

  const frequencyMap: Record<string, number> = {};
  for (const emotion of answers) {
    frequencyMap[emotion] = (frequencyMap[emotion] || 0) + 1;
  }

  let dominantEmotion: EmotionKey = answers[0];
  let maxCount = 0;

  for (const emotion in frequencyMap) {
    if (frequencyMap[emotion] > maxCount) {
      maxCount = frequencyMap[emotion];
      dominantEmotion = emotion as EmotionKey;
    }
  }

  return EMOTIONS[dominantEmotion];
};
