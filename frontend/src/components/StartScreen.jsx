import './StartScreen.css'

export default function StartScreen({ onStart, highScore }) {
    return (
        <div className="start-screen">
            <div className="bg-shapes">
                <div className="shape s1" />
                <div className="shape s2" />
            </div>

            <div className="menu-content">
                <h1 className="game-title">🏎️ FUZZY RACER</h1>
                <p className="subtitle">Hand Gesture Racing with Soft Computing</p>

                <button className="btn btn-primary start-btn" onClick={onStart}>
                    ▶ START RACE
                </button>

                <div className="high-score">
                    HIGH SCORE: <span>{highScore.toLocaleString()}</span>
                </div>

                <div className="instructions">
                    <h3>🎮 Controls</h3>
                    <div className="controls-grid">
                        <div className="control-item">
                            <span className="icon">✋✋</span>
                            <span><strong>2 Hands</strong> = Full Speed</span>
                        </div>
                        <div className="control-item">
                            <span className="icon">✋</span>
                            <span><strong>1 Hand</strong> = Slow</span>
                        </div>
                        <div className="control-item">
                            <span className="icon">👈👉</span>
                            <span><strong>Move</strong> = Steer</span>
                        </div>
                        <div className="control-item">
                            <span className="icon">👍</span>
                            <span><strong>Thumbs Up</strong> = Nitro!</span>
                        </div>
                    </div>
                </div>

                <div className="tech-badges">
                    <span className="badge">React</span>
                    <span className="badge">Fuzzy Logic</span>
                    <span className="badge">MediaPipe</span>
                    <span className="badge">FastAPI</span>
                </div>
            </div>
        </div>
    )
}
