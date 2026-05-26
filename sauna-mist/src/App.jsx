import { useEffect, useRef } from 'react'
import './App.css'

export default function MistySaunaPrototype() {
  const canvasRef = useRef(null)

  return (
    <main className="sauna-scene" aria-label="Interactive misty sauna">
      <canvas
        ref={canvasRef}
        className="mist-canvas"
        aria-hidden="true"
      />

      <div className="sauna-vignette" aria-hidden="true" />
      <div className="sauna-heat" aria-hidden="true" />

      <div className="sauna-title">
        <div>
          <h1>Sauna</h1>

          <p>
            Move through the steam
          </p>
        </div>
      </div>

      <MistEffect canvasRef={canvasRef} />
    </main>
  )
}

function MistEffect({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext('2d')

    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let animationFrameId

    canvas.width = width
    canvas.height = height

    const pointer = {
      x: width / 2,
      y: height / 2,
      active: false,
    }

    const mistParticles = []
    const particleCount = 160

    function resize() {
      width = window.innerWidth
      height = window.innerHeight

      canvas.width = width
      canvas.height = height
    }

    function addParticle() {
      mistParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 100 + Math.random() * 220,
        alpha: 0.02 + Math.random() * 0.035,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.15 - Math.random() * 0.2,
      })
    }

    for (let i = 0; i < particleCount; i++) {
      addParticle()
    }

    function drawMistParticle(particle) {
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius
      )

      gradient.addColorStop(
        0,
        `rgba(255,255,255,${particle.alpha})`
      )

      gradient.addColorStop(1, 'rgba(255,255,255,0)')

      ctx.fillStyle = gradient

      ctx.beginPath()
      ctx.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      )

      ctx.fill()
    }

    function updateParticles() {
      for (const particle of mistParticles) {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.y + particle.radius < 0) {
          particle.y = height + particle.radius
          particle.x = Math.random() * width
        }

        if (particle.x < -particle.radius) {
          particle.x = width + particle.radius
        }

        if (particle.x > width + particle.radius) {
          particle.x = -particle.radius
        }
      }
    }

    function clearMistAroundPointer() {
      if (!pointer.active) return

      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'

      const gradient = ctx.createRadialGradient(
        pointer.x,
        pointer.y,
        20,
        pointer.x,
        pointer.y,
        140
      )

      gradient.addColorStop(0, 'rgba(0,0,0,0.35)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.fillStyle = gradient

      ctx.beginPath()
      ctx.arc(pointer.x, pointer.y, 140, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate)

      ctx.fillStyle = 'rgba(27,20,15,0.08)'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = 'rgba(255,255,255,0.008)'
      ctx.fillRect(0, 0, width, height)

      updateParticles()

      for (const particle of mistParticles) {
        drawMistParticle(particle)
      }

      clearMistAroundPointer()
    }

    function updatePointer(x, y) {
      pointer.x = x
      pointer.y = y
      pointer.active = true
    }

    function onMouseMove(event) {
      updatePointer(event.clientX, event.clientY)
    }

    function onTouchMove(event) {
      const touch = event.touches[0]

      if (!touch) return

      updatePointer(touch.clientX, touch.clientY)
    }

    function deactivatePointer() {
      pointer.active = false
    }

    animate()

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, {
      passive: true,
    })
    window.addEventListener('mouseleave', deactivatePointer)
    window.addEventListener('touchend', deactivatePointer)

    return () => {
      cancelAnimationFrame(animationFrameId)

      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseleave', deactivatePointer)
      window.removeEventListener('touchend', deactivatePointer)
    }
  }, [canvasRef])

  return null
}
