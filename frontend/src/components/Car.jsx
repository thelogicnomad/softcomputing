import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Car({ position, steering, speed, nitroActive, shield }) {
    const carRef = useRef()
    const wheelsRef = useRef([])
    const exhaustRef = useRef()

    // Smooth steering
    const targetRotation = useRef(0)

    useFrame((state, delta) => {
        if (!carRef.current) return

        // Smooth tilt based on steering
        targetRotation.current = (steering / 100) * 0.3
        carRef.current.rotation.z = THREE.MathUtils.lerp(
            carRef.current.rotation.z,
            -targetRotation.current,
            0.1
        )

        // Wheel rotation based on speed
        wheelsRef.current.forEach(wheel => {
            if (wheel) {
                wheel.rotation.x += speed * delta * 0.1
            }
        })

        // Bobbing at speed
        if (speed > 0) {
            carRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 10) * 0.02
        }
    })

    return (
        <group position={position} ref={carRef}>
            {/* Car body */}
            <mesh castShadow position={[0, 0.3, 0]}>
                <boxGeometry args={[1.2, 0.5, 2.5]} />
                <meshStandardMaterial
                    color="#4ecdc4"
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Cabin */}
            <mesh castShadow position={[0, 0.7, -0.2]}>
                <boxGeometry args={[1, 0.4, 1.2]} />
                <meshStandardMaterial
                    color="#1a1a3a"
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Windshield */}
            <mesh position={[0, 0.7, 0.5]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[0.9, 0.35, 0.1]} />
                <meshStandardMaterial
                    color="#88ccff"
                    transparent
                    opacity={0.5}
                    metalness={1}
                    roughness={0}
                />
            </mesh>

            {/* Wheels */}
            {[
                [-0.6, 0, 0.8],
                [0.6, 0, 0.8],
                [-0.6, 0, -0.8],
                [0.6, 0, -0.8]
            ].map((pos, i) => (
                <mesh
                    key={i}
                    position={pos}
                    rotation={[0, 0, Math.PI / 2]}
                    ref={el => wheelsRef.current[i] = el}
                >
                    <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
                    <meshStandardMaterial color="#111111" />
                </mesh>
            ))}

            {/* Headlights */}
            <pointLight position={[0.3, 0.3, 1.3]} color="#ffffaa" intensity={2} distance={10} />
            <pointLight position={[-0.3, 0.3, 1.3]} color="#ffffaa" intensity={2} distance={10} />

            {/* Taillights */}
            <mesh position={[0.4, 0.3, -1.25]}>
                <boxGeometry args={[0.2, 0.15, 0.05]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
            </mesh>
            <mesh position={[-0.4, 0.3, -1.25]}>
                <boxGeometry args={[0.2, 0.15, 0.05]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
            </mesh>

            {/* Nitro flames */}
            {nitroActive && (
                <>
                    <pointLight position={[0, 0.3, -1.5]} color="#ff6600" intensity={5} distance={5} />
                    <mesh position={[0.3, 0.3, -1.5]}>
                        <coneGeometry args={[0.1, 0.6, 8]} />
                        <meshStandardMaterial
                            color="#ff8800"
                            emissive="#ff4400"
                            emissiveIntensity={2}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                    <mesh position={[-0.3, 0.3, -1.5]}>
                        <coneGeometry args={[0.1, 0.6, 8]} />
                        <meshStandardMaterial
                            color="#ff8800"
                            emissive="#ff4400"
                            emissiveIntensity={2}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                </>
            )}

            {/* Shield effect */}
            {shield && (
                <mesh>
                    <sphereGeometry args={[1.8, 16, 16]} />
                    <meshStandardMaterial
                        color="#00aaff"
                        transparent
                        opacity={0.2}
                        emissive="#00aaff"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            )}

            {/* Neon underglow */}
            <pointLight position={[0, -0.3, 0]} color="#00f0ff" intensity={2} distance={3} />
        </group>
    )
}

export default Car
