import { ComponentType } from 'react';
import { PracticeId } from '../../types';
import { PracticeTrackProps } from './types';
import { BodyScanPractice } from './BodyScanPractice';
import { Grounding54321Practice } from './Grounding54321Practice';
import { PMRPractice } from './PMRPractice';
import { FingerTracingPractice } from './FingerTracingPractice';
import { VibroPacingPractice } from './VibroPacingPractice';
import { ExpressiveWritingPractice } from './ExpressiveWritingPractice';
import { ThermalImageryPractice } from './ThermalImageryPractice';
import { MantraLoopPractice } from './MantraLoopPractice';

/** Реестр дорожек: `PRACTICE_BY_ID[id].component` → компонент. */
export const PRACTICE_COMPONENTS: Record<PracticeId, ComponentType<PracticeTrackProps>> = {
  bodyScan: BodyScanPractice,
  grounding54321: Grounding54321Practice,
  pmr: PMRPractice,
  fingerTracing: FingerTracingPractice,
  vibroPacing: VibroPacingPractice,
  expressiveWriting: ExpressiveWritingPractice,
  thermalImagery: ThermalImageryPractice,
  mantraLoop: MantraLoopPractice,
};
