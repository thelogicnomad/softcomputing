/**
 * Polished Racing Game with Hand Gesture Controls
 * All rendering on canvas for maximum performance
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import './GameCanvas.css'

const GameCanvas = forwardRef(({ controlData, onGameOver }, ref) => {
    const canvasRef = useRef(null)
    const gameRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        canvas.width = 850
        canvas.height = 580

        gameRef.current = new Game(canvas, ctx, onGameOver)
        gameRef.current.start()

        return () => {
            if (gameRef.current) gameRef.current.stop()
        }
    }, [onGameOver])

    useEffect(() => {
        if (gameRef.current && controlData) {
            gameRef.current.setInput(
                controlData.steering || 0,
                controlData.speed || 0,
                controlData.gesture || 0,
                controlData.hand_count || controlData.hands || 0
            )
        }
    }, [controlData])

    useImperativeHandle(ref, () => ({
        reset: () => gameRef.current?.reset()
    }))

    return (
        <div className="game-canvas-container">
            <canvas ref={canvasRef} />
        </div>
    )
})

// ===== GAME ENGINE =====
class Game {
    constructor(canvas, ctx, onGameOver) {
        this.canvas = canvas
        this.ctx = ctx
        this.onGameOver = onGameOver
        this.W = canvas.width
        this.H = canvas.height
        this.reset()
    }

    reset() {
        this.carX = this.W / 2
        this.speed = 0
        this.maxSpeed = 60  // Reduced from 100
        this.score = 0
        this.distance = 0
        this.gameOver = false
        this.roadY = 0
        this.traffic = []
        this.spawnTime = 0

        // Inputs
        this.steerIn = 0
        this.speedIn = 0
        this.gesture = 0
        this.hands = 0

        // Nitro
        this.nitro = 100
        this.nitroOn = false

        // Visual
        this.wheelAngle = 0

        this.running = false
        this.lastT = 0
    }

    setInput(steer, speed, gesture, hands) {
        this.steerIn = steer
        this.speedIn = speed
        this.gesture = gesture
        this.hands = hands
    }

    start() {
        this.running = true
        this.lastT = performance.now()
        this.loop()
    }

    stop() {
        this.running = false
    }

    loop = () => {
        if (!this.running) return

        const now = performance.now()
        const dt = Math.min((now - this.lastT) / 1000, 0.05)
        this.lastT = now

        if (!this.gameOver) {
            this.update(dt)
        }
        this.draw()

        requestAnimationFrame(this.loop)
    }

    update(dt) {
        // === SPEED ===
        let target = (this.speedIn / 100) * this.maxSpeed

        // Nitro boost
        if (this.gesture === 2 && this.nitro > 0 && this.hands > 0) {
            this.nitroOn = true
            this.nitro = Math.max(0, this.nitro - 25 * dt)
            target = Math.min(this.maxSpeed * 1.5, target * 1.5)
        } else {
            this.nitroOn = false
            this.nitro = Math.min(100, this.nitro + 8 * dt)
        }

        // Smooth acceleration
        if (this.speed < target) {
            this.speed += 60 * dt
        } else {
            this.speed -= 70 * dt
        }
        this.speed = Math.max(0, Math.min(this.maxSpeed * 1.5, this.speed))

        // === STEERING ===
        this.wheelAngle = this.steerIn * 1.5  // Reduced rotation
        const move = (this.steerIn / 100) * 180 * dt  // Slower steering
        this.carX += move

        const roadL = this.W / 2 - 150
        const roadR = this.W / 2 + 150
        this.carX = Math.max(roadL + 30, Math.min(roadR - 30, this.carX))

        // === ROAD ===
        this.roadY += this.speed * dt * 4  // Slower road animation
        if (this.roadY > 100) this.roadY -= 100

        // === SCORE ===
        this.distance += this.speed * dt
        this.score = Math.floor(this.distance / 5)

        // === TRAFFIC ===
        this.spawnTime += dt
        if (this.spawnTime > 1.8 && this.traffic.length < 2) {
            this.spawnCar()
            this.spawnTime = 0
        }

        for (const car of this.traffic) {
            car.y += (this.speed - car.spd) * dt * 4  // Slower traffic
        }

        this.traffic = this.traffic.filter(c => c.y < this.H + 100)

        // === COLLISION ===
        this.checkHit()
    }

    spawnCar() {
        const lanes = [this.W / 2 - 100, this.W / 2, this.W / 2 + 100]
        const taken = this.traffic.filter(c => c.y < 150).map(c => c.lane)
        const free = [0, 1, 2].filter(l => !taken.includes(l))

        if (free.length === 0) return

        const lane = free[Math.floor(Math.random() * free.length)]
        this.traffic.push({
            x: lanes[lane],
            y: -90,
            lane,
            spd: 25 + Math.random() * 35,
            color: ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6'][Math.floor(Math.random() * 5)]
        })
    }

    checkHit() {
        const py = this.H - 120
        for (const car of this.traffic) {
            if (car.y + 75 > py && car.y < py + 75) {
                if (Math.abs(car.x - this.carX) < 50) {
                    this.crash()
                    return
                }
            }
        }
    }

    crash() {
        this.gameOver = true
        this.onGameOver({ score: this.score, distance: Math.floor(this.distance) })
    }

    draw() {
        const ctx = this.ctx
        const W = this.W
        const H = this.H

        // === SKY ===
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.35)
        sky.addColorStop(0, '#0a0a1a')
        sky.addColorStop(1, '#1a1a3a')
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, W, H)

        // Stars
        ctx.fillStyle = '#fff'
        for (let i = 0; i < 50; i++) {
            const x = (i * 97 + i * i * 17) % W
            const y = (i * 67 + i * 11) % (H * 0.32)
            ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 400 + i) * 0.3
            ctx.beginPath()
            ctx.arc(x, y, 1 + (i % 2), 0, Math.PI * 2)
            ctx.fill()
        }
        ctx.globalAlpha = 1

        // === GROUND ===
        ctx.fillStyle = '#0f4a3a'
        ctx.fillRect(0, H * 0.35, W, H)

        // === ROAD ===
        this.drawRoad(ctx)

        // === TRAFFIC ===
        for (const car of this.traffic) {
            this.drawCar(ctx, car.x, car.y, car.color, false)
        }

        // === PLAYER ===
        this.drawCar(ctx, this.carX, H - 120, '#1abc9c', true)

        // === HUD (on canvas) ===
        this.drawHUD(ctx)

        // === STEERING WHEEL ===
        this.drawWheel(ctx)

        // === NITRO BAR ===
        this.drawNitro(ctx)

        // Nitro screen effect
        if (this.nitroOn) {
            ctx.fillStyle = 'rgba(255,130,0,0.12)'
            ctx.fillRect(0, 0, W, H)
        }
    }

    drawRoad(ctx) {
        const W = this.W
        const H = this.H
        const roadW = 320
        const cx = W / 2
        const top = H * 0.35

        // Road surface
        ctx.fillStyle = '#2c3e50'
        ctx.fillRect(cx - roadW / 2, top, roadW, H)

        // Edge lines
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(cx - roadW / 2 - 4, top, 4, H)
        ctx.fillRect(cx + roadW / 2, top, 4, H)

        // Lane markers (moving)
        ctx.fillStyle = '#ffffff'
        for (let y = top - this.roadY; y < H; y += 100) {
            ctx.fillRect(cx - 55, y, 5, 50)
            ctx.fillRect(cx + 50, y, 5, 50)
        }

        // Center line (yellow)
        ctx.fillStyle = '#f1c40f'
        for (let y = top - this.roadY; y < H; y += 70) {
            ctx.fillRect(cx - 2.5, y, 5, 35)
        }
    }

    drawCar(ctx, x, y, color, isPlayer) {
        const w = 50
        const h = 80

        ctx.save()
        ctx.translate(x, y)

        if (isPlayer) {
            ctx.rotate((this.steerIn / 100) * 0.12)
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.beginPath()
        ctx.ellipse(0, h / 2 + 6, w / 2 + 5, 10, 0, 0, Math.PI * 2)
        ctx.fill()

        // Body
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(-w / 2, -h / 2, w, h, 6)
        ctx.fill()

        // Windshield
        ctx.fillStyle = isPlayer ? 'rgba(0,220,255,0.5)' : 'rgba(100,150,200,0.6)'
        ctx.beginPath()
        ctx.roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h * 0.28, 3)
        ctx.fill()

        // Roof
        ctx.fillStyle = isPlayer ? '#0e9b8a' : this.darken(color, 25)
        ctx.beginPath()
        ctx.roundRect(-w / 2 + 4, -h / 2 + h * 0.25, w - 8, h * 0.32, 3)
        ctx.fill()

        // Wheels
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(-w / 2 - 4, -h / 2 + 12, 7, 20)
        ctx.fillRect(w / 2 - 3, -h / 2 + 12, 7, 20)
        ctx.fillRect(-w / 2 - 4, h / 2 - 30, 7, 20)
        ctx.fillRect(w / 2 - 3, h / 2 - 30, 7, 20)

        if (isPlayer) {
            // Headlights
            ctx.fillStyle = '#ffffaa'
            ctx.shadowColor = '#ffff00'
            ctx.shadowBlur = 12
            ctx.fillRect(-w / 2 + 6, -h / 2 - 4, 12, 5)
            ctx.fillRect(w / 2 - 18, -h / 2 - 4, 12, 5)
            ctx.shadowBlur = 0

            // Neon outline
            ctx.strokeStyle = '#00ffff'
            ctx.lineWidth = 2
            ctx.shadowColor = '#00ffff'
            ctx.shadowBlur = 12
            ctx.beginPath()
            ctx.roundRect(-w / 2, -h / 2, w, h, 6)
            ctx.stroke()
            ctx.shadowBlur = 0

            // Nitro flames
            if (this.nitroOn) {
                for (let i = 0; i < 2; i++) {
                    const fh = 30 + Math.random() * 30
                    ctx.fillStyle = `rgba(255,${100 + Math.random() * 80},0,0.9)`
                    ctx.shadowColor = '#ff4400'
                    ctx.shadowBlur = 18
                    ctx.beginPath()
                    ctx.moveTo(-12 + i * 16, h / 2)
                    ctx.lineTo(-4 + i * 16, h / 2 + fh)
                    ctx.lineTo(4 + i * 16, h / 2)
                    ctx.fill()
                }
                ctx.shadowBlur = 0
            }
        } else {
            // Taillights
            ctx.fillStyle = '#e74c3c'
            ctx.shadowColor = '#ff0000'
            ctx.shadowBlur = 6
            ctx.fillRect(-w / 2 + 4, h / 2 - 8, 10, 5)
            ctx.fillRect(w / 2 - 14, h / 2 - 8, 10, 5)
            ctx.shadowBlur = 0
        }

        ctx.restore()
    }

    drawHUD(ctx) {
        const W = this.W

        // Speedometer
        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.beginPath()
        ctx.roundRect(W - 140, 15, 120, 70, 10)
        ctx.fill()
        ctx.strokeStyle = '#2ecc71'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = '#2ecc71'
        ctx.font = 'bold 36px Orbitron, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(Math.floor(this.speed), W - 80, 55)
        ctx.font = '12px Arial'
        ctx.fillStyle = '#888'
        ctx.fillText('KM/H', W - 80, 72)

        // Score
        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.beginPath()
        ctx.roundRect(20, 15, 130, 70, 10)
        ctx.fill()
        ctx.strokeStyle = '#f39c12'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = '#888'
        ctx.font = '11px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('SCORE', 85, 35)
        ctx.fillStyle = '#f39c12'
        ctx.font = 'bold 28px Orbitron, monospace'
        ctx.fillText(this.score.toLocaleString(), 85, 65)

        // Distance
        ctx.fillStyle = '#666'
        ctx.font = '11px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`Distance: ${Math.floor(this.distance)}m`, 25, 100)
    }

    drawWheel(ctx) {
        const cx = 100
        const cy = this.H - 100
        const r = 60

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(this.wheelAngle * Math.PI / 180)

        // Outer ring
        ctx.strokeStyle = this.hands > 0 ? '#2ecc71' : '#555'
        ctx.lineWidth = 12
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.stroke()

        // Inner ring
        ctx.strokeStyle = this.hands > 0 ? '#27ae60' : '#444'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, r - 18, 0, Math.PI * 2)
        ctx.stroke()

        // Spokes
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 7
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(-r + 15, 0)
        ctx.lineTo(r - 15, 0)
        ctx.moveTo(0, -r + 15)
        ctx.lineTo(0, r - 15)
        ctx.stroke()

        // Center
        ctx.fillStyle = '#222'
        ctx.beginPath()
        ctx.arc(0, 0, 18, 0, Math.PI * 2)
        ctx.fill()

        // Top marker
        ctx.fillStyle = '#e74c3c'
        ctx.beginPath()
        ctx.arc(0, -r + 6, 7, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        // Labels
        ctx.fillStyle = this.hands > 0 ? '#2ecc71' : '#888'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(this.hands > 0 ? '✓ HANDS OK' : 'SHOW HANDS', cx, cy + r + 22)
        ctx.fillStyle = '#aaa'
        ctx.font = '11px Arial'
        ctx.fillText(`${Math.round(this.wheelAngle)}°`, cx, cy + r + 38)
    }

    drawNitro(ctx) {
        const x = this.W - 180
        const y = this.H - 55
        const w = 150
        const h = 28

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.beginPath()
        ctx.roundRect(x, y, w, h, 6)
        ctx.fill()

        // Border
        ctx.strokeStyle = this.nitroOn ? '#ff6600' : '#555'
        ctx.lineWidth = 2
        ctx.stroke()

        // Fill
        const fw = (this.nitro / 100) * (w - 6)
        const grad = ctx.createLinearGradient(x, 0, x + w, 0)
        grad.addColorStop(0, '#e74c3c')
        grad.addColorStop(0.5, '#f39c12')
        grad.addColorStop(1, '#f1c40f')
        ctx.fillStyle = this.nitroOn ? '#ff6600' : grad
        ctx.beginPath()
        ctx.roundRect(x + 3, y + 3, fw, h - 6, 4)
        ctx.fill()

        // Label
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('⚡ NITRO', x + w / 2, y + h / 2 + 4)

        if (this.nitroOn) {
            ctx.fillStyle = '#ff6600'
            ctx.font = 'bold 11px Arial'
            ctx.fillText('BOOST!', x + w / 2, y - 8)
        }
    }

    darken(color, amt) {
        const hex = color.replace('#', '')
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amt)
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amt)
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amt)
        return `rgb(${r},${g},${b})`
    }
}

export default GameCanvas
