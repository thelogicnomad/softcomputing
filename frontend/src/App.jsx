import { useState, useEffect, useRef, useCallback } from 'react'

import GameCanvas from './components/GameCanvas'
import CameraPanel from './components/CameraPanel'
import StartScreen from './components/StartScreen'
import GameOverScreen from './components/GameOverScreen'
import './App.css'

function App() {
  const [screen, setScreen] = useState('start') // start, game, gameover
  const [gameState, setGameState] = useState(null)
  const [controlData, setControlData] = useState({
    hands: 0, angle: 0, gesture: 0, steering: 0, speed: 0
  })
  const [cameraFrame, setCameraFrame] = useState(null)
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('fuzzyRacerHS') || '0')
  )
  const wsRef = useRef(null)
  const gameRef = useRef(null)

  const handleStart = useCallback(async () => {
    try {
      await fetch('http://localhost:8000/start', { method: 'POST' })

      const ws = new WebSocket('ws://localhost:8000/ws/game')

      ws.onopen = () => {
        console.log('Connected to game server')
        setScreen('game')
      }

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.error) {
          alert(data.error)
          setScreen('start')
          return
        }
        if (data.frame) setCameraFrame(`data:image/jpeg;base64,${data.frame}`)
        if (data.control) {
          setControlData({
            hands: data.hands,
            angle: data.angle,
            gesture: data.gesture,
            steering: data.control.steering,
            speed: data.control.speed
          })
        }
      }

      ws.onclose = () => {
        console.log('Disconnected')
        wsRef.current = null
      }

      wsRef.current = ws
    } catch (err) {
      alert('Cannot connect to server. Make sure backend is running!')
    }
  }, [])

  const handleGameOver = useCallback((finalState) => {
    setGameState(finalState)
    if (finalState.score > highScore) {
      setHighScore(finalState.score)
      localStorage.setItem('fuzzyRacerHS', finalState.score.toString())
    }
    setScreen('gameover')
  }, [highScore])

  const handleRestart = useCallback(async () => {
    await fetch('http://localhost:8000/reset', { method: 'POST' })
    if (gameRef.current) gameRef.current.reset()
    setScreen('game')
  }, [])

  const handleExit = useCallback(() => {
    if (wsRef.current) wsRef.current.close()
    setScreen('start')
  }, [])

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  return (
    <div className="app">
      {screen === 'start' && (
        <StartScreen onStart={handleStart} highScore={highScore} />
      )}

      {screen === 'game' && (
        <div className="game-layout">
          <CameraPanel
            frame={cameraFrame}
            hands={controlData.hands}
            angle={controlData.angle}
            steering={controlData.steering}
            speed={controlData.speed}
            onReset={handleRestart}
            onExit={handleExit}
          />
          <GameCanvas
            ref={gameRef}
            controlData={controlData}
            onGameOver={handleGameOver}
          />
        </div>
      )}

      {screen === 'gameover' && gameState && (
        <GameOverScreen
          score={gameState.score}
          distance={gameState.distance}
          isHighScore={gameState.score >= highScore}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}
    </div>
  )
}

export default App
