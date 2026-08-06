import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    Grid,
    Environment,
} from "@react-three/drei";
import {
    Suspense,
    useRef,
} from "react";
import {
    Group,
    Mesh,
    MeshStandardMaterial,
    BoxGeometry,
    AmbientLight,
    DirectionalLight,
} from "three";

function DefaultModel() {
    const model = useRef<Group>(null);

    return (
        <group ref={model}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[1, 2, 1]} />

                <meshStandardMaterial
                    color="#4a90e2"
                    roughness={0.6}
                    metalness={0.1}
                />
            </mesh>

            <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[3, 0.2, 3]} />

                <meshStandardMaterial
                    color="#555555"
                    roughness={1}
                />
            </mesh>
        </group>
    );
}

function SceneLights() {
    return (
        <>
            <ambientLight intensity={0.6} />

            <directionalLight
                position={[5, 8, 5]}
                intensity={1.2}
            />
        </>
    );
}

export default function Viewport() {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: "#151515",
                overflow: "hidden",
            }}
        >
            <Canvas
                camera={{
                    position: [5, 4, 5],
                    fov: 45,
                    near: 0.1,
                    far: 1000,
                }}
            >
                <Suspense fallback={null}>
                    <SceneLights />

                    <DefaultModel />

                    <Grid
                        args={[20, 20]}
                        position={[0, -0.35, 0]}
                        cellSize={0.5}
                        cellThickness={0.5}
                        sectionSize={5}
                        sectionThickness={1}
                    />

                    <Environment preset="city" />

                    <OrbitControls
                        enableDamping
                        dampingFactor={0.08}
                        minDistance={2}
                        maxDistance={30}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
