/**
 * ServerSync.js
 * 
 * Handles all server synchronization operations for the Somnilight app.
 * Manages communication with the Node-RED backend at http://somnilight.online:1880/
 * 
 * Includes debouncing to limit sync frequency and reduce internet traffic.
 */

import { Alert } from 'react-native';

const SERVER_URL = 'http://somnilight.online:1880';
const ALARM_SYNC_ENDPOINT = `${SERVER_URL}/pillow/alarm`;

// Configuration: adjust this to change the minimum time between syncs (in milliseconds)
const SYNC_DEBOUNCE_INTERVAL = 5000; // 3 seconds - change this value to adjust sync frequency

// State management for debouncing
let lastSyncTime = 0;
let pendingSyncAlarm = null;
let syncTimeout = null;
let lastFailureAlarmShown = null; // Track the last failed alarm config to prevent duplicate alerts
let isAlertCurrentlyVisible = false; // Track if an alert is currently visible on screen

/**
 * Debounced sync function that respects the SYNC_DEBOUNCE_INTERVAL
 * If called multiple times within the interval, only the latest alarm config is synced
 * Ensures the final state is uploaded when changes stop
 * 
 * @param {Object} alarmConfig - Active alarm configuration object
 * @param {Function} onRetry - Callback function to retry sync if it fails
 * @returns {Promise<void>}
 */
export const syncAlarmToServerDebounced = async (alarmConfig, onRetry) => {
    // Store the latest alarm config
    pendingSyncAlarm = alarmConfig;
    
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime;
    
    // Clear any pending timeout
    if (syncTimeout) {
        clearTimeout(syncTimeout);
    }
    
    // If enough time has passed since last sync, sync immediately
    if (timeSinceLastSync >= SYNC_DEBOUNCE_INTERVAL) {
        console.log(`[Sync] Executing immediate sync (${timeSinceLastSync}ms since last sync)`);
        await performSync(alarmConfig, onRetry);
    } else {
        // Schedule a sync after the debounce interval
        const waitTime = SYNC_DEBOUNCE_INTERVAL - timeSinceLastSync;
        console.log(`[Sync] Debouncing sync (waiting ${waitTime}ms)`);
        
        syncTimeout = setTimeout(async () => {
            console.log('[Sync] Executing debounced sync with latest alarm config');
            if (pendingSyncAlarm) {
                await performSync(pendingSyncAlarm, onRetry);
            }
            syncTimeout = null;
        }, waitTime);
    }
};

/**
 * Force an immediate sync of the current pending alarm
 * Used to ensure final changes are uploaded when user navigates away or app closes
 * 
 * @param {Function} onRetry - Callback function to retry sync if it fails
 * @returns {Promise<void>}
 */
export const flushPendingSync = async (onRetry) => {
    if (syncTimeout) {
        clearTimeout(syncTimeout);
        syncTimeout = null;
    }
    
    if (pendingSyncAlarm) {
        console.log('[Sync] Flushing pending sync immediately');
        await performSync(pendingSyncAlarm, onRetry);
    }
};

/**
 * Perform the actual sync to the server
 * 
 * @param {Object} alarmConfig - Active alarm configuration object
 * @param {Function} onRetry - Callback function to retry sync if it fails
 * @returns {Promise<boolean>} - Returns true if sync succeeded, false if failed
 */
const performSync = async (alarmConfig, onRetry) => {
    try {
        console.log('Syncing alarm to server:', alarmConfig);
        
        const response = await fetch(ALARM_SYNC_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alarmConfig),
        });

        // Check if response is ok (status 200-299)
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Server alarm sync response:', data);

        // Update last sync time
        lastSyncTime = Date.now();
        pendingSyncAlarm = null; // Clear pending since we just synced
        lastFailureAlarmShown = null; // Reset failure alert state on successful sync

        // Check if server confirmed receipt
        if (data.received === true) {
            console.log('✓ Alarm successfully synced to server');
            return true;
        } else {
            // Server did not confirm receipt
            console.warn('Server did not confirm receipt:', data);
            showSyncFailureAlertOnce(alarmConfig, onRetry);
            return false;
        }
    } catch (error) {
        console.error('Error syncing alarm to server:', error);
        showSyncFailureAlertOnce(alarmConfig, onRetry);
        return false;
    }
};

/**
 * Sync active alarm to the server (non-debounced version)
 * Currently, the server only supports active alarm data (single alarm)
 * 
 * @param {Object} alarmConfig - Active alarm configuration object
 *                               Format: { bedtime, sunrise_time, wakeup_time, days, name, preset_id, repeat_interval_min }
 * @param {Function} onRetry - Callback function to retry sync if it fails
 * @returns {Promise<boolean>} - Returns true if sync succeeded, false if failed
 */
export const syncAlarmToServer = async (alarmConfig, onRetry) => {
    return performSync(alarmConfig, onRetry);
};


/**
 * Show alert when server sync fails
 * Only shows the alert once per unique alarm config to prevent alert flooding
 * Ensures only one alert is visible at a time across all sync attempts
 * 
 * @param {Object} alarmConfig - The alarm configuration that failed to sync
 * @param {Function} onRetry - Callback function to execute when user taps Retry
 */
const showSyncFailureAlertOnce = (alarmConfig, onRetry) => {
    // Create a unique identifier for this alarm config to detect duplicates
    const currentConfigId = JSON.stringify(alarmConfig);
    
    // Prevent showing multiple alerts simultaneously
    if (isAlertCurrentlyVisible) {
        console.log('[Sync] Alert already visible on screen, suppressing duplicate alert');
        return;
    }
    
    // Only show alert if this is a different config than the last failure
    if (lastFailureAlarmShown === currentConfigId) {
        console.log('[Sync] Suppressing duplicate failure alert for same config');
        return;
    }
    
    // Update the last failure alert state
    lastFailureAlarmShown = currentConfigId;
    isAlertCurrentlyVisible = true;
    
    console.log('[Sync] Showing failure alert for sync attempt');
    Alert.alert(
        'Failed to sync with server',
        'Your changes are saved locally, but couldn\'t be synced to the server. Please check your connection and try again.',
        [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    isAlertCurrentlyVisible = false;
                },
            },
            {
                text: 'Retry',
                onPress: () => {
                    // Allow the next failure (even for the same config) to surface an alert
                    lastFailureAlarmShown = null;
                    isAlertCurrentlyVisible = false;
                    if (onRetry && typeof onRetry === 'function') {
                        onRetry();
                    }
                },
            },
        ],
        { cancelable: true, onDismiss: () => { isAlertCurrentlyVisible = false; } }
    );
};

/**
 * Fetch alarm configurations from the server
 * 
 * @returns {Promise<Object|null>} - Returns alarm configs object or null if fetch fails
 */
export const fetchAlarmConfigsFromServer = async () => {
    try {
        console.log('Fetching alarm configs from server...');
        
        const response = await fetch(`${SERVER_URL}/alarms/get`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched alarm configs from server:', data);
        
        return data.alarms || null;
    } catch (error) {
        console.error('Error fetching alarm configs from server:', error);
        return null;
    }
};

/**
 * Fetch active alarm from the server
 * 
 * @returns {Promise<Object|null>} - Returns active alarm config or null if fetch fails
 */
export const fetchActiveAlarmFromServer = async () => {
    try {
        console.log('Fetching active alarm from server...');
        
        const response = await fetch(`${SERVER_URL}/alarm/active`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched active alarm from server:', data);
        
        return data.alarm || null;
    } catch (error) {
        console.error('Error fetching active alarm from server:', error);
        return null;
    }
};
