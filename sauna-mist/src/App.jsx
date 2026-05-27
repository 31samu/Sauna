import { useEffect, useRef } from 'react'
import './App.css'
import steam1Url from './assets/steam1.webp'
import steam2Url from './assets/steam2.webp'
import steam3Url from './assets/steam3.webp'
import steam4Url from './assets/steam4.webp'
import steam5Url from './assets/steam5.webp'
import oroUrl from './assets/oroY.webp';
import HiddenTexts from './HiddenTexts.jsx'

const steamSpriteUrls = [
  steam1Url,
  steam2Url,
  steam3Url,
  steam4Url,
  steam5Url,
]

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
        <h1>
          <img src={oroUrl} alt="Oro Logo" className="sauna-logo" />
        </h1>
      </div>

      <HiddenTexts />
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
    let pixelRatio = window.devicePixelRatio || 1
    let animationFrameId
    let cancelled = false
    let steamLayers = []

    function sizeCanvas() {
      pixelRatio = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight

      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    sizeCanvas()

    const pointer = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      active: false,
      influence: 0,
    }

    function createSteamLayer(index, sprite, type = 'veil') {
      const baseScale = Math.max(width / sprite.width, height / sprite.height)
      const isWisp = type === 'wisp'
      const depth = isWisp
        ? 0.14 + Math.random() * 0.36
        : 0.66 + Math.random() * 0.62
      const scale = baseScale * depth
      const layerWidth = sprite.width * scale
      const layerHeight = sprite.height * scale
      const startX = isWisp
        ? Math.random() * (width + layerWidth * 0.4) - layerWidth * 0.2
        : (Math.random() - 0.5) * width
      const startY = isWisp
        ? Math.random() * (height + layerHeight * 0.35) - layerHeight * 0.2
        : -height * 0.12 + Math.random() * height * 0.24

      return {
        sprite,
        type,
        depth,
        x: startX,
        y: startY,
        scale,
        opacity: isWisp
          ? 0.07 + Math.random() * 0.09
          : 0.06 + Math.random() * 0.08,
        rotation: (Math.random() - 0.5) * (isWisp ? 0.035 : 0.018),
        drift: isWisp
          ? 20 + Math.random() * 42
          : 28 + Math.random() * 58,
        phase: Math.random() * Math.PI * 2,
        vx: -0.04 + Math.random() * 0.08,
        vy: isWisp
          ? -0.04 - Math.random() * 0.04
          : -0.018 - Math.random() * 0.025,
        flowX: 0,
        flowY: 0,
        angularVelocity: 0,
        index,
      }
    }

    function createSteamLayers(sprites) {
      const isCompact = width < 700
      const veilCount = isCompact ? 14 : 24
      const wispCount = isCompact ? 96 : 168
      const veils = Array.from({ length: veilCount }, (_, index) =>
        createSteamLayer(index, sprites[index % sprites.length], 'veil')
      )
      const wisps = Array.from({ length: wispCount }, (_, index) =>
        createSteamLayer(
          index + veils.length,
          sprites[(index + 2) % sprites.length],
          'wisp'
        )
      )

      return [...veils, ...wisps]
    }

    function resize() {
      sizeCanvas()

      for (const layer of steamLayers) {
        layer.scale = Math.max(width / layer.sprite.width, height / layer.sprite.height) *
          layer.depth
      }
    }

    function applyPointerFlow(layer, drawnWidth, drawnHeight) {
      if (!pointer.active || layer.type !== 'wisp' || pointer.influence <= 0.01) return

      const centerX = layer.x + drawnWidth / 2
      const centerY = layer.y + drawnHeight / 2
      const dx = centerX - pointer.x
      const dy = centerY - pointer.y
      const distance = Math.hypot(dx, dy) || 1
      const radius = Math.min(420, Math.max(260, width * 0.28))

      if (distance > radius) return

      const force = ((radius - distance) / radius) ** 2.4 * pointer.influence
      const angle = Math.atan2(dy, dx)
      const tangent = angle + Math.PI / 2
      const handSpeed = Math.min(22, Math.hypot(pointer.vx, pointer.vy))
      const handInfluence = handSpeed * 0.028 * force

      layer.flowX += Math.cos(angle) * force * 0.72
      layer.flowY += Math.sin(angle) * force * 0.48
      layer.flowX += Math.cos(tangent) * Math.sin(layer.phase) * force * 0.22
      layer.flowY += Math.sin(tangent) * Math.cos(layer.phase) * force * 0.14
      layer.flowX += pointer.vx * handInfluence
      layer.flowY += pointer.vy * handInfluence
      layer.angularVelocity += Math.sin(angle + layer.phase) * force * 0.00028
    }

    function updateLayer(layer, time) {
      const drawnWidth = layer.sprite.width * layer.scale
      const drawnHeight = layer.sprite.height * layer.scale

      layer.flowX *= 0.986
      layer.flowY *= 0.984
      layer.angularVelocity *= 0.982

      const turbulence = Math.sin(time * 0.00022 + layer.phase) * 0.018
      const flowSpeed = Math.hypot(layer.flowX, layer.flowY)

      if (flowSpeed > 2.8) {
        layer.flowX = (layer.flowX / flowSpeed) * 2.8
        layer.flowY = (layer.flowY / flowSpeed) * 2.8
      }

      layer.x += layer.vx + layer.flowX + turbulence
      layer.y += layer.vy + layer.flowY
      layer.rotation += layer.angularVelocity

      applyPointerFlow(layer, drawnWidth, drawnHeight)

      if (layer.x > width + drawnWidth * 0.25) {
        layer.x = -drawnWidth * 0.65
        layer.flowX = 0
        layer.flowY = 0
        layer.angularVelocity = 0
      } else if (layer.x < -drawnWidth * 0.75) {
        layer.x = width + drawnWidth * 0.15
        layer.flowX = 0
        layer.flowY = 0
        layer.angularVelocity = 0
      }

      if (layer.y < -drawnHeight * 0.42) {
        layer.y = height - drawnHeight * 0.58
        layer.flowX = 0
        layer.flowY = 0
        layer.angularVelocity = 0
      } else if (layer.y > height + drawnHeight * 0.58) {
        layer.y = -drawnHeight * 0.42
        layer.flowX = 0
        layer.flowY = 0
        layer.angularVelocity = 0
      }

      return Math.sin(time * 0.00012 + layer.phase) * layer.drift
    }

    function clearMistAroundPointer() {
      if (!pointer.active || pointer.influence <= 0.01) return

      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'

      const radius = Math.min(190, Math.max(120, width * 0.12)) * pointer.influence
      const gradient = ctx.createRadialGradient(
        pointer.x,
        pointer.y,
        radius * 0.15,
        pointer.x,
        pointer.y,
        radius
      )

      const alphaScale = pointer.influence
      gradient.addColorStop(0, `rgba(0,0,0,${0.6 * alphaScale})`)
      gradient.addColorStop(0.42, `rgba(0,0,0,${0.3 * alphaScale})`)
      gradient.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.fillStyle = gradient

      ctx.beginPath()
      ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    function drawLayer(layer, time) {
      const sway = updateLayer(layer, time)
      const drawnWidth = layer.sprite.width * layer.scale
      const drawnHeight = layer.sprite.height * layer.scale

      ctx.save()
      ctx.globalAlpha = layer.opacity
      ctx.translate(
        layer.x + sway + drawnWidth / 2,
        layer.y + drawnHeight / 2
      )
      ctx.rotate(
        layer.rotation +
          Math.sin(time * 0.00008 + layer.phase) * (layer.type === 'wisp' ? 0.008 : 0.004)
      )
      ctx.drawImage(
        layer.sprite,
        -drawnWidth / 2,
        -drawnHeight / 2,
        drawnWidth,
        drawnHeight
      )
      ctx.restore()
    }

    function animate(layers, time = 0) {
      if (cancelled) return

      animationFrameId = requestAnimationFrame((nextTime) => animate(layers, nextTime))

      ctx.clearRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'source-over'

      for (const layer of layers) {
        drawLayer(layer, time)
      }

      clearMistAroundPointer()

      pointer.vx *= 0.85
      pointer.vy *= 0.85
      if (Math.abs(pointer.vx) < 0.001) pointer.vx = 0
      if (Math.abs(pointer.vy) < 0.001) pointer.vy = 0

      pointer.influence *= 0.98
      if (pointer.influence < 0.001) pointer.influence = 0
    }

    function updatePointer(x, y) {
      pointer.vx = x - pointer.x
      pointer.vy = y - pointer.y
      pointer.x = x
      pointer.y = y
      pointer.active = true
      pointer.influence = Math.min(1.0, pointer.influence + 0.06)
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
      pointer.influence = 0
    }

    async function loadSprites() {
      try {
        const images = await Promise.all(steamSpriteUrls.map(loadSteamImage))

        if (cancelled) return

        steamLayers = createSteamLayers(images)

        animate(steamLayers)
      } catch (error) {
        console.error('Failed to load steam sprite images:', error)
      }
    }

    loadSprites()

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, {
      passive: true,
    })
    window.addEventListener('mouseleave', deactivatePointer)
    window.addEventListener('touchend', deactivatePointer)

    return () => {
      cancelled = true
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

function loadSteamImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}
