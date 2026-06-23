import {
  FilesetResolver,
  FaceLandmarker,
  PoseLandmarker,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

// Using three separate, mature landmarkers instead of the combined
// HolisticLandmarker task. Google's own docs flag that combined task as
// "an upgraded version coming soon," and there are open bug reports
// (model-fetch failures, GPU delegate crashes) — not worth building on
// right now. These three model URLs are each confirmed working across
// multiple independent tutorials/notebooks, not guessed.

const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// Layout the sign model expects, per frame. Must match the order used
// to build the Kaggle asl-signs training data exactly — wrong order
// produces confident, wrong predictions with no error thrown.
const FACE_POINTS = 468;
const LEFT_HAND_POINTS = 21;
const POSE_POINTS = 33;
const RIGHT_HAND_POINTS = 21;
export const TOTAL_POINTS =
  FACE_POINTS + LEFT_HAND_POINTS + POSE_POINTS + RIGHT_HAND_POINTS; // 543

let landmarkersPromise = null;

async function initLandmarkers() {
  if (!landmarkersPromise) {
    landmarkersPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );
      const [face, pose, hand] = await Promise.all([
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL },
          runningMode: "VIDEO",
          numFaces: 1,
        }),
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL },
          runningMode: "VIDEO",
          numPoses: 1,
        }),
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL },
          runningMode: "VIDEO",
          numHands: 2,
        }),
      ]);
      return { face, pose, hand };
    })();
  }
  return landmarkersPromise;
}

function writeBlock(out, offsetPoints, maxPoints, points) {
  for (let i = 0; i < maxPoints; i++) {
    const base = (offsetPoints + i) * 3;
    const p = points?.[i];
    out[base] = p ? p.x : 0;
    out[base + 1] = p ? p.y : 0;
    out[base + 2] = p ? p.z ?? 0 : 0;
  }
}

/**
 * Confirmed from MediaPipe docs: handedness assumes a MIRRORED input
 * image (selfie-style). Our raw <video> frame is NOT mirrored (the
 * scaleX(-1) on the video element is CSS display-only, doesn't touch
 * the actual pixel data MediaPipe reads). So we swap the labels here —
 * this is the documented fix, not a guess.
 */
function splitHandsByHandedness(handResult) {
  let left = null;
  let right = null;
  handResult.handednesses?.forEach((h, i) => {
    const label = h[0]?.categoryName; // "Left" | "Right" (pre-swap)
    if (label === "Left") right = handResult.landmarks[i]; // swapped
    else if (label === "Right") left = handResult.landmarks[i]; // swapped
  });
  return { left, right };
}

/**
 * Runs all three landmarkers on one video frame and returns a flat
 * Float32Array of length 543*3 in face -> left_hand -> pose -> right_hand
 * order.
 */
export async function detectFrame(videoEl, timestampMs) {
  const { face, pose, hand } = await initLandmarkers();

  const faceResult = face.detectForVideo(videoEl, timestampMs);
  const poseResult = pose.detectForVideo(videoEl, timestampMs);
  const handResult = hand.detectForVideo(videoEl, timestampMs);
  const { left, right } = splitHandsByHandedness(handResult);

  const out = new Float32Array(TOTAL_POINTS * 3);
  writeBlock(out, 0, FACE_POINTS, faceResult.faceLandmarks?.[0]);
  writeBlock(out, FACE_POINTS, LEFT_HAND_POINTS, left);
  writeBlock(
    out,
    FACE_POINTS + LEFT_HAND_POINTS,
    POSE_POINTS,
    poseResult.landmarks?.[0]
  );
  writeBlock(
    out,
    FACE_POINTS + LEFT_HAND_POINTS + POSE_POINTS,
    RIGHT_HAND_POINTS,
    right
  );
  return out;
}
