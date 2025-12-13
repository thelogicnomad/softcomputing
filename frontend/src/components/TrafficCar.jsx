import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function TrafficCar({ position, color }) {
    const meshRef = useRef()

    useFrame(() => {
        if (meshRef.current) {
            // Slight sway
            meshRef.current.rotation.z = Math.sin(Date.now() / 500) * 0.02
        }
    })

    return (
        <group position={position} ref={meshRef}>
            {/* Body */}
            <mesh castShadow position={[0, 0.3, 0]}>
                <boxGeometry args={[1, 0.5, 2]} />
                <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Cabin */}
            <mesh castShadow position={[0, 0.65, -0.1]}>
                <boxGeometry args={[0.9, 0.35, 1]} />
                <meshStandardMaterial color="#1a1a3a" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Wheels */}
            {[
                [-0.5, 0, 0.7],
                [0.5, 0, 0.7],
                [-0.5, 0, -0.7],
                [0.5, 0, -0.7]
            ].map((pos, i) => (
                <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.15, 12]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            ))}

            {/* Taillights */}
            <mesh position={[0.35, 0.3, -1]}>
                <boxGeometry args={[0.15, 0.1, 0.02]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[-0.35, 0.3, -1]}>
                <boxGeometry args={[0.15, 0.1, 0.02]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
            </mesh>
        </group>
    )
}

export default TrafficCar
