🌱 Silent Voice — AAC Communication App with a Living Garden
A warm, accessible Augmentative and Alternative Communication (AAC) app built in React, with an on-device computer-vision layer underneath it. People who are nonverbal or speech-impaired can speak through text, pictures, sign language, or voice — and a gamified "garden" layer turns learning new words into something kids actually want to do.

Why this exists: most AAC tools are clinical, gray, and built for compliance, not joy. Silent Voice wraps the same core function — turning input into spoken output — around a companion character ("Luma") and a garden that grows as the person communicates more, so progress feels like progress, not therapy homework.

📸 Screenshots
A walkthrough of the app — onboarding, the Talk hub, sign language tools, accessibility settings, and the memory tree.

![Screenshot 1](screenshots/screenshot1.png)
![Screenshot 2](screenshots/screenshot2.png)
![Screenshot 3](screenshots/screenshot3.png)
![Screenshot 4](screenshots/screenshot4.png)
![Screenshot 5](screenshots/screenshot5.png)
![Screenshot 6](screenshots/screenshot6.png)
![Screenshot 7](screenshots/screenshot7.png)
![Screenshot 8](screenshots/screenshot8.png)
![Screenshot 9](screenshots/screenshot9.png)
![Screenshot 10](screenshots/screenshot10.png)
![Screenshot 11](screenshots/screenshot11.png)
![Screenshot 12](screenshots/screenshot12.png)
![Screenshot 13](screenshots/screenshot13.png)
![Screenshot 14](screenshots/screenshot14.png)
![Screenshot 15](screenshots/screenshot15.png)
![Screenshot 16](screenshots/screenshot16.png)
![Screenshot 17](screenshots/screenshot17.png)

✨ Features
| Feature | Status |
|---|---|
| Type → Voice (text-to-speech, slow-repeat mode) | ✅ Working |
| Voice → Sign (Web Speech API → ASL label lookup) | ✅ Working |
| Pick a Picture (symbol board) | ✅ Working |
| Dual-User Mode (face-to-face conversation aid) | ✅ Working |
| Sign Language Garden (gamified practice, live on-device hand/pose tracking) | ✅ Tracking live · ⏳ Auto-grading in progress |
| Sign → Voice (camera reads a sign, speaks the word) | ⏳ Blocked — see Bugs Fixed #4 |
| Blink to Speak / Code Corner (morse, manual input) | ✅ Working as manual input · ⏳ Real blink detection planned |
| Accessibility settings (reduce motion, high contrast, dyslexia spacing, adjustable touch targets, color-blind patterns) | ✅ Working |
| Memory Tree (history of every phrase spoken) | ✅ Working |
| Custom companion ("Luma" — 5 forms, 8 colors) + cartoon avatar companions | ✅ Working |

🏗️ Architecture
                ┌──────────────────┐
                │    App.jsx        │  Router + screen state
                └─────────┬─────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────────────────┐ ┌────────────────────┐
│  useCamera()  │ │   useSignDetector.js       │ │  Web Speech API     │
│  getUserMedia │ │   Timed capture, warm-up,  │ │  (browser native)   │
│  stream mgmt  │ │   retry logic              │ │  Voice → Sign        │
└───────────────┘ └─────────────┬─────────────┘ └────────────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  ▼                             ▼
          ┌───────────────┐             ┌────────────────────┐
          │ landmarks.js  │             │  signModel.js        │
          │ MediaPipe:    │             │  TFLite (tfjs-       │
          │ Face+Pose+    │             │  tflite), per-frame  │
          │ Hand Landmark │             │  inference + average │
          └───────────────┘             └────────────────────┘

🐛 Bugs Fixed
This project's main debugging arc was getting real, on-device computer vision (MediaPipe + TFLite) working in a browser — not a trivial integration. Logged here because the dead ends taught more than the easy parts did.

**1. "Too few frames captured" on every detection attempt**
MediaPipe's first inference call is slow (model/WASM warm-up), and that warm-up was happening *inside* the 1.2s timed capture window — eating most of the budget before a single usable frame landed. Fixed by running one untimed warm-up frame before starting the clock, and letting the window extend up to 2.5s on slower devices instead of giving up.

**2. `Can't initialize model` (TFLite)**
Looked like a model-format problem at first. It wasn't — the file `model.tflite` simply didn't exist anywhere in the project. Vite's dev server falls back to serving `index.html` for any unmatched path, so the loader was silently trying to parse an HTML page as a TFLite flatbuffer. Confirmed by checking the file's magic bytes (`TFL3` — should appear at byte offset 4 in a real `.tflite` file) and finding nothing there at all.

