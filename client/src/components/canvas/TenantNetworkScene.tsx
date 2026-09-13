import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleCluster() {
  const ref = useRef<THREE.Points>(null!);

  // Generate 2,000 randomized sphere particles for multi-tenant network simulation
  const sphere = useMemo(() => {
    const coords = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 3.5;
      const sinPhi = Math.sin(phi);
      coords[i * 3] = r * sinPhi * Math.cos(theta);
      coords[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      coords[i * 3 + 2] = r * Math.cos(phi);
    }
    return coords;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 18;
      ref.current.rotation.y -= delta / 24;
      // Gentle responsive tilt toward cursor coordinates
      ref.current.rotation.z = THREE.MathUtils.lerp(
        ref.current.rotation.z,
        state.pointer.x * 0.15,
        0.05
      );
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#D4FF00"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export const TenantNetworkScene: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <ParticleCluster />
      </Canvas>
    </div>
  );
};
