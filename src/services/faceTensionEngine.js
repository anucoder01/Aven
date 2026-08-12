import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

let faceLandmarker = null

export const faceTensionEngine = {
  async init() {
    if (faceLandmarker) return
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    )
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1
    })
  },

  /**
   * Computes a rough "tension index" from blendshapes.
   * Note: This is an invented proxy, not a clinically validated scale.
   * We heavily weight brow lowering (furrowing) and lip pressing, 
   * which are typical physiological responses to stress/concentration.
   */
  computeTension(blendshapes) {
    if (!blendshapes || blendshapes.length === 0) return { tensionIndex: 0, blinkRate: 0 }
    
    const shapes = blendshapes[0].categories
    const getShape = (name) => shapes.find(s => s.categoryName === name)?.score || 0

    const browDownL = getShape("browDownLeft")
    const browDownR = getShape("browDownRight")
    const lipPressL = getShape("lipPressLeft")
    const lipPressR = getShape("lipPressRight")
    const jawClench = getShape("jawClench")
    
    // Blink rate proxy (just instantaneous eye closure for now, true rate needs rolling window)
    const eyeBlinkL = getShape("eyeBlinkLeft")
    const eyeBlinkR = getShape("eyeBlinkRight")
    const blinkInst = (eyeBlinkL + eyeBlinkR) / 2

    // Weighted sum
    // Brows heavily indicate concern/stress
    const tensionIndex = ((browDownL + browDownR) * 0.4) + 
                         ((lipPressL + lipPressR) * 0.3) + 
                         (jawClench * 0.3)
                         
    return {
      tensionIndex: tensionIndex * 100, // scale to 0-100
      blinkRate: blinkInst // this is just a single frame snapshot proxy
    }
  },

  async predictVideo(videoElement, timeMs) {
    if (!faceLandmarker) await this.init()
    const results = faceLandmarker.detectForVideo(videoElement, timeMs)
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      return this.computeTension(results.faceBlendshapes)
    }
    return null
  }
}
