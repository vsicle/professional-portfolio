// terrain.js — wireframe topographic mountain range evoking the Wasatch front.
// ES module. Dynamically imported by index.html only when WebGL is available
// and prefers-reduced-motion is NOT set. Atmosphere, not spectacle.
//
// Composition: the viewer stands on the valley floor (Salt Lake side) looking
// east at a mountain front. Elevation is shaped by a range envelope that rises
// toward the far edge of the plane, so the skyline reads as one coherent
// ridgeline instead of undirected noise. Contour lines are drawn per-fragment;
// peaks catch a faint alpenglow rust.
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

    // Ridged multi-octave fBm: 1.0 - abs(noise) sharpens crests into ridges.
    float ridged(vec2 p) {
        float sum   = 0.0;
        float amp   = 0.62;
        float freq  = 1.0;
        float total = 0.0;
        for (int o = 0; o < 4; o++) {
            float n = snoise(p * freq);
            n = 1.0 - abs(n);
            n = n * n * (0.2 + 0.8 * n); // sharpen crests, soften floors
            sum   += n * amp;
            total += amp;
            amp   *= 0.48;
            freq  *= 2.05;
        }
        return sum / total;
    }

    void main() {
        vUv = uv;

        // Very slow drift so the range morphs almost imperceptibly.
        vec2 drift = vec2(uTime * 0.010, uTime * -0.006);
        vec2 p = position.xy * vec2(0.30, 0.34) + drift;

        // Range envelope: one coherent ridge SPINE running diagonally
        // across the plane (SW to NE, like the Wasatch on a quad map).
        // Elevation belongs to the spine; everything else is valley floor.
        vec2 q = position.xy;
        vec2 dir = normalize(vec2(0.88, 0.47));
        float along  = dot(q, dir);
        float across = abs(q.x * dir.y - q.y * dir.x);
        float envelope = 1.0 - smoothstep(0.4, 4.6, across);
        envelope = envelope * envelope * (3.0 - 2.0 * envelope);

        // Distinct summits and saddles along the spine.
        float summits = 0.55 + 0.45 * snoise(vec2(along * 0.32 + 2.7, 1.3));

        float detail = ridged(p);

        float e = envelope * summits * (0.3 + 0.9 * detail);

        // Gentle alluvial texture on the valley floor so it isn't dead flat.
        e += (1.0 - envelope) * 0.05 * snoise(p * 1.8 + 7.0);

        vElevation = e;

        vec3 displaced = position;
        displaced.z += e * 2.4;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    precision highp float;

    uniform vec3  uLine;     // pale contour line color
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

        // Fewer, cleaner lines: minor contours plus an index line every 4th.
        float minorSpacing = 0.09;
        float minor = contour(elev, minorSpacing, 1.15);
        float major = contour(elev, minorSpacing * 4.0, 1.5);

        float line = max(minor * 0.62, major * 1.0);

        // Elevation tint: peaks catch rust alpenglow, low ground stays sage.
        float hi = smoothstep(0.52, 0.95, elev);
        float lo = smoothstep(0.30, 0.04, elev);
        vec3 col = uLine;
        col = mix(col, uAccent, hi * 0.9);
        col = mix(col, uSage,   lo * 0.35);

        // Edge vignette in UV space so the plane dissolves into the page.
        vec2 d = abs(vUv - 0.5) * 2.0;
        float vig = (1.0 - smoothstep(0.5, 0.98, d.x)) *
                    (1.0 - smoothstep(0.55, 0.98, d.y));

        float alpha = line * vig;
        if (alpha < 0.004) discard;

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
    renderer.setClearColor(0x000000, 0); // no scene background; page shows through
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    hostElement.appendChild(canvas);

    const scene = new THREE.Scene();

    // High oblique view, like reading a topo map tilted on a table.
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const baseCamPos = new THREE.Vector3(1.2, 8.4, 8.8);
    camera.position.copy(baseCamPos);
    const lookTarget = new THREE.Vector3(0.2, 0, -0.8);
    camera.lookAt(lookTarget);

    const geometry = new THREE.PlaneGeometry(20, 12, 220, 140);

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
            uTime:   { value: 0 },
            uLine:   { value: new THREE.Color(0xd9d7cc) }, // pale warm line
            uAccent: { value: new THREE.Color(0xd0592e) }, // alpenglow rust
            uSage:   { value: new THREE.Color(0x6f7f74) }  // sage low ground
        }
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // flat map; the shader supplies relief
    mesh.position.y = 0;
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
        camera.position.x = baseCamPos.x + pointer.x * 0.5;
        camera.position.y = baseCamPos.y - pointer.y * 0.25;
        camera.lookAt(lookTarget.x, lookTarget.y - pointer.y * 0.1, lookTarget.z);

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
