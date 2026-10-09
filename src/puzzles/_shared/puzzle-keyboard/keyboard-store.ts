import { useSyncExternalStore } from "react";

export const DEVICE_KEYBOARD_KEY = "ludwig:device-keyboard";
export const PAD_LABEL = "Keyboard";

const TOUCH_QUERY = "(pointer: coarse) and (max-width: 47.999rem)";

const listeners = new Set<() => void>();
let hardwareSeen = false;
let padMounts = 0;
let deviceKeyboard: boolean | null = null;
let detach: (() => void) | null = null;

const emit = () => listeners.forEach((listener) => listener());

function readSetting() {
  try {
    return localStorage.getItem(DEVICE_KEYBOARD_KEY) === "1";
  } catch {
    return false;
  }
}

function getDeviceKeyboard() {
  deviceKeyboard ??= readSetting();
  return deviceKeyboard;
}

export function setDeviceKeyboard(on: boolean) {
  deviceKeyboard = on;
  try {
    if (on) localStorage.setItem(DEVICE_KEYBOARD_KEY, "1");
    else localStorage.removeItem(DEVICE_KEYBOARD_KEY);
  } catch {}
  hardwareSeen = false;
  emit();
}

/** A tap on a grid brings the pad back after a physical key hid it. */
export function showPad() {
  if (!hardwareSeen) return;
  hardwareSeen = false;
  emit();
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (
    event.target instanceof Element &&
    event.target.closest(`[role="group"][aria-label="${PAD_LABEL}"]`)
  ) {
    return;
  }
  if (hardwareSeen) return;
  hardwareSeen = true;
  emit();
}

const touchMedia = () =>
  typeof window.matchMedia === "function"
    ? window.matchMedia(TOUCH_QUERY)
    : null;

function attach() {
  document.addEventListener("keydown", onKeyDown, true);
  const media = touchMedia();
  media?.addEventListener("change", emit);
  return () => {
    document.removeEventListener("keydown", onKeyDown, true);
    media?.removeEventListener("change", emit);
  };
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) detach = attach();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      detach?.();
      detach = null;
    }
  };
}

const padWanted = () =>
  touchMedia()?.matches === true && !getDeviceKeyboard() && !hardwareSeen;

const onTouchPhone = () => touchMedia()?.matches === true;

const padActive = () => padMounts > 0 && padWanted();

/** Registers a mounted `PuzzleKeyboard`, so grids only drop the system keyboard when a pad stands in for it. */
export function registerPad() {
  padMounts += 1;
  emit();
  return () => {
    padMounts -= 1;
    emit();
  };
}

/** Whether the on-screen pad is the input method: a touch phone, a pad mounted, no hardware key seen and the device-keyboard setting off. */
export function usePuzzleKeyboard() {
  return useSyncExternalStore(subscribe, padActive, () => false);
}

/** Whether the layout is the touch phone one, whatever input method is in use. */
export function useTouchPhone() {
  return useSyncExternalStore(subscribe, onTouchPhone, () => false);
}

/** Whether the pad would show if it were mounted. */
export function usePadWanted() {
  return useSyncExternalStore(subscribe, padWanted, () => false);
}

export function useDeviceKeyboard() {
  return useSyncExternalStore(subscribe, getDeviceKeyboard, () => false);
}

export function resetKeyboardStore() {
  hardwareSeen = false;
  padMounts = 0;
  deviceKeyboard = null;
  emit();
}
