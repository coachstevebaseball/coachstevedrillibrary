/**
 * Haptic feedback utilities using the Vibration API.
 * Falls back gracefully on devices that don't support vibration.
 */

/** Check if vibration is supported */
const canVibrate = () => typeof navigator !== "undefined" && "vibrate" in navigator;

/** Light tap — used for button presses, selections */
export function hapticLight() {
  if (canVibrate()) navigator.vibrate(10);
}

/** Medium tap — used for completing actions, toggling states */
export function hapticMedium() {
  if (canVibrate()) navigator.vibrate(20);
}

/** Heavy tap — used for destructive actions, errors */
export function hapticHeavy() {
  if (canVibrate()) navigator.vibrate(40);
}

/** Success pattern — used for drill completion, achievements */
export function hapticSuccess() {
  if (canVibrate()) navigator.vibrate([15, 50, 15, 50, 30]);
}

/** Error pattern — used for validation errors, failed actions */
export function hapticError() {
  if (canVibrate()) navigator.vibrate([50, 30, 50]);
}

/** Celebration pattern — used for badges, streaks, milestones */
export function hapticCelebration() {
  if (canVibrate()) navigator.vibrate([10, 30, 10, 30, 10, 30, 50]);
}
