import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { droneAudio } from '../../utils/droneAudio';

interface DroneModelProps {
  scrollProgress: number;
  mode?: 'scroll' | 'contact';
}

function DroneModel({ scrollProgress, mode = 'scroll' }: DroneModelProps) {
  const gltf = useGLTF('/drone.glb');
  const groupRef = useRef<THREE.Group>(null);

  const hubsRef = useRef<{
    flHub?: THREE.Group;
    frHub?: THREE.Group;
    rlHub?: THREE.Group;
    rrHub?: THREE.Group;
    gimbal?: THREE.Object3D;
  }>({});

  // Center, normalize scale, set unfolded flight pose, and construct clean rotor hubs
  const normalizedScene = React.useMemo(() => {
    const scene = gltf.scene;

    // Detach and remove distant cameras that skew the bounding box
    const camerasToRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      const n = obj.name.toLowerCase();
      if (
        obj.type === 'PerspectiveCamera' ||
        obj.type === 'OrthographicCamera' ||
        n.startsWith('camera.') ||
        n.includes('small_forweb') ||
        n.includes('capabilitiessectionscan') ||
        n.includes('capabiltiescam')
      ) {
        camerasToRemove.push(obj);
      }
    });
    camerasToRemove.forEach((cam) => cam.parent?.remove(cam));

    // Reset root transforms so drone body is stable and grounded
    const masterPSR = scene.getObjectByName('Master_PSR');
    if (masterPSR) {
      masterPSR.position.set(0, 0, 0);
      masterPSR.rotation.set(0, 0, 0);
      masterPSR.scale.set(1, 1, 1);
    }
    const djiRoot = scene.getObjectByName('DJI_Mavic_2_Pro');
    if (djiRoot) {
      djiRoot.position.set(0, 0, 0);
      djiRoot.rotation.set(0, 0, 0);
      djiRoot.scale.set(1, 1, 1);
    }

    // Set all 4 arms and 4 motors into their exact unfolded, aerodynamic flight pose
    const frontLeftArm = scene.getObjectByName('Front_Left_Arm');
    if (frontLeftArm) {
      frontLeftArm.quaternion.set(0, 0, 0, 1);
    }
    const frontRightArm = scene.getObjectByName('Front_Right_Arm_1');
    if (frontRightArm) {
      frontRightArm.quaternion.set(0, 0, 0, 1);
    }
    const rearLeftArm = scene.getObjectByName('Rear_Left_Arm');
    if (rearLeftArm) {
      rearLeftArm.quaternion.set(0.03719, 0.52200, -0.02279, 0.85183);
    }
    const rearRightArm = scene.getObjectByName('Rear_Right_Arm');
    if (rearRightArm) {
      rearRightArm.quaternion.set(0.03719, -0.52200, 0.02279, 0.85183);
    }

    const flMotor = scene.getObjectByName('FL_Motor_1');
    if (flMotor) {
      flMotor.quaternion.set(0.0109, -0.9919, 0.0357, 0.1211);
    }
    const frMotor = scene.getObjectByName('FR_Motor_1');
    if (frMotor) {
      frMotor.quaternion.set(0.0111, 0.9927, -0.0357, 0.1147);
    }
    const rlMotor = scene.getObjectByName('RL_Motor');
    if (rlMotor) {
      rlMotor.quaternion.set(0.0081, -0.4655, 0.0079, 0.8850);
    }
    const rrMotor = scene.getObjectByName('RR_Motor_1');
    if (rrMotor) {
      rrMotor.quaternion.set(0.0082, 0.4692, -0.0079, 0.8830);
    }

    // Construct dedicated Rotor Hubs for each motor so propeller blades spin symmetrically around their center axis
    const setupRotorHub = (
      motorNodeName: string,
      blade1Name: string,
      blade2Name: string,
      midpoint: [number, number, number]
    ) => {
      const motor = scene.getObjectByName(motorNodeName);
      const b1 = scene.getObjectByName(blade1Name);
      const b2 = scene.getObjectByName(blade2Name);
      if (motor && b1 && b2) {
        // Prevent duplicate creation on re-render
        let existingHub = motor.getObjectByName(`${motorNodeName}_RotorHub`) as THREE.Group | null;
        if (!existingHub) {
          existingHub = new THREE.Group();
          existingHub.name = `${motorNodeName}_RotorHub`;
          existingHub.position.set(midpoint[0], midpoint[1], midpoint[2]);
          motor.add(existingHub);

          // Reposition blades relative to the hub pivot
          b1.position.x -= midpoint[0];
          b1.position.y -= midpoint[1];
          b1.position.z -= midpoint[2];

          b2.position.x -= midpoint[0];
          b2.position.y -= midpoint[1];
          b2.position.z -= midpoint[2];

          existingHub.add(b1);
          existingHub.add(b2);
        }
        return existingHub;
      }
      return undefined;
    };

    const flHub = setupRotorHub('FL_Motor_1', 'FL_Propeller', 'FL_Propeller_2', [
      -0.0068,
      0.126,
      -0.0461,
    ]);
    const frHub = setupRotorHub('FR_Motor_1', 'FR_Propeller_1', 'FR_Propeller_3', [
      0.0073,
      0.126,
      -0.0459,
    ]);
    const rlHub = setupRotorHub('RL_Motor', 'RL_Propeller', 'RL_Propeller_2', [
      0.0078,
      0.126,
      0.0459,
    ]);
    const rrHub = setupRotorHub('RR_Motor_1', 'RR_Propeller', 'RR_Propeller_2', [
      -0.0078,
      0.126,
      0.0459,
    ]);

    const gimbal = scene.getObjectByName('Camera_ UPDOWN') || scene.getObjectByName('Camera_leftRight');

    hubsRef.current = { flHub, frHub, rlHub, rrHub, gimbal };

    // Reset transforms before measuring bounding box to prevent compounding mutations
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    // Calculate bounding box strictly on the drone body & arms
    const droneMeshRoot = djiRoot || masterPSR || scene;
    const box = new THREE.Box3().setFromObject(droneMeshRoot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Normalize scale so entire drone with wings and propellers fits comfortably
    const maxDim = Math.max(size.x, size.y, size.z);
    const factor = maxDim > 0 ? 3.0 / maxDim : 1.0;
    scene.scale.setScalar(factor);

    // Center pivot correctly in parent space by scaling center offset
    scene.position.set(-center.x * factor, -center.y * factor, -center.z * factor);

    return scene;
  }, [gltf]);

  // Flight positions & continuous rotation tracking
  const currentPos = useRef(new THREE.Vector3(0, 0.2, 0));
  const currentRot = useRef(new THREE.Euler(-0.1, Math.PI, 0));
  const currentScale = useRef(1.0);
  const prevScrollRef = useRef(scrollProgress);

  useFrame((state, delta) => {
    // 1. Realistic quadcopter rotor spin: Counter-rotating pairs in world space
    // Account for mirrored motor coordinate systems so the two front wings rotate in opposite directions
    const spinRate = delta * 65;
    if (hubsRef.current.flHub) hubsRef.current.flHub.rotation.y += spinRate;
    if (hubsRef.current.frHub) hubsRef.current.frHub.rotation.y += spinRate; // Inverted motor basis ensures opposite spin in world space
    if (hubsRef.current.rlHub) hubsRef.current.rlHub.rotation.y -= spinRate;
    if (hubsRef.current.rrHub) hubsRef.current.rrHub.rotation.y -= spinRate;

    // 2. Camera gimbal stabilization
    if (hubsRef.current.gimbal) {
      hubsRef.current.gimbal.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.08 - 0.1;
    }

    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // 3. Audio Throttle Response based on scroll velocity
    const scrollDelta = Math.abs(scrollProgress - prevScrollRef.current);
    prevScrollRef.current = scrollProgress;
    const scrollSpeed = Math.min(2.0, 1.0 + scrollDelta * 30);
    droneAudio.setThrottle(scrollSpeed);

    // 4. Responsive viewport dimensions & adaptive screen scaling
    const vpWidth = state.viewport.width;
    const isMobile = vpWidth < 4.6 || state.size.width < 768;
    const isTablet = !isMobile && (vpWidth < 6.2 || state.size.width < 1024);

    // Responsive scale multiplier:
    // On small screens, scales down proportionally based on viewport width (0.42 - 0.48)
    // so the entire drone with spinning blades fits within 75-80% screen width without clipping!
    const scaleFactor = isMobile
      ? Math.min(0.46, Math.max(0.36, (vpWidth * 0.70) / 3.8))
      : isTablet
      ? 0.75
      : 1.0;

    // Right-align offset on mobile: mobile is single stacked column, keep drone centered (0)
    const rightAlignX = isMobile ? 0 : isTablet ? 1.25 : 2.05;

    // Flight Travel Keyframes along scroll progress:
    const p = Math.min(1, Math.max(0, scrollProgress));

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetRotX = -0.04;
    let targetRotY = Math.PI;
    let targetRotZ = 0;
    let targetScale = 1.75 * scaleFactor;

    if (mode === 'contact') {
      // Stable hovering overview on the left column of Contact page
      targetX = 0;
      targetY = 0.05;
      targetZ = 0.4;
      targetRotX = 0.12;
      targetRotY = Math.PI - 0.25;
      targetRotZ = -0.04;
      targetScale = 1.15 * scaleFactor;
    } else if (p < 0.15) {
      // Stage 0: Hero Section - Framed inside the circular radar reticle stage
      targetX = 0;
      targetY = 0.02;
      targetZ = -0.1;
      targetRotX = -0.04;
      targetRotY = Math.PI;
      targetRotZ = 0;
      targetScale = 1.65 * scaleFactor;
    } else if (p < 0.22) {
      // Transition from Hero to Philosophy (Move cleanly to the RIGHT lane away from headline text)
      const local = (p - 0.15) / 0.07;
      targetX = THREE.MathUtils.lerp(0, rightAlignX, local);
      targetY = THREE.MathUtils.lerp(0.02, -0.04, local);
      targetZ = THREE.MathUtils.lerp(-0.1, -0.2, local);
      targetRotX = THREE.MathUtils.lerp(-0.04, 0.05, local);
      targetRotY = THREE.MathUtils.lerp(Math.PI, isMobile ? Math.PI : Math.PI - 0.28, local);
      targetRotZ = THREE.MathUtils.lerp(0, isMobile ? 0 : -0.04, local);
      targetScale = THREE.MathUtils.lerp(1.65 * scaleFactor, 1.15 * scaleFactor, local);
    } else if (p < 0.36) {
      // Stage 1: Philosophy & Mission - Stably positioned on the right visual column, leaving left 7 columns 100% unobstructed
      targetX = rightAlignX;
      targetY = -0.04;
      targetZ = -0.2;
      targetRotX = 0.05;
      targetRotY = isMobile ? Math.PI : Math.PI - 0.28;
      targetRotZ = isMobile ? 0 : -0.04;
      targetScale = 1.15 * scaleFactor;
    } else if (p < 0.44) {
      // Transition towards Telemetry Benchmark Arch
      const local = (p - 0.36) / 0.08;
      targetX = THREE.MathUtils.lerp(rightAlignX, 0, local);
      targetY = THREE.MathUtils.lerp(-0.04, isMobile ? 0.06 : 0.12, local);
      targetZ = THREE.MathUtils.lerp(-0.2, -0.1, local);
      targetRotX = THREE.MathUtils.lerp(0.05, -0.06, local);
      targetRotY = THREE.MathUtils.lerp(isMobile ? Math.PI : Math.PI - 0.28, Math.PI, local);
      targetRotZ = THREE.MathUtils.lerp(isMobile ? 0 : -0.04, 0, local);
      targetScale = THREE.MathUtils.lerp(1.15 * scaleFactor, 1.35 * scaleFactor, local);
    } else if (p < 0.54) {
      // Stage 2: Telemetry Benchmarks - Framed neatly in the upper dome aperture
      targetX = 0;
      targetY = isMobile ? 0.06 : 0.12;
      targetZ = -0.1;
      targetRotX = -0.06;
      targetRotY = Math.PI;
      targetRotZ = 0;
      targetScale = 1.35 * scaleFactor;
    } else if (p < 0.60) {
      // Transition from Telemetry to Core Capabilities Right Showcase
      const local = (p - 0.54) / 0.06;
      targetX = THREE.MathUtils.lerp(0, rightAlignX, local);
      targetY = THREE.MathUtils.lerp(isMobile ? 0.06 : 0.12, 0.0, local);
      targetZ = THREE.MathUtils.lerp(-0.1, -0.15, local);
      targetRotX = THREE.MathUtils.lerp(-0.06, 0.08, local);
      targetRotY = THREE.MathUtils.lerp(Math.PI, isMobile ? Math.PI : Math.PI - 0.35, local);
      targetRotZ = THREE.MathUtils.lerp(0, isMobile ? 0 : -0.05, local);
      targetScale = THREE.MathUtils.lerp(1.35 * scaleFactor, 1.10 * scaleFactor, local);
    } else if (p < 0.78) {
      // Stages 3 & 4: Core Capabilities & Operational Domains - Dedicated right visual bay
      targetX = rightAlignX;
      targetY = 0.0;
      targetZ = -0.15;
      targetRotX = 0.08;
      targetRotY = isMobile ? Math.PI : Math.PI - 0.32;
      targetRotZ = isMobile ? 0 : -0.04;
      targetScale = 1.10 * scaleFactor;
    } else if (p < 0.86) {
      // Transition towards Changelog Releases (Smooth Centered Hover)
      const local = (p - 0.78) / 0.08;
      targetX = THREE.MathUtils.lerp(rightAlignX, 0, local);
      targetY = THREE.MathUtils.lerp(0.0, 0.04, local);
      targetZ = THREE.MathUtils.lerp(-0.15, -0.25, local);
      targetRotX = THREE.MathUtils.lerp(0.08, -0.06, local);
      targetRotY = THREE.MathUtils.lerp(isMobile ? Math.PI : Math.PI - 0.32, Math.PI, local);
      targetRotZ = THREE.MathUtils.lerp(isMobile ? 0 : -0.04, 0, local);
      targetScale = THREE.MathUtils.lerp(1.10 * scaleFactor, 1.25 * scaleFactor, local);
    } else if (p < 0.94) {
      // Stage 5: Product Releases & Evolution
      targetX = 0;
      targetY = 0.04;
      targetZ = -0.25;
      targetRotX = -0.06;
      targetRotY = Math.PI;
      targetRotZ = 0;
      targetScale = 1.25 * scaleFactor;
    } else {
      // Stage 6: Approaching Footer - Gentle descent into negative space
      const local = (p - 0.94) / 0.06;
      targetX = 0;
      targetY = THREE.MathUtils.lerp(0.04, -0.28, local);
      targetZ = THREE.MathUtils.lerp(-0.25, -0.35, local);
      targetRotX = THREE.MathUtils.lerp(-0.06, -0.15, local);
      targetRotY = Math.PI;
      targetRotZ = 0;
      targetScale = THREE.MathUtils.lerp(1.25 * scaleFactor, 0.90 * scaleFactor, local);
    }

    // Aerodynamic flight sway (hover turbulences)
    const hoverY = Math.sin(t * 1.8) * 0.04;
    const hoverYaw = Math.sin(t * 0.9) * 0.04;
    const hoverPitch = Math.sin(t * 1.2) * 0.03;
    const hoverRoll = Math.sin(t * 1.4) * 0.025;

    // Smooth dampening towards target values (smooth 60fps interpolation)
    const lerpSpeed = Math.min(1, delta * 5.0);
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, targetX, lerpSpeed);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, targetY + hoverY, lerpSpeed);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, targetZ, lerpSpeed);

    currentRot.current.x = THREE.MathUtils.lerp(currentRot.current.x, targetRotX + hoverPitch, lerpSpeed);
    currentRot.current.y = THREE.MathUtils.lerp(currentRot.current.y, targetRotY + hoverYaw, lerpSpeed);
    currentRot.current.z = THREE.MathUtils.lerp(currentRot.current.z, targetRotZ + hoverRoll, lerpSpeed);

    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, lerpSpeed);

    // Apply to group
    groupRef.current.position.copy(currentPos.current);
    groupRef.current.rotation.copy(currentRot.current);
    groupRef.current.scale.setScalar(currentScale.current);
  });

  return (
    <group ref={groupRef}>
      <primitive object={normalizedScene} />
    </group>
  );
}

