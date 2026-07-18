"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, FileText } from "@/components/ui/icons"
import { resolvePdfUrl } from "@/lib/pdf-utils"

interface ImageLightboxProps {
  images: { src: string; label: string }[]
  initialIndex?: number
  onClose: () => void
}

export default function ImageLightbox({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  const current = images[index]

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
    if (e.key === "ArrowLeft" && index > 0) {
      setIndex((i) => i - 1)
      setZoom(1)
      setRotation(0)
      setPan({ x: 0, y: 0 })
    }
    if (e.key === "ArrowRight" && index < images.length - 1) {
      setIndex((i) => i + 1)
      setZoom(1)
      setRotation(0)
      setPan({ x: 0, y: 0 })
    }
  }, [index, images.length, onClose])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.max(1, Math.min(5, z + delta)))
  }

  if (!current) return null

  const isPdf = current.src.match(/\.pdf/i)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Toolbar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3">
        <div className="flex items-center gap-3 text-white">
          <span className="text-sm font-medium">{current.label}</span>
          {images.length > 1 && (
            <span className="text-sm text-white/60">{index + 1} / {images.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isPdf && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="min-w-[40px] text-center text-xs text-white/60">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(5, z + 0.5))}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
                title="Rotate"
              >
                <RotateCw size={18} />
              </button>
              <div className="mx-2 h-6 w-px bg-white/20" />
            </>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={() => {
                  setIndex((i) => i - 1)
                  setZoom(1); setRotation(0); setPan({ x: 0, y: 0 })
                }}
                disabled={index === 0}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  setIndex((i) => i + 1)
                  setZoom(1); setRotation(0); setPan({ x: 0, y: 0 })
                }}
                disabled={index === images.length - 1}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="Next"
              >
                <ChevronRight size={20} />
              </button>
              <div className="mx-2 h-6 w-px bg-white/20" />
            </>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* PDF or Image */}
      {isPdf ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
          <a
            href={resolvePdfUrl(current.src)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 rounded-xl bg-white/10 px-8 py-6 text-white transition-colors hover:bg-white/20"
          >
            <FileText size={64} className="text-red-400" />
            <span className="text-lg font-medium">Open PDF</span>
            <span className="text-sm text-white/60">Opens in a new tab</span>
          </a>
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDragging(false)}
        >
          <img
            ref={imgRef}
            src={current.src}
            alt={current.label}
            className="max-h-full max-w-full select-none transition-transform duration-100"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            }}
            draggable={false}
            onMouseDown={handleMouseDown}
          />
        </div>
      )}

      {/* Bottom thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i)
                setZoom(1)
                setRotation(0)
                setPan({ x: 0, y: 0 })
              }}
              className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === index ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              {img.src.match(/\.pdf/i) ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-800">
                  <FileText size={16} className="text-red-400" />
                </div>
              ) : (
                <img src={img.src} alt={img.label || "Document image"} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}