// VolumeServerSync.js
// Shared server sync logic for volume/music
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'http://150.158.158.233:1880';
const THROTTLE_INTERVAL = 200;
let lastSendTime = 0;
let abortControllerRef = null;

export async function sendVolumeToServer(payload) {
  const now = Date.now();
  const timeSinceLastSend = now - lastSendTime;
  
  // Throttle
  if (timeSinceLastSend < THROTTLE_INTERVAL) {
    if (payload.volume !== undefined) {
      AsyncStorage.setItem('last_volume', payload.volume.toString()).catch(() => {});
    }
    return;
  }
  
  lastSendTime = now;
  
  // Cancel any pending request
  if (abortControllerRef) {
    abortControllerRef.abort();
  }
  
  if (payload.volume !== undefined) {
    AsyncStorage.setItem('last_volume', payload.volume.toString()).catch(() => {});
  }
  
  try {
    const controller = new AbortController();
    abortControllerRef = controller;
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${SERVER_URL}/set_volume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    abortControllerRef = null;
    
    if (!response.ok) {
      console.warn(`[VolumeServerSync] Server returned error status: ${response.status}`);
      return;
    }
  } catch (err) {
    abortControllerRef = null;
    if (err.name === 'AbortError') {
      console.log('[VolumeServerSync] Request cancelled or timeout');
    } else {
      console.error('[VolumeServerSync] Failed to POST /set_volume', err);
    }
  }
}
