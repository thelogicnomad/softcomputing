import './GameOverScreen.css'

export default function GameOverScreen({ score, distance, isHighScore, onRestart, onExit }) {
    return (
        <div className="gameover-screen">
            <div className="gameover-content">
                <h1 className="crash-title">💥 CRASH!</h1>

                {isHighScore && (
                    <div className="new-highscore">🏆 NEW HIGH SCORE! 🏆</div>
                )}

                <div className="final-stats">
                    <div className="stat-card">
                        <span className="stat-icon">🎯</span>
                        <span className="stat-label">SCORE</span>
                        <span className="stat-value score">{score.toLocaleString()}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">📏</span>
                        <span className="stat-label">DISTANCE</span>
                        <span className="stat-value">{Math.floor(distance).toLocaleString()}m</span>
                    </div>
                </div>

                <div className="gameover-buttons">
                    <button className="btn btn-primary" onClick={onRestart}>
                        🔄 RACE AGAIN
                    </button>
                    <button className="btn btn-secondary" onClick={onExit}>
                        🏠 MENU
                    </button>
                </div>
            </div>
        </div>
    )
}