function DroneFallback() {
  return (
    <mesh scale={0.8}>
      <octahedronGeometry args={[1, 2]} />
      <meshStandardMaterial color="#24363f" wireframe />
    </mesh>
  );
}

interface AevionDroneCanvasProps {
  onLoaded?: () => void;
  mode?: 'scroll' | 'contact';
}

export const AevionDroneCanvas: React.FC<AevionDroneCanvasProps> = ({
  onLoaded,
  mode = 'scroll',
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  // Notify parent loader when canvas is initialized
  useEffect(() => {
    if (onLoaded) {
      onLoaded();
    }
  }, [onLoaded]);

  // Passive scroll listener (only needed in scroll mode)
  useEffect(() => {
    if (mode !== 'scroll') return;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docHeight =
            document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (docHeight > 0) {
            const progress = window.scrollY / docHeight;
            setScrollProgress(progress);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mode]);

  if (mode === 'contact') {
    return (
      <div className="w-full h-full pointer-events-none flex items-center justify-center relative min-h-[380px] sm:min-h-[460px] lg:min-h-[580px]">
        <Canvas
          camera={{ position: [0, 0.4, 5.2], fov: 38 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          style={{ pointerEvents: 'none' }}
          className="w-full h-full"
        >
          <ambientLight intensity={2.0} />
          <directionalLight position={[10, 15, 10]} intensity={3.2} />
          <directionalLight position={[-10, 8, 8]} intensity={2.2} />
          <pointLight position={[0, 0, 4]} intensity={2.8} color="#a7eed8" />
          <Environment files="/drone-env.jpg" />
          <Suspense fallback={<DroneFallback />}>
            <DroneModel scrollProgress={0} mode="contact" />
          </Suspense>
        </Canvas>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 6.0], fov: 38 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
        className="w-full h-full"
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[10, 15, 10]} intensity={3.0} />
        <directionalLight position={[-10, 8, 8]} intensity={2.0} />
        <pointLight position={[0, 0, 4]} intensity={2.5} color="#a7eed8" />
        <Environment files="/drone-env.jpg" />
        <Suspense fallback={<DroneFallback />}>
          <DroneModel scrollProgress={scrollProgress} mode="scroll" />
        </Suspense>
      </Canvas>
    </div>
  );
};

useGLTF.preload('/drone.glb');
