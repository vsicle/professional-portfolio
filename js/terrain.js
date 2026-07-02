// terrain.js — wireframe topographic contour mesh evoking the Wasatch.
// ES module. Dynamically imported by index.html only when WebGL is available
// and prefers-reduced-motion is NOT set. Atmosphere, not spectacle.
import * as THREE from 'three';

const vertexShader = /* glsl */ `
    precision highp float;

    uniform float uTime;

    varying float vElevation;
    varying vec2  vUv;

    //
    // Ashima Arts / Stefan Gustavson simplex noise (2D).
    // https://github.com/ashima/webgl-noise  (MIT)
    //
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,   // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,   // 0.5*(sqrt(3.0)-1.0)
                           -0.577350269189626,   // -1.0 + 2.0 * C.x
                            0.024390243902439);  // 1.0 / 41.0
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);

        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;

        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                                + i.x + vec3(0.0, i1.x, 1.0));

        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                                dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;

        vec3 x  = 2.0 * fract(p * C.www) - 1.0;
        vec3 h  = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;

        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    // Ridged multi-octave fBm: 1.0 - abs(noise) sharpens crests into alpine ridges.
    float ridged(vec2 p) {
        float sum   = 0.0;
        float amp   = 0.55;
        float freq  = 1.0;
        float total = 0.0;
        for (int o = 0; o < 4; o++) {
            float n = snoise(p * freq);
            n = 1.0 - abs(n);
            n *= n;
            sum   += n * amp;
            total += amp;
            amp   *= 0.5;
            freq  *= 2.0;
        }
        return sum / total;
    }

    void main() {
        vUv = uv;

        // Very slow domain drift so the range morphs almost imperceptibly.
        vec2 drift = vec2(uTime * 0.012, uTime * -0.008);
        vec2 p = position.xy * 0.42 + drift;

        // Bias the ridge line so the near edge sits lower than the far skyline.
        float e = ridged(p);
        e += ridged(p * 2.7 + 4.1) * 0.18;
        e *= smoothstep(-5.2, 4.5, position.y) * 0.85 + 0.35;

        vElevation = e;

        vec3 displaced = position;
        displaced.z += e * 2.35;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    precision highp float;

    uniform vec3  uInk;      // spruce line color
    uniform vec3  uAccent;   // alpenglow rust (high)
    uniform vec3  uSage;     // contour sage (low)

    varying float vElevation;
    varying vec2  vUv;

    // Anti-aliased iso line at a given spacing using fract + fwidth.
    float contour(float value, float spacing, float thickness) {
        float f  = value / spacing;
        float g  = abs(fract(f - 0.5) - 0.5) / fwidth(f);
        return 1.0 - smoothstep(0.0, thickness, g);
    }

    void main() {
        float elev = vElevation;

        // Minor lines (thin) plus a stronger index line every 5th step.
        float minorSpacing = 0.045;
        float minor = contour(elev, minorSpacing, 1.1);
        float major = contour(elev, minorSpacing * 5.0, 1.35);

        float line = max(minor * 0.42, major * 0.85);

        // Elevation tint: high toward rust alpenglow, low toward sage.
        float hi = smoothstep(0.55, 0.95, elev);
        float lo = smoothstep(0.35, 0.02, elev);
        vec3 col = uInk;
        col = mix(col, uAccent, hi * 0.55);
        col = mix(col, uSage,   lo * 0.35);

        // Edge vignette in UV space so the plane dissolves into the page.
        vec2 d = abs(vUv - 0.5) * 2.0;
        float vig = (1.0 - smoothstep(0.55, 1.0, d.x)) *
                    (1.0 - smoothstep(0.55, 1.0, d.y));

        float alpha = line * vig * 0.9;
        if (alpha < 0.003) discard;

        gl_FragColor = vec4(col, alpha);
    }
`;

/**
 * Mount the terrain hero into hostElement. Idempotent-ish: the caller only
 * invokes this once. Returns a disposer, though index.html ignores it.
 */
export function mountTerrain(hostElement) {
    if (!hostElement) return function () {};

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0); // no scene background; paper shows through
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    hostElement.appendChild(canvas);

    const scene = new THREE.Scene();

    // Camera sits low and looks across the mesh like a ridge line at dusk.
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const baseCamPos = new THREE.Vector3(0, 1.15, 7.2);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 0.35, -3.5);

    const geometry = new THREE.PlaneGeometry(16, 10, 200, 130);

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
            uTime:   { value: 0 },
            uInk:    { value: new THREE.Color(30 / 255, 42 / 255, 38 / 255) },     // spruce ink
            uAccent: { value: new THREE.Color(191 / 255, 75 / 255, 38 / 255) },    // rust #bf4b26
            uSage:   { value: new THREE.Color(159 / 255, 177 / 255, 166 / 255) }   // sage #9fb1a6
        }
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2 + 0.32; // lie mostly flat, tilt the far edge up
    mesh.position.y = -0.6;
    scene.add(mesh);

    // Pointer parallax — tracked on window, lerped, a few degrees max.
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    function onPointerMove(e) {
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    function resize() {
        const w = hostElement.clientWidth || window.innerWidth;
        const h = hostElement.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // Render only when visible AND on screen.
    let onScreen = true;
    const io = new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) requestFrame();
    }, { threshold: 0 });
    io.observe(hostElement);

    let running = true;    // reduced-motion master switch
    let rafId = 0;
    let firstFrame = true;
    const clock = new THREE.Clock();

    function shouldRender() {
        return running && onScreen && !document.hidden;
    }

    function requestFrame() {
        if (rafId === 0 && shouldRender()) {
            rafId = requestAnimationFrame(frame);
        }
    }

    function frame() {
        rafId = 0;
        if (!shouldRender()) return;

        const dt = Math.min(clock.getDelta(), 0.05);
        material.uniforms.uTime.value += dt;

        // Lerp pointer, apply a mild camera offset/tilt (a few degrees max).
        pointer.x += (target.x - pointer.x) * 0.035;
        pointer.y += (target.y - pointer.y) * 0.035;
        camera.position.x = baseCamPos.x + pointer.x * 0.55;
        camera.position.y = baseCamPos.y - pointer.y * 0.28;
        camera.lookAt(0, 0.35 - pointer.y * 0.12, -3.5);

        renderer.render(scene, camera);

        if (firstFrame) {
            firstFrame = false;
            hostElement.classList.add('is-live');
        }

        rafId = requestAnimationFrame(frame);
    }

    function onVisibility() {
        if (shouldRender()) requestFrame();
    }
    document.addEventListener('visibilitychange', onVisibility);

    // Honor a runtime change to prefers-reduced-motion: stop and un-live.
    function onReducedMotion(e) {
        if (e.matches) {
            running = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
            hostElement.classList.remove('is-live');
        } else {
            running = true;
            firstFrame = true;
            clock.getDelta();
            requestFrame();
        }
    }
    if (reducedMotion.addEventListener) {
        reducedMotion.addEventListener('change', onReducedMotion);
    } else if (reducedMotion.addListener) {
        reducedMotion.addListener(onReducedMotion);
    }

    requestFrame();

    return function dispose() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
        if (reducedMotion.removeEventListener) {
            reducedMotion.removeEventListener('change', onReducedMotion);
        } else if (reducedMotion.removeListener) {
            reducedMotion.removeListener(onReducedMotion);
        }
        io.disconnect();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
}
