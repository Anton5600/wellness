import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

export interface CapgoUpdateInfo {
  version: string;
  url?: string;
}

/**
 * Checks and initializes Capgo updates.
 * Must be safe to call on all platforms (web, iOS, Android).
 */
export const initializeCapgoUpdate = async (): Promise<void> => {
  if (!Capacitor.isPluginAvailable('CapacitorUpdater')) {
    console.log('[CapgoUpdate] CapacitorUpdater is not available on this platform.');
    return;
  }

  try {
    // CRITICAL: Notify Capgo that the current version is working fine.
    // This prevents the plugin from automatically rolling back to the previous stable version.
    await CapacitorUpdater.notifyAppReady();
    console.log('[CapgoUpdate] App marked as ready (preventing rollbacks).');

    // Get current version details
    const current = await CapacitorUpdater.current();
    console.log('[CapgoUpdate] Current active update version:', current);
  } catch (error) {
    console.error('[CapgoUpdate] Error during Capgo initialization:', error);
  }
};

/**
 * Manually downloads and installs an update from a specific ZIP file URL.
 * Great for custom self-hosted OTA updates or testing.
 */
export const performManualUpdate = async (zipUrl: string, versionId: string): Promise<void> => {
  if (!Capacitor.isPluginAvailable('CapacitorUpdater')) {
    console.error('[CapgoUpdate] CapacitorUpdater is not available.');
    return;
  }

  try {
    console.log(`[CapgoUpdate] Downloading update: ${versionId} from ${zipUrl}...`);
    
    const version = await CapacitorUpdater.download({
      url: zipUrl,
      version: versionId,
    });

    console.log('[CapgoUpdate] Download complete. Activating update...');
    await CapacitorUpdater.set({ id: version.id });
    
    console.log('[CapgoUpdate] Activation complete. App will reload with the new version.');
  } catch (error) {
    console.error('[CapgoUpdate] Failed to perform manual OTA update:', error);
    throw error;
  }
};
