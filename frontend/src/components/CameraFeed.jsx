import './CameraFeed.css'

function CameraFeed({ frame, hands, angle, gesture }) {
    const gestureLabels = ['None', '🛑 Brake', '🖐️ Open', '👍 Nitro']

    return (
        <div className="camera-panel">
            <h3 className="panel-title">📷 Camera</h3>

            <div className="camera-container">
                {frame ? (
                    <img src={frame} alt="Camera feed" className="camera-image" />
                ) : (
                    <div className="camera-placeholder">
                        <span>Waiting for camera...</span>
                    </div>
                )}
            </div>

            <div className="camera-stats">
                <div className="stat">
                    <span className="stat-icon">✋</span>
                    <span className="stat-value">{hands}</span>
                    <span className="stat-label">Hands</span>
                </div>
                <div className="stat">
                    <span className="stat-icon">🎯</span>
                    <span className="stat-value">{angle.toFixed(0)}°</span>
                    <span className="stat-label">Angle</span>
                </div>
                <div className="stat">
                    <span className="stat-icon">🎮</span>
                    <span className="stat-value">{gestureLabels[gesture] || 'None'}</span>
                    <span className="stat-label">Gesture</span>
                </div>
            </div>
        </div>
    )
}

export default CameraFeed
