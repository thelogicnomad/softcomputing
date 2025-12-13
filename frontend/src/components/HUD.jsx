import { motion } from 'framer-motion'
import './HUD.css'

function HUD({ score, speed, nitro, nitroActive, shield }) {
    const speedKmh = Math.round(speed * 1.8)

    return (
        <div className="hud-overlay">
            {/* Score */}
            <motion.div
                className="hud-score"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <span className="hud-label">SCORE</span>
                <span className="hud-value">{score.toLocaleString()}</span>
            </motion.div>

            {/* Speed Display */}
            <motion.div
                className="hud-speed"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="speed-display">
                    <span className="speed-number">{speedKmh}</span>
                    <span className="speed-unit">KM/H</span>
                </div>

                {/* Speed Bar */}
                <div className="speed-bar">
                    <motion.div
                        className="speed-fill"
                        animate={{ width: `${(speed / 150) * 100}%` }}
                        transition={{ duration: 0.1 }}
                    />
                </div>
            </motion.div>

            {/* Nitro Bar */}
            <motion.div
                className="hud-nitro"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <span className="nitro-label">⚡ NITRO</span>
                <div className="nitro-track">
                    <motion.div
                        className={`nitro-fill ${nitroActive ? 'active' : ''}`}
                        animate={{ width: `${nitro}%` }}
                        transition={{ duration: 0.1 }}
                    />
                </div>
            </motion.div>

            {/* Shield Indicator */}
            {shield && (
                <motion.div
                    className="shield-indicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                >
                    🛡️ SHIELD
                </motion.div>
            )}
        </div>
    )
}

export default HUD
