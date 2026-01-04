
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
        return () => { if (gameRef.current) gameRef.current.stop() }
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

    useImperativeHandle(ref, () => ({ reset: () => gameRef.current?.reset() }))

    return (
        <div className="game-canvas-container">
            <canvas ref={canvasRef} />
        </div>
    )
})

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
        this.maxSpeed = 45
        this.score = 0
        this.distance = 0
        this.gameOver = false
        this.roadY = 0
        this.traffic = []
        this.spawnTime = 0
        this.steerIn = 0
        this.speedIn = 0
        this.gesture = 0
        this.hands = 0
        this.nitro = 100
        this.nitroOn = false
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

    stop() { this.running = false }

    loop = () => {
        if (!this.running) return
        const now = performance.now()
        const dt = Math.min((now - this.lastT) / 1000, 0.05)
        this.lastT = now
        if (!this.gameOver) this.update(dt)
        this.draw()
        requestAnimationFrame(this.loop)
    }

    update(dt) {
        let target = (this.speedIn / 100) * this.maxSpeed

        // NITRO: 2 hands + open gesture + fuel > 5%
        if (this.gesture === 2 && this.nitro > 5 && this.hands >= 2) {
            this.nitroOn = true
            this.nitro = Math.max(0, this.nitro - 30 * dt)
            target = Math.min(this.maxSpeed * 1.5, target * 1.5)
        } else {
            this.nitroOn = false
            this.nitro = Math.min(100, this.nitro + (this.nitro > 0 ? 5 : 2) * dt)
        }

        if (this.speed < target) this.speed += 60 * dt
        else this.speed -= 70 * dt
        this.speed = Math.max(20, Math.min(this.maxSpeed * 1.5, this.speed))

        // Steering
        this.wheelAngle = this.steerIn * 2
        this.carX += (this.steerIn / 100) * 220 * dt

        // STRICT WALLS - wider bounds for bigger lanes
        const roadL = this.W / 2 - 250
        const roadR = this.W / 2 + 250
        this.carX = Math.max(roadL + 20, Math.min(roadR - 20, this.carX))
        if (this.carX <= roadL + 25 || this.carX >= roadR - 25) this.speed *= 0.85

        // Road animation
        this.roadY += this.speed * dt * 3
        if (this.roadY > 100) this.roadY -= 100

        // Score
        this.distance += this.speed * dt
        this.score = Math.floor(this.distance / 5)

        // Traffic
        this.spawnTime += dt
        if (this.spawnTime > 1.2 && this.traffic.length < 4) {
            this.spawnCar()
            this.spawnTime = 0
        }
        if (this.traffic.length === 0) this.spawnCar()

        for (const car of this.traffic) {
            const rel = this.speed - car.spd
            car.y += (rel > 0 ? rel * 3 : 3) * dt
        }
        this.traffic = this.traffic.filter(c => c.y < this.H + 100)

        this.checkHit()
    }

    spawnCar() {
        // EVEN WIDER LANES - 150 width each
        const laneW = 150
        const lanes = [
            this.W / 2 - laneW * 2, this.W / 2 - laneW, this.W / 2,
            this.W / 2 + laneW, this.W / 2 + laneW * 2
        ]
        const horizonY = this.H * 0.38
        const taken = this.traffic.filter(c => c.y < horizonY + 80).map(c => c.lane)
        const free = [0, 1, 2, 3, 4].filter(l => !taken.includes(l))
        if (free.length === 0) return
        const lane = free[Math.floor(Math.random() * free.length)]
        this.traffic.push({
            x: lanes[lane], y: horizonY, lane,
            spd: 15 + Math.random() * 30,
            color: ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#e91e63', '#00bcd4'][Math.floor(Math.random() * 7)]
        })
    }

    checkHit() {
        const py = this.H - 120
        for (const car of this.traffic) {
            if (car.y + 70 > py && car.y < py + 70 && Math.abs(car.x - this.carX) < 45) {
                this.gameOver = true
                this.onGameOver({ score: this.score, distance: Math.floor(this.distance) })
                return
            }
        }
    }

    draw() {
        const ctx = this.ctx, W = this.W, H = this.H

        // Sky
        ctx.fillStyle = '#0a0a1a'
        ctx.fillRect(0, 0, W, H * 0.38)

        // Stars
        ctx.fillStyle = '#fff'
        for (let i = 0; i < 40; i++) {
            ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 400 + i) * 0.3
            ctx.beginPath()
            ctx.arc((i * 97 + i * i * 17) % W, (i * 67 + i * 11) % (H * 0.32), 1, 0, Math.PI * 2)
            ctx.fill()
        }
        ctx.globalAlpha = 1

        // Ground
        ctx.fillStyle = '#0f4a3a'
        ctx.fillRect(0, H * 0.38, W, H)

        this.drawRoad(ctx)

        // Traffic (with bigger lanes)
        const horizonY = H * 0.38
        for (const car of this.traffic) {
            const progress = (car.y - horizonY) / (H - horizonY)
            const scale = Math.max(0.2, Math.min(1, progress))
            const laneOffset = (car.lane - 2) * (150 * scale)  // Match wider lanes
            if (car.y > horizonY && scale > 0.15) {
                this.drawTrafficCar(ctx, W / 2 + laneOffset, car.y, car.color, scale)
            }
        }

        // Player
        this.drawPlayerCar(ctx, this.carX, H - 120)
        this.drawHUD(ctx)
        this.drawWheel(ctx)
        this.drawNitro(ctx)

        if (this.nitroOn) {
            ctx.fillStyle = 'rgba(255,130,0,0.12)'
            ctx.fillRect(0, 0, W, H)
        }
    }

    drawRoad(ctx) {
        const W = this.W, H = this.H, horizonY = H * 0.38

        for (let i = 0; i < 30; i++) {
            const t1 = i / 30, t2 = (i + 1) / 30
            const s1 = Math.pow(1 - t1, 1.3), s2 = Math.pow(1 - t2, 1.3)
            const y1 = H - (H - horizonY) * t1, y2 = H - (H - horizonY) * t2
            const rw1 = 780 * s1, rw2 = 780 * s2  // Wider road for wider lanes
            const cx = W / 2
            const stripe = Math.floor((i + this.roadY / 8) % 2)

            // Grass
            ctx.fillStyle = stripe === 0 ? '#1a5a4a' : '#165040'
            ctx.fillRect(0, y2, W, y1 - y2 + 1)

            // Road
            ctx.fillStyle = '#3a4a5a'
            ctx.beginPath()
            ctx.moveTo(cx - rw1 / 2, y1)
            ctx.lineTo(cx - rw2 / 2, y2)
            ctx.lineTo(cx + rw2 / 2, y2)
            ctx.lineTo(cx + rw1 / 2, y1)
            ctx.fill()

            // Walls
            if (s1 > 0.1) {
                const ww = 10 * s1
                ctx.fillStyle = stripe === 0 ? '#cc0000' : '#ffffff'
                ctx.beginPath()
                ctx.moveTo(cx - rw1 / 2 - ww, y1)
                ctx.lineTo(cx - rw2 / 2 - ww * s2 / s1, y2)
                ctx.lineTo(cx - rw2 / 2, y2)
                ctx.lineTo(cx - rw1 / 2, y1)
                ctx.fill()
                ctx.beginPath()
                ctx.moveTo(cx + rw1 / 2, y1)
                ctx.lineTo(cx + rw2 / 2, y2)
                ctx.lineTo(cx + rw2 / 2 + ww * s2 / s1, y2)
                ctx.lineTo(cx + rw1 / 2 + ww, y1)
                ctx.fill()
            }

            // Lanes
            if (stripe === 0 && s1 > 0.15) {
                ctx.fillStyle = '#fff'
                const lw = 2 * s1, ls = rw1 / 5
                for (let l = 1; l <= 4; l++) {
                    const o1 = -rw1 / 2 + l * ls, o2 = -rw2 / 2 + l * (rw2 / 5)
                    ctx.beginPath()
                    ctx.moveTo(cx + o1 - lw, y1)
                    ctx.lineTo(cx + o2 - lw, y2)
                    ctx.lineTo(cx + o2 + lw, y2)
                    ctx.lineTo(cx + o1 + lw, y1)
                    ctx.fill()
                }
            }
        }
    }

    drawTrafficCar(ctx, x, y, color, scale) {
        const w = 42 * scale
        const h = 68 * scale
        if (w < 10) return

        ctx.save()
        ctx.translate(x, y)

        // Enhanced shadow with blur
        ctx.fillStyle = `rgba(0,0,0,${0.25 + scale * 0.15})`
        ctx.beginPath()
        ctx.ellipse(0, h / 2 + 4 * scale, w / 2 + 3 * scale, 6 * scale, 0, 0, Math.PI * 2)
        ctx.fill()

        // Wheels (visible on sides)
        if (scale > 0.25) {
            ctx.fillStyle = '#1a1a1a'
            // Front wheels
            ctx.fillRect(-w / 2 - 3 * scale, -h / 2 + 8 * scale, 5 * scale, 14 * scale)
            ctx.fillRect(w / 2 - 2 * scale, -h / 2 + 8 * scale, 5 * scale, 14 * scale)
            // Rear wheels
            ctx.fillRect(-w / 2 - 3 * scale, h / 2 - 20 * scale, 5 * scale, 14 * scale)
            ctx.fillRect(w / 2 - 2 * scale, h / 2 - 20 * scale, 5 * scale, 14 * scale)
        }

        // Body with gradient
        const bodyGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0)
        bodyGrad.addColorStop(0, this.darken(color, 30))
        bodyGrad.addColorStop(0.3, color)
        bodyGrad.addColorStop(0.7, color)
        bodyGrad.addColorStop(1, this.darken(color, 30))
        ctx.fillStyle = bodyGrad
        ctx.beginPath()
        ctx.roundRect(-w / 2, -h / 2, w, h, 5 * scale)
        ctx.fill()

        // Rear window
        ctx.fillStyle = 'rgba(60,100,140,0.7)'
        ctx.beginPath()
        ctx.roundRect(-w / 2 + 4 * scale, -h / 2 + 5 * scale, w - 8 * scale, h * 0.28, 3 * scale)
        ctx.fill()

        // Roof (darker)
        ctx.fillStyle = this.darken(color, 40)
        ctx.beginPath()
        ctx.roundRect(-w / 2 + 3 * scale, -h / 2 + h * 0.22, w - 6 * scale, h * 0.32, 3 * scale)
        ctx.fill()

        // Roof highlight (shine)
        if (scale > 0.3) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)'
            ctx.beginPath()
            ctx.roundRect(-w / 2 + 6 * scale, -h / 2 + h * 0.25, w - 12 * scale, h * 0.1, 2 * scale)
            ctx.fill()
        }

        // Taillights with glow
        if (scale > 0.25) {
            ctx.fillStyle = '#ff3333'
            ctx.shadowColor = '#ff0000'
            ctx.shadowBlur = 8 * scale
            // Left taillight
            ctx.beginPath()
            ctx.roundRect(-w / 2 + 3 * scale, h / 2 - 7 * scale, 8 * scale, 4 * scale, 1 * scale)
            ctx.fill()
            // Right taillight
            ctx.beginPath()
            ctx.roundRect(w / 2 - 11 * scale, h / 2 - 7 * scale, 8 * scale, 4 * scale, 1 * scale)
            ctx.fill()
            ctx.shadowBlur = 0

            // Brake light bar (center)
            ctx.fillStyle = '#cc0000'
            ctx.fillRect(-w / 4, h / 2 - 5 * scale, w / 2, 2 * scale)
        }

        // Subtle outline
        if (scale > 0.4) {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.roundRect(-w / 2, -h / 2, w, h, 5 * scale)
            ctx.stroke()
        }

        ctx.restore()
    }

    darken(color, amt) {
        const hex = color.replace('#', '')
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amt)
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amt)
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amt)
        return `rgb(${r},${g},${b})`
    }

    drawPlayerCar(ctx, x, y) {
        const w = 40, h = 65
        ctx.save()
        ctx.translate(x, y)
        // NO ROTATION - car stays straight in all lanes
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.beginPath()
        ctx.ellipse(0, h / 2 + 5, w / 2 + 4, 8, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#1abc9c'
        ctx.beginPath()
        ctx.roundRect(-w / 2, -h / 2, w, h, 5)
        ctx.fill()
        ctx.fillStyle = 'rgba(0,220,255,0.5)'
        ctx.beginPath()
        ctx.roundRect(-w / 2 + 5, -h / 2 + 5, w - 10, h * 0.26, 3)
        ctx.fill()
        ctx.fillStyle = '#0e9b8a'
        ctx.beginPath()
        ctx.roundRect(-w / 2 + 3, -h / 2 + h * 0.22, w - 6, h * 0.3, 3)
        ctx.fill()
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(-w / 2 - 3, -h / 2 + 10, 6, 18)
        ctx.fillRect(w / 2 - 3, -h / 2 + 10, 6, 18)
        ctx.fillRect(-w / 2 - 3, h / 2 - 26, 6, 18)
        ctx.fillRect(w / 2 - 3, h / 2 - 26, 6, 18)
        ctx.fillStyle = '#ffffaa'
        ctx.shadowColor = '#ffff00'
        ctx.shadowBlur = 10
        ctx.fillRect(-w / 2 + 5, -h / 2 - 3, 10, 4)
        ctx.fillRect(w / 2 - 15, -h / 2 - 3, 10, 4)
        ctx.shadowBlur = 0
        ctx.strokeStyle = '#00ffff'
        ctx.lineWidth = 2
        ctx.shadowColor = '#00ffff'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.roundRect(-w / 2, -h / 2, w, h, 5)
        ctx.stroke()
        ctx.shadowBlur = 0
        if (this.nitroOn) {
            for (let i = 0; i < 2; i++) {
                ctx.fillStyle = `rgba(255,${100 + Math.random() * 80},0,0.9)`
                ctx.shadowColor = '#ff4400'
                ctx.shadowBlur = 15
                ctx.beginPath()
                ctx.moveTo(-10 + i * 14, h / 2)
                ctx.lineTo(-3 + i * 14, h / 2 + 25 + Math.random() * 25)
                ctx.lineTo(4 + i * 14, h / 2)
                ctx.fill()
            }
            ctx.shadowBlur = 0
        }
        ctx.restore()
    }

    drawHUD(ctx) {
        const W = this.W
        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.beginPath()
        ctx.roundRect(W - 130, 15, 110, 65, 8)
        ctx.fill()
        ctx.strokeStyle = '#2ecc71'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = '#2ecc71'
        ctx.font = 'bold 32px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(Math.floor(this.speed), W - 75, 52)
        ctx.font = '11px Arial'
        ctx.fillStyle = '#888'
        ctx.fillText('KM/H', W - 75, 68)

        ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.beginPath()
        ctx.roundRect(20, 15, 120, 65, 8)
        ctx.fill()
        ctx.strokeStyle = '#f39c12'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = '#888'
        ctx.font = '10px Arial'
        ctx.fillText('SCORE', 80, 32)
        ctx.fillStyle = '#f39c12'
        ctx.font = 'bold 26px monospace'
        ctx.fillText(this.score.toLocaleString(), 80, 60)

        ctx.fillStyle = '#666'
        ctx.font = '10px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`Distance: ${Math.floor(this.distance)}m`, 22, 95)
    }

    drawWheel(ctx) {
        const cx = 90, cy = this.H - 90, r = 55
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(this.wheelAngle * Math.PI / 180)
        ctx.strokeStyle = this.hands > 0 ? '#2ecc71' : '#555'
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(-r + 12, 0)
        ctx.lineTo(r - 12, 0)
        ctx.moveTo(0, -r + 12)
        ctx.lineTo(0, r - 12)
        ctx.stroke()
        ctx.fillStyle = '#222'
        ctx.beginPath()
        ctx.arc(0, 0, 15, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#e74c3c'
        ctx.beginPath()
        ctx.arc(0, -r + 5, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        ctx.fillStyle = this.hands > 0 ? '#2ecc71' : '#888'
        ctx.font = 'bold 11px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(this.hands > 0 ? '✓ HANDS OK' : 'SHOW HANDS', cx, cy + r + 18)
        ctx.fillStyle = '#aaa'
        ctx.font = '10px Arial'
        ctx.fillText(`${Math.round(this.wheelAngle)}°`, cx, cy + r + 32)
    }

    drawNitro(ctx) {
        const x = this.W - 160, y = this.H - 50, w = 130, h = 24
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.beginPath()
        ctx.roundRect(x, y, w, h, 5)
        ctx.fill()
        ctx.strokeStyle = this.nitroOn ? '#ff6600' : '#555'
        ctx.lineWidth = 2
        ctx.stroke()
        const fw = (this.nitro / 100) * (w - 4)
        const grad = ctx.createLinearGradient(x, 0, x + w, 0)
        grad.addColorStop(0, '#e74c3c')
        grad.addColorStop(0.5, '#f39c12')
        grad.addColorStop(1, '#f1c40f')
        ctx.fillStyle = this.nitro <= 5 ? '#666' : (this.nitroOn ? '#ff6600' : grad)
        ctx.beginPath()
        ctx.roundRect(x + 2, y + 2, fw, h - 4, 3)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 11px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(this.nitro <= 5 ? '⚡ EMPTY' : '⚡ NITRO', x + w / 2, y + h / 2 + 4)
        if (this.nitroOn) {
            ctx.fillStyle = '#ff6600'
            ctx.fillText('BOOST!', x + w / 2, y - 6)
        }
    }
}

export default GameCanvas
