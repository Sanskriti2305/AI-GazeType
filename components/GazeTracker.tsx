"use client"
import { useEffect, useRef } from "react"
import * as faceapi from "face-api.js"

export default function GazeTracker() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const startVideo = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) videoRef.current.srcObject = stream
    }

    const loadModels = async () => {
      const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js-models@master"
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ])
      startVideo()
    }

    loadModels()

    const detect = async () => {
      if (!videoRef.current) return

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)

      if (detection) {
        const landmarks = detection.landmarks
        const leftEye = landmarks.getLeftEye()
        const rightEye = landmarks.getRightEye()

        // Approximate gaze direction using eye center
        const avgX =
          (leftEye.reduce((a, b) => a + b.x, 0) + rightEye.reduce((a, b) => a + b.x, 0)) /
          (leftEye.length + rightEye.length)
        const avgY =
          (leftEye.reduce((a, b) => a + b.y, 0) + rightEye.reduce((a, b) => a + b.y, 0)) /
          (leftEye.length + rightEye.length)

        // Map to screen coordinates (very rough)
        const x = (avgX / videoRef.current.videoWidth) * window.innerWidth
        const y = (avgY / videoRef.current.videoHeight) * window.innerHeight

        // Move a fake cursor or highlight UI elements
        const cursor = document.getElementById("gaze-cursor")
        if (cursor) {
          cursor.style.left = `${x}px`
          cursor.style.top = `${y}px`
        }
      }

      requestAnimationFrame(detect)
    }

    videoRef.current?.addEventListener("play", detect)
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width="150"
        height="120"
        className="absolute top-4 right-4 border rounded-lg z-50"
      />
      <div
        id="gaze-cursor"
        className="fixed w-6 h-6 bg-blue-500 rounded-full opacity-70 pointer-events-none z-[1000]"
        style={{ transition: "0.05s all linear" }}
      ></div>
    </>
  )
}
