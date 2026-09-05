// Кодирование сырого PCM микрофона в формат LPCM (моно, 16 бит, 16 кГц),
// который принимает Yandex SpeechKit (`stt:recognize?format=lpcm`).
//
// WebView-`MediaRecorder` на Android выдаёт только `audio/webm;codecs=opus`,
// а SpeechKit v1 разбирает OggOpus/LPCM/MP3 — WebM он не понимает и молча
// возвращает пустой результат. Поэтому вместо MediaRecorder берём сэмплы
// напрямую из AudioContext (ScriptProcessorNode) и перекодируем их в LPCM.

export const STT_SAMPLE_RATE = 16000;

/** Линейная интерполяция-децимация из srcRate в dstRate (понижение частоты). */
export function resampleLinear(
  samples: Float32Array,
  srcRate: number,
  dstRate: number,
): Float32Array {
  if (srcRate <= 0 || dstRate <= 0 || srcRate === dstRate) return samples;
  const ratio = srcRate / dstRate;
  const outLen = Math.max(0, Math.floor(samples.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = pos | 0;
    const frac = pos - idx;
    const a = samples[idx];
    const b = idx + 1 < samples.length ? samples[idx + 1] : a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

/** Float32 в диапазоне [-1, 1] → 16-битный PCM little-endian. */
export function floatToPcm16(samples: Float32Array): Int16Array<ArrayBuffer> {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i] < -1 ? -1 : samples[i] > 1 ? 1 : samples[i];
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** Float32-сэмплы (любая частота) → LPCM-Int16 на 16 кГц для SpeechKit. */
export function encodeSttPcm(samples: Float32Array, srcRate: number): Int16Array<ArrayBuffer> {
  return floatToPcm16(resampleLinear(samples, srcRate, STT_SAMPLE_RATE));
}
