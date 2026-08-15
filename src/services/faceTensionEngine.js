import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

class FaceTensionEngine {
  constructor() {
    this.faceLandmarker = null;
    this.isInitializing = false;
  }

  async init() {
    if (this.faceLandmarker || this.isInitializing) return;
    this.isInitializing = true;
    
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
      );
      
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      console.log("FaceLandmarker initialized successfully.");
      } catch {
        console.warn("FaceLandmarker vision task failed to process frame");
      } finally {
      this.isInitializing = false;
    }
  }

  async predictVideo(videoElement, timestamp) {
    if (!this.faceLandmarker) {
      await this.init();
    }
    
    if (!this.faceLandmarker) return null;

    try {
      const results = this.faceLandmarker.detectForVideo(videoElement, timestamp);
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const blendshapes = results.faceBlendshapes[0].categories;
        
        // Helper to get score of a specific blendshape
        const getScore = (name) => {
          const bs = blendshapes.find(b => b.categoryName === name);
          return bs ? bs.score : 0;
        };

        // Note: These are derived heuristics correlated with facial tension,
        // not a clinically validated scale. We use brow lowering, lip pressing,
        // and eye blinking/squinting as proxies for tension.
        const browLowerL = getScore("browDownLeft");
        const browLowerR = getScore("browDownRight");
        const lipPressL = getScore("mouthPressLeft");
        const lipPressR = getScore("mouthPressRight");
        const eyeBlinkL = getScore("eyeBlinkLeft");
        const eyeBlinkR = getScore("eyeBlinkRight");
        const squintL = getScore("eyeSquintLeft");
        const squintR = getScore("eyeSquintRight");

        const avgBrowLower = (browLowerL + browLowerR) / 2;
        const avgLipPress = (lipPressL + lipPressR) / 2;
        const avgBlink = (eyeBlinkL + eyeBlinkR) / 2;
        const avgSquint = (squintL + squintR) / 2;

        // Weighted tension index (0 to 1 range approx)
        const tensionIndex = (avgBrowLower * 0.4) + (avgLipPress * 0.3) + (avgSquint * 0.3);

        // Emotion Action Unit Mappings
        const happy = (getScore("mouthSmileLeft") + getScore("mouthSmileRight")) / 2;
        const sad = (getScore("browDownLeft") + getScore("browDownRight") + getScore("mouthFrownLeft") + getScore("mouthFrownRight") + getScore("browInnerUp")) / 5;
        const angry = (getScore("browDownLeft") + getScore("browDownRight") + getScore("mouthPressLeft") + getScore("mouthPressRight") + getScore("eyeSquintLeft") + getScore("eyeSquintRight")) / 6;
        const surprise = (getScore("browInnerUp") + getScore("browOuterUpLeft") + getScore("browOuterUpRight") + getScore("jawOpen")) / 4;
        const fear = (getScore("browInnerUp") + getScore("eyeWideLeft") + getScore("eyeWideRight") + getScore("mouthStretchLeft") + getScore("mouthStretchRight")) / 5;
        const disgust = (getScore("noseSneerLeft") + getScore("noseSneerRight") + getScore("mouthUpperUpLeft") + getScore("mouthUpperUpRight")) / 4;

        const emotions = { happy, sad, angry, surprise, fear, disgust, neutral: 0.1 };
        let dominantEmotion = "neutral";
        let maxScore = 0.1;
        for (const [emo, score] of Object.entries(emotions)) {
          if (score > maxScore) {
            maxScore = score;
            dominantEmotion = emo;
          }
        }

        return {
          tensionIndex: tensionIndex,
          blinkRate: avgBlink, 
          emotions: { happy, sad, angry, surprise, fear, disgust },
          dominantEmotion,
          raw: { avgBrowLower, avgLipPress, avgSquint }
        };
      }
    } catch {
      // Ignore occasional video processing errors
    }
    return null;
  }
}

export const faceTensionEngine = new FaceTensionEngine();
