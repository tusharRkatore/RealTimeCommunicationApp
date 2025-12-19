"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Eraser, Pen, Trash2, Circle, Square, Minus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface WhiteboardPanelProps {
  roomId: string
  userId: string
}

type Tool = "pen" | "eraser" | "line" | "circle" | "rectangle"

interface Point {
  x: number
  y: number
}

interface Stroke {
  id: string
  type: Tool
  points: Point[]
  color: string
  width: number
  userId: string
}

const COLORS = [
  "#000000", // Black
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
]

export function WhiteboardPanel({ roomId, userId }: WhiteboardPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>("pen")
  const [color, setColor] = useState("#000000")
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Initialize canvas and load existing strokes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Load existing strokes
    const loadStrokes = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("whiteboard_strokes").select("*").eq("room_id", roomId).order("created_at")

      if (data) {
        const loadedStrokes: Stroke[] = data.map((s) => ({
          id: s.id,
          type: (s.stroke_data as any).type,
          points: (s.stroke_data as any).points,
          color: (s.stroke_data as any).color,
          width: (s.stroke_data as any).width,
          userId: s.user_id,
        }))
        setStrokes(loadedStrokes)
      }
    }

    loadStrokes()

    // Subscribe to real-time stroke updates
    const supabase = createClient()
    channelRef.current = supabase
      .channel(`whiteboard:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whiteboard_strokes", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newStroke: Stroke = {
            id: payload.new.id,
            type: (payload.new.stroke_data as any).type,
            points: (payload.new.stroke_data as any).points,
            color: (payload.new.stroke_data as any).color,
            width: (payload.new.stroke_data as any).width,
            userId: payload.new.user_id,
          }
          setStrokes((prev) => [...prev, newStroke])
        },
      )
      .subscribe()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [roomId])

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas()
  }, [strokes])

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw all strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke)
    })
  }

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return

    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (stroke.type === "pen" || stroke.type === "eraser") {
      // Draw freehand stroke
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    } else if (stroke.type === "line" && stroke.points.length >= 2) {
      // Draw line
      const start = stroke.points[0]
      const end = stroke.points[stroke.points.length - 1]
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    } else if (stroke.type === "rectangle" && stroke.points.length >= 2) {
      // Draw rectangle
      const start = stroke.points[0]
      const end = stroke.points[stroke.points.length - 1]
      const width = end.x - start.x
      const height = end.y - start.y
      ctx.strokeRect(start.x, start.y, width, height)
    } else if (stroke.type === "circle" && stroke.points.length >= 2) {
      // Draw circle
      const start = stroke.points[0]
      const end = stroke.points[stroke.points.length - 1]
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
      ctx.beginPath()
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
      ctx.stroke()
    }
  }

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const point = getCanvasPoint(e)

    if (tool === "pen" || tool === "eraser") {
      setCurrentStroke([point])
    } else {
      setStartPoint(point)
      setCurrentStroke([point])
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const point = getCanvasPoint(e)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return

    if (tool === "pen" || tool === "eraser") {
      // Freehand drawing
      setCurrentStroke((prev) => [...prev, point])

      // Draw current stroke in real-time
      ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color
      ctx.lineWidth = strokeWidth
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (currentStroke.length > 0) {
        const lastPoint = currentStroke[currentStroke.length - 1]
        ctx.beginPath()
        ctx.moveTo(lastPoint.x, lastPoint.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    } else {
      // Shape drawing - redraw canvas and show preview
      redrawCanvas()

      if (startPoint) {
        ctx.strokeStyle = color
        ctx.lineWidth = strokeWidth
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        if (tool === "line") {
          ctx.beginPath()
          ctx.moveTo(startPoint.x, startPoint.y)
          ctx.lineTo(point.x, point.y)
          ctx.stroke()
        } else if (tool === "rectangle") {
          const width = point.x - startPoint.x
          const height = point.y - startPoint.y
          ctx.strokeRect(startPoint.x, startPoint.y, width, height)
        } else if (tool === "circle") {
          const radius = Math.sqrt(Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2))
          ctx.beginPath()
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
    }
  }

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    setIsDrawing(false)

    const point = getCanvasPoint(e)

    let finalPoints: Point[] = []
    if (tool === "pen" || tool === "eraser") {
      finalPoints = [...currentStroke, point]
    } else if (startPoint) {
      finalPoints = [startPoint, point]
    }

    if (finalPoints.length < 2) return

    // Save stroke to database
    const supabase = createClient()
    await supabase.from("whiteboard_strokes").insert({
      room_id: roomId,
      user_id: userId,
      stroke_data: {
        type: tool,
        points: finalPoints,
        color: tool === "eraser" ? "#FFFFFF" : color,
        width: strokeWidth,
      },
    })

    setCurrentStroke([])
    setStartPoint(null)
  }

  const handleClearCanvas = async () => {
    const supabase = createClient()

    // Delete all strokes for this room
    await supabase.from("whiteboard_strokes").delete().eq("room_id", roomId)

    setStrokes([])
    redrawCanvas()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Whiteboard</h3>
      </div>

      {/* Tools */}
      <div className="border-b p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={tool === "pen" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("pen")}
            className="flex-1"
          >
            <Pen className="mr-2 h-4 w-4" />
            Pen
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("eraser")}
            className="flex-1"
          >
            <Eraser className="mr-2 h-4 w-4" />
            Eraser
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={tool === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("line")}
            className="flex-1"
          >
            <Minus className="mr-2 h-4 w-4" />
            Line
          </Button>
          <Button
            variant={tool === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("circle")}
            className="flex-1"
          >
            <Circle className="mr-2 h-4 w-4" />
            Circle
          </Button>
          <Button
            variant={tool === "rectangle" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("rectangle")}
            className="flex-1"
          >
            <Square className="mr-2 h-4 w-4" />
            Rectangle
          </Button>
        </div>

        {/* Colors */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">Color</p>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? "border-primary scale-110" : "border-border"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">Stroke Width: {strokeWidth}px</p>
          <Slider value={[strokeWidth]} onValueChange={([value]) => setStrokeWidth(value)} min={1} max={20} step={1} />
        </div>

        {/* Clear Canvas */}
        <Button variant="destructive" size="sm" onClick={handleClearCanvas} className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Canvas
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          className="h-full w-full cursor-crosshair rounded-lg border-2 border-border bg-white"
        />
      </div>
    </div>
  )
}
