import { useRef, useCallback } from "react";
import { detectFrame } from "./landmarks";
import { predictSign } from "./signModel";

/**
 * Captures landmarks for `durationMs` starting from when called, then
 * runs the sign model on what it collected.
 *
 * Fix vs previous version: the very first detectFrame() call can be slow
 * (MediaPipe model/WASM init), and that was happening *inside* the timed
 * window — eating most of the 1200ms budget and leaving < 5 frames.
 * Now: (1) a one-time untimed warm-up frame runs before the clock starts,
 * (2) a single bad/slow frame no longer aborts the whole capture, and
 * (3) the window can extend up to MAX_DURATION if frames are still short.
 */
export function useSignDetector() {
  const runningRef = useRef(false);
  const warmedRef = useRef(false);

  const captureAndPredict = useCallback(async (videoEl, durationMs = 1200) => {
    if (!videoEl) throw new Error("No video element — camera not ready.");

    // Video element may report "live" before it actually has frames.
    if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
      await new Promise((r) => setTimeout(r, 200));
    }

    // One-time warm-up, untimed, outside the capture window.
    if (!warmedRef.current) {
      try {
        await detectFrame(videoEl, performance.now());
        warmedRef.current = true;
      } catch (e) {
        console.warn("[sign] warm-up frame failed, continuing anyway:", e);
      }
    }

    runningRef.current = true;
    const frames = [];
    const start = performance.now();
    const MIN_FRAMES = 5;
    const MAX_DURATION = Math.max(durationMs, 2500); // ceiling for slow devices

    await new Promise((resolve) => {
      function tick() {
        if (!runningRef.current) { resolve(); return; }
        const now = performance.now();
        detectFrame(videoEl, now)
          .then((landmarks) => {
            frames.push(landmarks);
            const elapsed = now - start;
            const haveEnough = frames.length >= MIN_FRAMES && elapsed >= durationMs;
            if (haveEnough || elapsed >= MAX_DURATION) resolve();
            else requestAnimationFrame(tick);
          })
          .catch((e) => {
            // Don't abort the whole capture on one bad frame — keep going
            // until MAX_DURATION, same as a dropped frame.
            console.warn("[sign] frame detect failed, skipping frame:", e);
            const elapsed = performance.now() - start;
            if (elapsed >= MAX_DURATION) resolve();
            else requestAnimationFrame(tick);
          });
      }
      requestAnimationFrame(tick);
    });

    runningRef.current = false;

    if (frames.length < MIN_FRAMES) {
      throw new Error(
        `Too few frames captured (${frames.length}/${MIN_FRAMES}). Camera may be slow on this device — try again.`
      );
    }
    return predictSign(frames, 3);
  }, []);

  const cancel = useCallback(() => {
    runningRef.current = false;
  }, []);

  return { captureAndPredict, cancel };
}
