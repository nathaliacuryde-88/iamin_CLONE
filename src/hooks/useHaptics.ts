import { useCallback, useEffect, useState } from "react";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export type HapticIntent =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

const STORAGE_KEY = "iamin.haptics";

const WEB_PATTERNS: Record<HapticIntent, number | number[]> = {
  selection: 8,
  light: 12,
  medium: 20,
  heavy: 35,
  success: [15, 40, 25],
  warning: [20, 60, 20],
  error: [30, 50, 30, 50, 30],
};

const isEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
};

const isNative = (): boolean => {
  try {
    return Capacitor?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
};

const fireNative = async (intent: HapticIntent) => {
  try {
    switch (intent) {
      case "selection":
        await Haptics.selectionStart();
        await Haptics.selectionEnd();
        return;
      case "light":
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      case "medium":
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      case "heavy":
        await Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      case "success":
        await Haptics.notification({ type: NotificationType.Success });
        return;
      case "warning":
        await Haptics.notification({ type: NotificationType.Warning });
        return;
      case "error":
        await Haptics.notification({ type: NotificationType.Error });
        return;
    }
  } catch {
    /* silent */
  }
};

const fireWeb = (intent: HapticIntent) => {
  try {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate !== "function") return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    navigator.vibrate(WEB_PATTERNS[intent]);
  } catch {
    /* silent */
  }
};

const fire = (intent: HapticIntent) => {
  if (!isEnabled()) return;
  if (isNative()) {
    void fireNative(intent);
  } else {
    fireWeb(intent);
  }
};

/**
 * useHaptics — returns a stable haptic() function.
 * Uses native iOS/Android haptics inside Capacitor; falls back to the web
 * Vibration API in the browser. No-op when the user disabled haptics.
 */
export const useHaptics = () => {
  const haptic = useCallback((intent: HapticIntent) => fire(intent), []);
  return haptic;
};

/**
 * useHapticsPref — read/write the user toggle (default: on).
 */
export const useHapticsPref = (): [boolean, (v: boolean) => void] => {
  const [enabled, setEnabledState] = useState<boolean>(() => isEnabled());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEnabledState(isEnabled());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      /* ignore */
    }
    setEnabledState(v);
    if (v) fire("light");
  }, []);

  return [enabled, setEnabled];
};
