import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Road({ speed, offset }) {
    const roadRef = useRef()
    const linesRef = useRef()

    // Animated road lines
    useFrame((state, delta) => {
        if (linesRef.current) {
            linesRef.current.position.z += speed * delta * 0.1
            if (linesRef.current.position.z > 10) {
                linesRef.current.position.z = 0
            }
        }
    })

    // Road segments
    const segments = useMemo(() => {
        const segs = []
        for (let i = 0; i < 20; i++) {
            segs.push({
                z: -i * 10,
                isAlternate: i % 2 === 0
            })
        }
        return segs
    }, [])

    // Lane lines
    const laneLines = useMemo(() => {
        const lines = []
        for (let i = 0; i < 40; i++) {
            lines.push({ z: -i * 5, visible: i % 2 === 0 })
        }
        return lines
    }, [])

    return (
        <group ref={roadRef}>
            {/* Main road surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]} receiveShadow>
                <planeGeometry args={[12, 200]} />
                <meshStandardMaterial color="#2a2a3a" />
            </mesh>

            {/* Road edges - left */}
            {segments.map((seg, i) => (
                <mesh
                    key={`left-${i}`}
                    position={[-6.5, 0.01, seg.z - 5]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <planeGeometry args={[1, 10]} />
                    <meshStandardMaterial
                        color={seg.isAlternate ? '#e94560' : '#ffffff'}
                        emissive={seg.isAlternate ? '#e94560' : '#ffffff'}
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}

            {/* Road edges - right */}
            {segments.map((seg, i) => (
                <mesh
                    key={`right-${i}`}
                    position={[6.5, 0.01, seg.z - 5]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <planeGeometry args={[1, 10]} />
                    <meshStandardMaterial
                        color={seg.isAlternate ? '#e94560' : '#ffffff'}
                        emissive={seg.isAlternate ? '#e94560' : '#ffffff'}
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}

            {/* Center lane lines */}
            <group ref={linesRef}>
                {laneLines.map((line, i) => line.visible && (
                    <mesh
                        key={`line-${i}`}
                        position={[0, 0.02, line.z]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <planeGeometry args={[0.2, 3]} />
                        <meshStandardMaterial
                            color="#ffffff"
                            emissive="#ffffff"
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                ))}
            </group>

            {/* Lane dividers */}
            <group ref={linesRef}>
                {laneLines.map((line, i) => line.visible && (
                    <>
                        <mesh
                            key={`lane-left-${i}`}
                            position={[-3, 0.02, line.z]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <planeGeometry args={[0.1, 2]} />
                            <meshStandardMaterial
                                color="#ffffff"
                                transparent
                                opacity={0.5}
                            />
                        </mesh>
                        <mesh
                            key={`lane-right-${i}`}
                            position={[3, 0.02, line.z]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <planeGeometry args={[0.1, 2]} />
                            <meshStandardMaterial
                                color="#ffffff"
                                transparent
                                opacity={0.5}
                            />
                        </mesh>
                    </>
                ))}
            </group>

            {/* Ground/grass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, -0.1, -50]}>
                <planeGeometry args={[20, 200]} />
                <meshStandardMaterial color="#0f3460" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.1, -50]}>
                <planeGeometry args={[20, 200]} />
                <meshStandardMaterial color="#0f3460" />
            </mesh>
        </group>
    )
}

export default Road
