import { TOTAL_POINTS } from "./landmarks";

// tfjs-core and tfjs-tflite are loaded via <script> tags in index.html
// (the package's own documented working method — its npm/ESM build is
// broken for bundlers, confirmed by testing it directly). Reference the
// globals they attach to window instead of importing them.
const tf = window.tf;
const tflite = window.tflite;

let modelPromise = null;
let labelMapPromise = null;
let indexToLabel = null;

export async function loadSignModel() {
  if (!modelPromise) {
    modelPromise = tflite.loadTFLiteModel("/model.tflite");
  }
  if (!labelMapPromise) {
    labelMapPromise = fetch("/sign_to_prediction_index_map.json").then((r) => {
      if (!r.ok) throw new Error(`Label map fetch failed: ${r.status}`);
      return r.json();
    });
  }

  const [model, labelMap] = await Promise.all([modelPromise, labelMapPromise]);

  if (!indexToLabel) {
    const entries = Object.entries(labelMap).sort((a, b) => a[1] - b[1]);
    if (entries.length !== 250) {
      throw new Error(
        `Label map has ${entries.length} entries, expected 250 — wrong file, stop here.`
      );
    }
    indexToLabel = entries.map(([word]) => word);
  }

  return model;
}

/** Same defensive softmax check as the Dart version: only transforms
 * output if it doesn't already look like a probability distribution. */
function softmaxIfNeeded(arr) {
  const sum = arr.reduce((a, b) => a + b, 0);
  const hasNeg = arr.some((v) => v < 0);
  if (!hasNeg && Math.abs(sum - 1) < 0.05) return arr;

  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const expSum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / expSum);
}

/**
 * CONFIRMED from the runtime error (not a guess): this model's input
 * shape is exactly (1, 543, 3) — a single landmark frame, no time axis.
 * Earlier code fed the whole frame sequence as one (1, N, 543, 3)
 * batch, which is why it threw a shape-mismatch error every time.
 *
 * Fix: run the model once per captured frame, then average the
 * per-frame class probabilities to get one stable prediction across
 * the whole 1.2s capture window — this also smooths over a frame or
 * two of bad/missing hand landmarks instead of letting one frame
 * decide the whole result.
 *
 * frames: array of Float32Array(543*3), one per captured video frame.
 */
export async function predictSign(frames, topK = 3) {
  const model = await loadSignModel();
  const numClasses = indexToLabel.length;
  const accum = new Float64Array(numClasses);
  let usable = 0;

  for (const frame of frames) {
    const inputTensor = tf.tensor(frame, [1, TOTAL_POINTS, 3], "float32");
    let outputTensor;
    try {
      outputTensor = model.predict(inputTensor);
    } catch (e) {
      console.warn("[sign] predict() failed on one frame, skipping it:", e);
      inputTensor.dispose();
      continue;
    }
    inputTensor.dispose();

    const raw = Array.from(await outputTensor.data());
    outputTensor.dispose();

    const probs = softmaxIfNeeded(raw);
    for (let i = 0; i < numClasses; i++) accum[i] += probs[i];
    usable += 1;
  }

  if (usable === 0) {
    throw new Error("No frame could be run through the model — every predict() call failed.");
  }

  const avgProbs = Array.from(accum, (v) => v / usable);

  const ranked = avgProbs
    .map((p, i) => ({ label: indexToLabel[i], classIndex: i, confidence: p }))
    .sort((a, b) => b.confidence - a.confidence);

  return ranked.slice(0, topK);
}