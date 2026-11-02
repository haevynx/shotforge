// Store export sizes. `scale` is the browser deviceScaleFactor: the viewport
// (w/scale × h/scale) must be a whole number so the output is pixel-exact.
export interface Target {
  id: string;
  label: string;
  platform: 'ios' | 'android';
  w: number;
  h: number;
  scale: number;
}

export const TARGETS: Record<string, Target> = {
  'ios-6.9': {id: 'ios-6.9', label: 'iPhone 6.9" (required by the App Store)', platform: 'ios', w: 1320, h: 2868, scale: 3},
  'ios-6.5': {id: 'ios-6.5', label: 'iPhone 6.5"', platform: 'ios', w: 1284, h: 2778, scale: 3},
  'android-phone': {id: 'android-phone', label: 'Google Play phone (2:1)', platform: 'android', w: 1080, h: 2160, scale: 2.7},
};

// Every layout is designed on a 320-unit wide canvas; the height follows the target's aspect ratio.
export const DESIGN_W = 320;

export function getTarget(id: string): Target {
  const t = TARGETS[id];
  if (!t) throw new Error(`Unknown target "${id}". Valid targets: ${Object.keys(TARGETS).join(', ')}`);
  return t;
}

export function viewportOf(t: Target) {
  return {width: Math.round(t.w / t.scale), height: Math.round(t.h / t.scale)};
}

export function designHeight(t: Target) {
  return (t.h / t.w) * DESIGN_W;
}
