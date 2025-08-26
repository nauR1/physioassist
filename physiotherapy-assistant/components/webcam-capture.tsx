"use client"

import { useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff, RotateCcw, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WebcamCaptureProps {
  onCapture: (file: File) => void
}

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setError(null)
      }
    } catch (err) {
      setError("Erro ao acessar a câmera. Verifique as permissões.")
      console.error("Camera access error:", err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        // Flip horizontally for mirror effect
        context.scale(-1, 1)
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)

        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9)
        setCapturedImage(imageDataUrl)

        // Convert to File object
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
              onCapture(file)
            }
          },
          "image/jpeg",
          0.9,
        )
      }
    }
  }, [onCapture])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
  }, [])

  const downloadPhoto = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement("a")
      link.download = `physio-capture-${Date.now()}.jpg`
      link.href = capturedImage
      link.click()
    }
  }, [capturedImage])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Captura via Webcam
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
          {!capturedImage ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
              style={{ display: isStreaming ? "block" : "none" }}
            />
          ) : (
            <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
          )}

          {!isStreaming && !capturedImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Clique em "Iniciar Câmera" para começar</p>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2 justify-center">
          {!isStreaming && !capturedImage && (
            <Button onClick={startCamera}>
              <Camera className="w-4 h-4 mr-2" />
              Iniciar Câmera
            </Button>
          )}

          {isStreaming && !capturedImage && (
            <>
              <Button onClick={capturePhoto} size="lg">
                <Camera className="w-4 h-4 mr-2" />
                Capturar Foto
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                <CameraOff className="w-4 h-4 mr-2" />
                Parar Câmera
              </Button>
            </>
          )}

          {capturedImage && (
            <>
              <Button onClick={retakePhoto} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Nova Foto
              </Button>
              <Button onClick={downloadPhoto} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