**3. `Input tensor shape mismatch: expect '1,543,3', got '1,8,543,3'`**
Assumed the model accepted a whole sequence of frames as one batch (a time axis). It doesn't — confirmed directly from the runtime's own error message, the model wants exactly one landmark frame per call, shape `(1, 543, 3)`. Fixed by calling `predict()` once per captured frame and averaging the resulting class probabilities in JS, instead of batching frames into the model.

**4. WASM `Aborted()` on every single frame, even with the correct shape — architectural dead end**
Not a code bug. The downloaded model (a public Kaggle Isolated Sign Language Recognition submission, 543-point MediaPipe Holistic landmarks, 250 classes) almost certainly embeds `SELECT_TF_OPS` ("Flex" ops) for its internal feature engineering — ops the in-browser TFLite WASM runtime doesn't implement. No JS-side fix exists for a C++ runtime abort. Rather than fake a working feature, the UI was changed to be upfront about it: live hand/pose tracking is shown (it genuinely works, fully on-device), and the Sign Language Garden became a self-paced practice flow instead of auto-graded, with classification listed as a roadmap item.

**5. Dual-User Mode panels overflowing the card on the right**
Two `flex: 1` text panels with padding and borders, no `box-sizing: border-box` set anywhere in the app — browser default (`content-box`) adds padding/border on top of the flex-allocated width instead of inside it, so the rightmost panel had nowhere to go but past the edge. Fixed with a scoped `box-sizing: border-box` reset, plus `min-width: 0` on each flex column (flex items default to `min-width: auto`, which blocks them from shrinking below their content size on narrow viewports).

⚠️ Known Limitations
- **Camera → word matching isn't live yet, and the camera view is currently a plain preview, not an active tracking display.** A working MediaPipe landmark-detection pipeline (Face/Pose/Hand) was built and verified during debugging — see Bugs Fixed #1–#4 — but after removing the broken classifier it's no longer wired into the camera UI. Re-connecting it (ideally with a live landmark overlay) is the first item on the roadmap below. Voice → Sign and the tap-a-word fallback are the fully working directions today.
- **Blink to Speak and Code Corner are manual-input learning tools**, not yet wired to real blink/face detection.
- **Sign Language Garden progress is self-reported** ("I practiced this!") rather than auto-verified, until a custom gesture classifier replaces the incompatible downloaded one.

🗺️ Roadmap
- Re-wire the existing MediaPipe pipeline into the camera view with a live landmark overlay (proves tracking works visually, no classifier needed for this part)
- Train a lightweight, hand-only gesture classifier for the 6 target words, exported to **tfjs** format instead of TFLite — sidesteps the browser op-support problem entirely
- Real blink-pattern detection for Blink to Speak, using MediaPipe Face Landmarker blendshapes
- Live sync for Dual-User Mode across two devices
- Expand the sign vocabulary past the initial 6 words

🛠️ Tech Stack
React · Vite · @mediapipe/tasks-vision (Face/Pose/Hand Landmarker) · TensorFlow Lite Web (tfjs + tfjs-tflite) · Web Speech API (SpeechSynthesis + SpeechRecognition) · lucide-react

🚀 Quick Start
```
git clone https://github.com/<your-username>/silent_voice_project.git
cd silent_voice_project
npm install
npm run dev
```
Open the printed `localhost` URL in **Chrome** (camera permissions on `localhost` are inconsistent in some other Chromium-based browsers, e.g. Edge's Tracking Prevention).

You'll also need, in `public/`:
- `model.tflite` — the gesture classifier (currently blocked, see Known Limitations)
- `sign_to_prediction_index_map.json` — the label map

📁 Project Structure
```
src/
├── App.jsx                  # All screens + router. Single-file for now —
│                             # a production refactor would split each screen
│                             # into its own component file.
├── sign/
│   ├── landmarks.js          # MediaPipe Face+Pose+Hand Landmarker pipeline
│   ├── signModel.js           # TFLite model loading + per-frame inference
│   └── useSignDetector.js     # Timed capture hook with warm-up + retry logic
public/
├── model.tflite
├── sign_to_prediction_index_map.json
└── avatars/
    ├── boy.png
    └── girl.png
```
