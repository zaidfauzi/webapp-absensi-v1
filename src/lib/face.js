import * as faceapi from 'face-api.js'

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'
let loaded = false

export async function loadFaceModels() {
  if (loaded) return true
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    loaded = true
    return true
  } catch (e) {
    console.warn('Gagal load model wajah', e)
    return false
  }
}

export async function getFaceDescriptor(input) {
  const ok = await loadFaceModels()
  if (!ok) return null
  const det = await faceapi.detectSingleFace(input, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()
  return det ? Array.from(det.descriptor) : null
}

export function faceDistance(a, b) {
  if (!a || !b || a.length !== b.length) return 1
  let s = 0
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2
  return Math.sqrt(s)
}