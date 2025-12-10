// LightServerSync.js
// Shared server sync logic for brightness/color
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'http://150.158.158.233:1880';
const THROTTLE_INTERVAL = 200;
let lastSendTime = 0;
let abortControllerRef = null;

export async function sendLightStateToServer(payload) {
  const now = Date.now();
  const timeSinceLastSend = now - lastSendTime;
  // Throttle
  if (timeSinceLastSend < THROTTLE_INTERVAL) {
    if (payload.brightness !== undefined) {
      AsyncStorage.setItem('last_brightness', payload.brightness.toString()).catch(() => {});
    }
    if (payload.color !== undefined) {
      AsyncStorage.setItem('last_color', payload.color).catch(() => {});
    }
    return;
  }
  lastSendTime = now;
  // Cancel any pending request
  if (abortControllerRef) {
    abortControllerRef.abort();
  }
  if (payload.brightness !== undefined) {
    AsyncStorage.setItem('last_brightness', payload.brightness.toString()).catch(() => {});
  }
  if (payload.color !== undefined) {
    AsyncStorage.setItem('last_color', payload.color).catch(() => {});
  }
  try {
    const controller = new AbortController();
    abortControllerRef = controller;
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${SERVER_URL}/set_state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    abortControllerRef = null;
    if (!response.ok) {
      console.warn(`[LightServerSync] Server returned error status: ${response.status}`);
      return;
    }
    // Optionally log response
  } catch (err) {
    abortControllerRef = null;
    if (err.name === 'AbortError') {
      console.log('[LightServerSync] Request cancelled or timeout');
    } else {
      console.error('[LightServerSync] Failed to POST /set_state', err);
    }
  }
}
