import { useMemo } from 'react'
import { motion } from 'framer-motion'
import './FuzzyLogicPanel.css'

function FuzzyLogicPanel({ angle, steering, speed, hands }) {
    // Calculate fuzzy membership values
    const memberships = useMemo(() => {
        // Steering angle memberships
        const steerMemberships = calculateSteeringMemberships(angle)

        // Speed memberships based on hands
        const speedMemberships = calculateSpeedMemberships(hands)

        return { steering: steerMemberships, speed: speedMemberships }
    }, [angle, hands])

    return (
        <div className="fuzzy-panel">
            <h3 className="panel-title">🧠 Fuzzy Logic</h3>

            {/* Steering Input */}
            <div className="fuzzy-section">
                <h4>Steering Input</h4>
                <div className="membership-bars">
                    {Object.entries(memberships.steering).map(([name, value]) => (
                        <div key={name} className="membership-bar">
                            <span className="bar-label">{name}</span>
                            <div className="bar-track">
                                <motion.div
                                    className="bar-fill"
                                    animate={{ width: `${value * 100}%` }}
                                    transition={{ duration: 0.1 }}
                                    style={{
                                        background: value > 0.5 ? '#00f0ff' : 'rgba(0,240,255,0.3)'
                                    }}
                                />
                            </div>
                            <span className="bar-value">{(value * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Speed Control */}
            <div className="fuzzy-section">
                <h4>Speed Control</h4>
                <div className="membership-bars">
                    {Object.entries(memberships.speed).map(([name, value]) => (
                        <div key={name} className="membership-bar">
                            <span className="bar-label">{name}</span>
                            <div className="bar-track">
                                <motion.div
                                    className="bar-fill"
                                    animate={{ width: `${value * 100}%` }}
                                    transition={{ duration: 0.1 }}
                                    style={{
                                        background: value > 0.5 ? '#ffaa00' : 'rgba(255,170,0,0.3)'
                                    }}
                                />
                            </div>
                            <span className="bar-value">{(value * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Output Values */}
            <div className="fuzzy-outputs">
                <div className="output-item">
                    <span className="output-label">Steering Output</span>
                    <span className="output-value" style={{ color: steering > 0 ? '#00ff88' : '#ff6688' }}>
                        {steering > 0 ? '→ ' : '← '}{Math.abs(steering).toFixed(0)}
                    </span>
                </div>
                <div className="output-item">
                    <span className="output-label">Speed Output</span>
                    <span className="output-value">{speed.toFixed(0)}%</span>
                </div>
            </div>

            {/* Fuzzy Rules Active */}
            <div className="rules-section">
                <h4>Active Rules</h4>
                <div className="rules-list">
                    {getActiveRules(angle, hands).map((rule, i) => (
                        <div key={i} className="rule-item">
                            <span className="rule-icon">⚡</span>
                            <span className="rule-text">{rule}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Calculate steering membership functions
function calculateSteeringMemberships(angle) {
    const clampedAngle = Math.max(-90, Math.min(90, angle))

    return {
        'Far Left': Math.max(0, Math.min(1, (-clampedAngle - 30) / 30)),
        'Left': triangular(clampedAngle, -60, -30, 0),
        'Center': triangular(clampedAngle, -20, 0, 20),
        'Right': triangular(clampedAngle, 0, 30, 60),
        'Far Right': Math.max(0, Math.min(1, (clampedAngle - 30) / 30))
    }
}

// Calculate speed membership functions
function calculateSpeedMemberships(hands) {
    return {
        'Stop': hands === 0 ? 1 : 0,
        'Slow': hands === 1 ? 1 : (hands === 0 ? 0.3 : 0),
        'Fast': hands === 2 ? 1 : (hands === 1 ? 0.3 : 0)
    }
}

// Triangular membership function
function triangular(x, a, b, c) {
    if (x <= a || x >= c) return 0
    if (x === b) return 1
    if (x < b) return (x - a) / (b - a)
    return (c - x) / (c - b)
}

// Get active fuzzy rules
function getActiveRules(angle, hands) {
    const rules = []

    if (angle < -30) rules.push('IF angle=FarLeft THEN steer=HardLeft')
    else if (angle < 0) rules.push('IF angle=Left THEN steer=Left')
    else if (angle < 30) rules.push('IF angle=Center THEN steer=Straight')
    else rules.push('IF angle=Right THEN steer=Right')

    if (hands === 0) rules.push('IF hands=None THEN speed=Stop')
    else if (hands === 1) rules.push('IF hands=One THEN speed=Slow')
    else rules.push('IF hands=Two THEN speed=Fast')

    return rules
}

export default FuzzyLogicPanel
