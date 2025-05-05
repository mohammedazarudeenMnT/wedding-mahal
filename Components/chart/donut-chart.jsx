"use client"

import { useEffect, useRef } from "react"

export function DonutChart({ data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const total = data.reduce((sum, item) => sum + item.value, 0)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) * 0.8
    const innerRadius = radius * 0.6

    let startAngle = -0.5 * Math.PI

    data.forEach((item) => {
      const segmentAngle = (item.value / total) * 2 * Math.PI

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + segmentAngle)
      ctx.arc(centerX, centerY, innerRadius, startAngle + segmentAngle, startAngle, true)
      ctx.closePath()

      ctx.fillStyle = item.color
      ctx.fill()

      startAngle += segmentAngle
    })
  }, [data])

  return <canvas ref={canvasRef} width={250} height={250} />
}