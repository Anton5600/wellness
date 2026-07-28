import { registerPlugin, Capacitor } from '@capacitor/core';

export interface AppUpdateInfo {
  updateAvailability: number; // 1 = UPDATE_NOT_AVAILABLE, 2 = UPDATE_AVAILABLE, 3 = DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
  installStatus: number;      // 0 = UNKNOWN, 1 = PENDING, 2 = DOWNLOADING, 3 = DOWNLOADED, 4 = INSTALLING, etc.
  availableVersionCode: number;
}

export interface RuStoreAppUpdatePlugin {
  getAppUpdateInfo(): Promise<AppUpdateInfo>;
  startUpdateFlow(options: { type: number }): Promise<void>;
  completeUpdate(): Promise<void>;
}

// Safely register the Capacitor plugin.
// If the plugin is not present, it will safely reject or not be defined on other platforms.
const RuStoreAppUpdate = registerPlugin<RuStoreAppUpdatePlugin>('RuStoreAppUpdate');

/**
 * Checks for updates in RuStore.
 * Designed to be safe to run on any platform (web, iOS, Android).
 */
export const checkAndPromptRuStoreUpdate = async (
  onUpdateAvailable?: (info: AppUpdateInfo, startUpdate: () => Promise<void>) => void
): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[RuStoreUpdate] Not on Android, skipping RuStore update check.');
    return;
  }

  try {
    console.log('[RuStoreUpdate] Fetching app update info from RuStore...');
    const info = await RuStoreAppUpdate.getAppUpdateInfo();
    console.log('[RuStoreUpdate] RuStore App Update Info:', info);

    // updateAvailability: 2 = UPDATE_AVAILABLE
    if (info.updateAvailability === 2) {
      const startUpdate = async () => {
        try {
          console.log('[RuStoreUpdate] Starting update flow...');
          await RuStoreAppUpdate.startUpdateFlow({ type: 1 }); // 1 = IMMEDIATE (0 = FLEXIBLE)
        } catch (error) {
          console.error('[RuStoreUpdate] Failed to start update flow:', error);
        }
      };

      if (onUpdateAvailable) {
        onUpdateAvailable(info, startUpdate);
      } else {
        // Automatic immediate update
        await startUpdate();
      }
    } else {
      console.log('[RuStoreUpdate] App is up-to-date.');
    }
  } catch (error) {
    console.error('[RuStoreUpdate] Failed to check for RuStore updates:', error);
  }
};
