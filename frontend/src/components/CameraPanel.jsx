import './CameraPanel.css'

export default function CameraPanel({ frame, hands, angle, steering, speed, onReset, onExit }) {
    const steerPercent = 50 + (steering / 2)  // -100 to 100 -> 0 to 100
    const speedPercent = speed

    return (
        <div className="camera-panel">
            {/* Camera Feed */}
            <div className="camera-box">
                {frame ? (
                    <img src={frame} alt="Camera" />
                ) : (
                    <div className="camera-placeholder">📷 Waiting for camera...</div>
                )}
                <div className="camera-stats">
                    <div className="stat">
                        <span className="stat-label">HANDS</span>
                        <span className="stat-value">{hands}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">ANGLE</span>
                        <span className="stat-value">{Math.round(angle)}°</span>
                    </div>
                </div>
            </div>

            {/* Fuzzy Logic Panel */}
            <div className="fuzzy-panel">
                <h4>🧠 Fuzzy Logic</h4>
                <div className="fuzzy-bars">
                    <div className="fuzzy-bar">
                        <span>Steering</span>
                        <div className="bar-track">
                            <div
                                className="bar-fill steer"
                                style={{
                                    width: Math.abs(steering) + '%',
                                    marginLeft: steering < 0 ? (50 - Math.abs(steering) / 2) + '%' : '50%',
                                    background: steering < 0 ? '#ff00aa' : '#00f0ff'
                                }}
                            />
                            <div className="bar-center" />
                        </div>
                    </div>
                    <div className="fuzzy-bar">
                        <span>Speed</span>
                        <div className="bar-track">
                            <div className="bar-fill speed" style={{ width: speedPercent + '%' }} />
                        </div>
                    </div>
                </div>

                <div className="fuzzy-rules">
                    <h5>Active Rules</h5>
                    <div className="rule">
                        {hands === 0 && '⚡ IF hands=0 THEN speed=STOP'}
                        {hands === 1 && '⚡ IF hands=1 THEN speed=SLOW'}
                        {hands === 2 && '⚡ IF hands=2 THEN speed=FAST'}
                    </div>
                    <div className="rule">
                        {Math.abs(angle) < 15 && '⚡ IF angle=CENTER THEN steer=STRAIGHT'}
                        {angle <= -15 && '⚡ IF angle=LEFT THEN steer=LEFT'}
                        {angle >= 15 && '⚡ IF angle=RIGHT THEN steer=RIGHT'}
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="panel-buttons">
                <button className="btn btn-secondary" onClick={onReset}>🔄 Reset</button>
                <button className="btn btn-secondary" onClick={onExit}>🚪 Exit</button>
            </div>
        </div>
    )
}
