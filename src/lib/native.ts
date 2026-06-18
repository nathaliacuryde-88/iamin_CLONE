import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapacitorApp } from "@capacitor/app";
import { Keyboard } from "@capacitor/keyboard";

/**
 * Initialise Capacitor-only behaviours (status bar, hardware back, keyboard).
 * Safe no-op on the web.
 */
export const initNative = () => {
  if (!Capacitor.isNativePlatform()) return;

  // Match the dark glassmorphism theme.
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  if (Capacitor.getPlatform() === "android") {
    StatusBar.setBackgroundColor({ color: "#0B0B12" }).catch(() => {});
  }

  // Android hardware back: navigate back, exit on root.
  CapacitorApp.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapacitorApp.exitApp();
    }
  });

  // Hide accessory bar on iOS keyboard.
  try {
    Keyboard.setAccessoryBarVisible({ isVisible: false });
  } catch {
    /* keyboard plugin may not be present on every platform */
  }
};
