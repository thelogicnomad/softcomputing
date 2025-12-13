import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import Car from './Car'
import Road from './Road'
import TrafficCar from './TrafficCar'

function Game3D({ gameData, controlData }) {
    const groupRef = useRef()

    // Camera follows car position
    useFrame((state) => {
        if (gameData) {
            const targetX = gameData.player_x * 3
            state.camera.position.x = THREE.MathUtils.lerp(
                state.camera.position.x,
                targetX * 0.3,
                0.05
            )
            state.camera.lookAt(targetX * 0.5, 0, -10)
        }
    })

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight
                position={[10, 20, 5]}
                intensity={1}
                castShadow
                color="#ffffff"
            />
            <pointLight position={[-10, 10, -10]} intensity={0.5} color="#00f0ff" />
            <pointLight position={[10, 10, -10]} intensity={0.5} color="#ff00aa" />

            {/* Stars background */}
            <Stars
                radius={100}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />

            {/* Fog for depth */}
            <fog attach="fog" args={['#0a0a1a', 20, 80]} />

            {/* Road */}
            <Road
                speed={gameData?.speed || 0}
                offset={gameData?.road_offset || 0}
            />

            {/* Player Car */}
            <Car
                position={[gameData?.player_x * 3 || 0, 0.5, 0]}
                steering={controlData.steering}
                speed={gameData?.speed || 0}
                nitroActive={gameData?.nitro_active || false}
                shield={gameData?.shield || false}
                invincible={gameData?.invincible || false}
            />

            {/* Traffic Cars - using z coordinate */}
            {gameData?.traffic?.map((car, i) => {
                // z goes from 0 (horizon) to 1 (near player)
                // Map to 3D: z=0 -> far away (-60), z=1 -> near player (0)
                const zPos = -60 + car.z * 60
                const xPos = car.x * 5  // Widen the road lanes

                return (
                    <TrafficCar
                        key={i}
                        position={[xPos, 0.5, zPos]}
                        color={car.color}
                        scale={1}
                    />
                )
            })}

            {/* Power-ups */}
            {gameData?.powerups?.map((pu, i) => {
                const zPos = -60 + pu.z * 60
                const xPos = pu.x * 5

                return (
                    <PowerUp
                        key={`pu-${i}`}
                        position={[xPos, 1.5, zPos]}
                        type={pu.type}
                    />
                )
            })}
        </>
    )
}

// Power-up component
function PowerUp({ position, type }) {
    const meshRef = useRef()

    const color = type === 'nitro' ? '#ff8800' :
        type === 'shield' ? '#00aaff' : '#ffff00'

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.05
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.3
        }
    })

    return (
        <group position={position}>
            <pointLight color={color} intensity={3} distance={8} />
            <mesh ref={meshRef}>
                <octahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                />
            </mesh>
        </group>
    )
}

export default Game3D
