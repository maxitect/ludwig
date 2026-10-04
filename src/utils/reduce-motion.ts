export const REDUCE_MOTION_KEY = "reduce-motion";
export const REDUCE_MOTION_ATTRIBUTE = "data-reduce-motion";

/** Runs in <head> before first paint: the cookie mirrors the signed-in account's reduce_motion setting. */
export const reduceMotionInitScript = `(function(){try{if(/(?:^|; )${REDUCE_MOTION_KEY}=1(?:;|$)/.test(document.cookie))document.documentElement.setAttribute("${REDUCE_MOTION_ATTRIBUTE}","")}catch(e){}})()`;

export function applyReduceMotion(reduceMotion: boolean) {
  const root = document.documentElement;
  if (reduceMotion) root.setAttribute(REDUCE_MOTION_ATTRIBUTE, "");
  else root.removeAttribute(REDUCE_MOTION_ATTRIBUTE);
  document.cookie = `${REDUCE_MOTION_KEY}=${reduceMotion ? 1 : ""}; path=/; max-age=${reduceMotion ? 31536000 : 0}; SameSite=Lax`;
}
