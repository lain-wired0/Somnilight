import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const PRESETS_STORAGE_KEY = 'presets';
const ACTIVE_PRESET_ID_KEY = 'activePresetId';

/**
 * Saves all presets to local storage (AsyncStorage)
 * @param {Array} presets - Array of preset objects
 * @returns {Promise<void>}
 */
export const savePresetsToStorage = async (presets) => {
  try {
    const jsonString = JSON.stringify(presets);
    await AsyncStorage.setItem(PRESETS_STORAGE_KEY, jsonString);
    console.log('[PresetStorage] Presets saved successfully');
  } catch (error) {
    console.error('[PresetStorage] Error saving presets:', error);
    throw error;
  }
};

/**
 * Loads all presets from local storage
 * @returns {Promise<Array|null>} - Returns array of presets or null if none saved
 */
export const loadPresetsFromStorage = async () => {
  try {
    const jsonString = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
    if (jsonString === null) {
      console.log('[PresetStorage] No presets found in storage');
      return null;
    }
    const presets = JSON.parse(jsonString);
    console.log('[PresetStorage] Presets loaded successfully:', presets.length, 'presets');
    return presets;
  } catch (error) {
    console.error('[PresetStorage] Error loading presets:', error);
    throw error;
  }
};

/**
 * Saves the currently active preset ID
 * @param {string|null} presetId - The ID of the active preset, or null to clear
 * @returns {Promise<void>}
 */
export const saveActivePresetId = async (presetId) => {
  try {
    if (presetId === null || presetId === undefined) {
      await AsyncStorage.removeItem(ACTIVE_PRESET_ID_KEY);
      console.log('[PresetStorage] Active preset ID cleared');
    } else {
      await AsyncStorage.setItem(ACTIVE_PRESET_ID_KEY, presetId);
      console.log('[PresetStorage] Active preset ID saved:', presetId);
    }
  } catch (error) {
    console.error('[PresetStorage] Error saving active preset ID:', error);
    throw error;
  }
};

/**
 * Loads the currently active preset ID
 * @returns {Promise<string|null>} - Returns preset ID or null if none saved
 */
export const loadActivePresetId = async () => {
  try {
    const presetId = await AsyncStorage.getItem(ACTIVE_PRESET_ID_KEY);
    if (presetId === null) {
      console.log('[PresetStorage] No active preset ID found in storage');
      return null;
    }
    console.log('[PresetStorage] Active preset ID loaded:', presetId);
    return presetId;
  } catch (error) {
    console.error('[PresetStorage] Error loading active preset ID:', error);
    throw error;
  }
};

/**
 * Deletes all presets from storage (use with caution)
 * @returns {Promise<void>}
 */
export const clearPresetsStorage = async () => {
  try {
    await AsyncStorage.removeItem(PRESETS_STORAGE_KEY);
    await AsyncStorage.removeItem(ACTIVE_PRESET_ID_KEY);
    console.log('[PresetStorage] All presets cleared from storage');
  } catch (error) {
    console.error('[PresetStorage] Error clearing presets:', error);
    throw error;
  }
};
