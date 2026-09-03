import { PresetAnimation } from "../types";

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

export const PRESET_ANIMATIONS: PresetAnimation[] = [
  {
    id: "galloping-horse",
    title: "Galloping Stallion",
    description: "The classic Eadweard Muybridge 1878 locomotion study — perfectly aligned 5-phase gallop stride.",
    category: "animals",
    iconName: "Zap",
    generateFrames: () => {
      // 5 anatomically registered phases of a galloping horse
      // Body anchor: Center (250, 240). High contrast pure silhouette.
      const frames = [
        // Phase 1: Gathered / Compact bound (Legs tucked underneath body)
        `<g fill="#000000">
           <!-- Main Body Torso -->
           <path d="M 170 250 C 160 215 190 190 240 190 C 290 190 320 200 350 215 C 370 175 395 140 420 110 C 430 95 448 95 455 110 C 460 125 450 145 435 170 C 425 190 415 220 405 250 C 385 265 350 275 310 275 C 250 275 200 275 170 250 Z"/>
           <!-- Head & Ears -->
           <path d="M 420 110 C 435 85 455 85 465 105 C 475 120 460 135 440 130 Z"/>
           <!-- Tail -->
           <path d="M 170 240 C 130 255 100 290 85 340 C 110 320 135 285 165 260 Z"/>
           <!-- Front Legs Tucked In -->
           <path d="M 380 250 L 395 320 L 375 375 L 360 370 L 375 320 L 365 255 Z"/>
           <path d="M 355 255 L 370 325 L 350 385 L 335 380 L 350 325 L 340 260 Z"/>
           <!-- Hind Legs Tucked Under Belly -->
           <path d="M 210 260 L 230 330 L 260 380 L 245 385 L 215 335 L 195 265 Z"/>
           <path d="M 180 255 L 195 325 L 220 375 L 205 380 L 180 330 L 165 260 Z"/>
         </g>`,

        // Phase 2: Stride Opening (Front legs stretching forward, hind legs swinging back)
        `<g fill="#000000">
           <path d="M 170 245 C 160 210 190 185 240 185 C 290 185 320 195 350 210 C 370 170 395 135 420 105 C 430 90 448 90 455 105 C 460 120 450 140 435 165 C 425 185 415 215 405 245 C 385 260 350 270 310 270 C 250 270 200 270 170 245 Z"/>
           <path d="M 420 105 C 435 80 455 80 465 100 C 475 115 460 130 440 125 Z"/>
           <path d="M 170 235 C 125 245 95 280 80 325 C 105 310 130 275 165 250 Z"/>
           <!-- Front Legs Reaching Forward -->
           <path d="M 385 245 L 420 305 L 445 355 L 430 360 L 405 315 L 370 250 Z"/>
           <path d="M 360 250 L 390 315 L 410 370 L 395 375 L 375 320 L 345 255 Z"/>
           <!-- Hind Legs Driving Back -->
           <path d="M 200 260 L 175 325 L 150 380 L 135 375 L 160 325 L 185 260 Z"/>
           <path d="M 175 250 L 150 315 L 120 365 L 105 360 L 135 315 L 160 255 Z"/>
         </g>`,

        // Phase 3: Full Airborne Flight (Maximum stride extension)
        `<g fill="#000000">
           <path d="M 175 240 C 165 205 195 180 245 180 C 295 180 325 190 355 205 C 375 165 400 130 425 100 C 435 85 453 85 460 100 C 465 115 455 135 440 160 C 430 180 420 210 410 240 C 390 255 355 265 315 265 C 255 265 205 265 175 240 Z"/>
           <path d="M 425 100 C 440 75 460 75 470 95 C 480 110 465 125 445 120 Z"/>
           <path d="M 175 230 C 120 235 85 265 70 305 C 95 295 125 265 165 240 Z"/>
           <!-- Front Legs Fully Extended Forward -->
           <path d="M 390 240 L 445 290 L 485 320 L 475 330 L 430 300 L 375 245 Z"/>
           <path d="M 365 245 L 415 300 L 450 340 L 435 350 L 400 310 L 350 250 Z"/>
           <!-- Hind Legs Trailing Fully Back -->
           <path d="M 195 255 L 145 305 L 95 345 L 85 335 L 135 295 L 180 250 Z"/>
           <path d="M 170 245 L 125 290 L 70 325 L 60 315 L 115 285 L 155 245 Z"/>
         </g>`,

        // Phase 4: Foreleg Touchdown (Front legs planting, absorbing ground shock)
        `<g fill="#000000">
           <path d="M 170 248 C 160 213 190 188 240 188 C 290 188 320 198 350 213 C 370 173 395 138 420 108 C 430 93 448 93 455 108 C 460 123 450 143 435 168 C 425 188 415 218 405 248 C 385 263 350 273 310 273 C 250 273 200 273 170 248 Z"/>
           <path d="M 420 108 C 435 83 455 83 465 103 C 475 118 460 133 440 128 Z"/>
           <path d="M 170 238 C 128 250 98 285 82 330 C 108 315 132 280 165 255 Z"/>
           <!-- Front Legs Straight Down on Ground -->
           <path d="M 385 248 L 400 330 L 405 405 L 390 410 L 380 335 L 370 255 Z"/>
           <path d="M 360 252 L 370 335 L 365 415 L 350 420 L 350 340 L 345 258 Z"/>
           <!-- Hind Legs Gathering In Mid-Air -->
           <path d="M 200 258 L 170 325 L 160 375 L 145 370 L 155 320 L 185 260 Z"/>
           <path d="M 175 250 L 150 315 L 135 360 L 120 355 L 135 310 L 160 255 Z"/>
         </g>`,

        // Phase 5: Hind Leg Push-Off (Propelling the bound upward again)
        `<g fill="#000000">
           <path d="M 170 252 C 160 217 190 192 240 192 C 290 192 320 202 350 217 C 370 177 395 142 420 112 C 430 97 448 97 455 112 C 460 127 450 147 435 172 C 425 192 415 222 405 252 C 385 267 350 277 310 277 C 250 277 200 277 170 252 Z"/>
           <path d="M 420 112 C 435 87 455 87 465 107 C 475 122 460 137 440 132 Z"/>
           <path d="M 170 242 C 132 258 102 295 88 345 C 112 325 135 290 165 262 Z"/>
           <!-- Front Legs Folding Back Up -->
           <path d="M 380 252 L 375 330 L 340 375 L 325 370 L 355 325 L 365 255 Z"/>
           <path d="M 355 255 L 350 325 L 310 365 L 295 360 L 330 320 L 340 258 Z"/>
           <!-- Hind Legs Driving Firmly into Ground -->
           <path d="M 210 262 L 210 340 L 205 415 L 190 415 L 195 340 L 195 265 Z"/>
           <path d="M 180 255 L 185 335 L 175 410 L 160 410 L 170 335 L 165 260 Z"/>
         </g>`,
      ];

      return frames.map((frameSvg) =>
        svgToDataUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect width="500" height="500" fill="#ffffff"/>
            ${frameSvg}
          </svg>`
        )
      );
    },
  },
  {
    id: "flapping-bird",
    title: "Soaring Eagle",
    description: "Broad wings beating in a smooth aerodynamic 5-phase sinusoidal flap cycle.",
    category: "nature",
    iconName: "Feather",
    generateFrames: () => {
      // Anchored bird body at (250, 270) with 5 continuous wing phases
      const frames = [
        // 1. High Upstroke (V-shape reaching skyward)
        `<g fill="#000000">
           <!-- Body & Tail -->
           <ellipse cx="250" cy="270" rx="22" ry="40"/>
           <circle cx="250" cy="225" r="16"/>
           <polygon points="250,205 243,222 257,222"/>
           <polygon points="250,305 230,375 270,375"/>
           <!-- Left Wing High Up -->
           <path d="M 235 260 C 190 190 145 125 90 70 C 120 120 165 190 225 275 Z"/>
           <path d="M 225 265 C 175 180 120 100 55 50 C 95 110 150 190 215 280 Z"/>
           <!-- Right Wing High Up -->
           <path d="M 265 260 C 310 190 355 125 410 70 C 380 120 335 190 275 275 Z"/>
           <path d="M 275 265 C 325 180 380 100 445 50 C 405 110 350 190 285 280 Z"/>
         </g>`,

        // 2. Wings Opening (Transitioning from crest into glide)
        `<g fill="#000000">
           <ellipse cx="250" cy="270" rx="22" ry="40"/>
           <circle cx="250" cy="225" r="16"/>
           <polygon points="250,205 243,222 257,222"/>
           <polygon points="250,305 232,370 268,370"/>
           <!-- Left Wing Mid-High -->
           <path d="M 235 265 C 180 210 115 170 50 130 C 90 180 150 235 225 275 Z"/>
           <path d="M 225 270 C 160 200 90 150 25 110 C 70 170 140 230 215 280 Z"/>
           <!-- Right Wing Mid-High -->
           <path d="M 265 265 C 320 210 385 170 450 130 C 410 180 350 235 275 275 Z"/>
           <path d="M 275 270 C 340 200 410 150 475 110 C 430 170 360 230 285 280 Z"/>
         </g>`,

        // 3. Flat Gliding Plane (Horizontal wingspan)
        `<g fill="#000000">
           <ellipse cx="250" cy="270" rx="22" ry="40"/>
           <circle cx="250" cy="225" r="16"/>
           <polygon points="250,205 243,222 257,222"/>
           <polygon points="250,305 235,372 265,372"/>
           <!-- Left Wing Horizontal -->
           <path d="M 235 268 C 170 255 100 245 35 235 C 80 270 150 280 225 276 Z"/>
           <path d="M 225 272 C 150 250 75 235 15 220 C 65 260 140 278 215 280 Z"/>
           <!-- Right Wing Horizontal -->
           <path d="M 265 268 C 330 255 400 245 465 235 C 420 270 350 280 275 276 Z"/>
           <path d="M 275 272 C 350 250 425 235 485 220 C 435 260 360 278 285 280 Z"/>
         </g>`,

        // 4. Downstroke Sweep (Driving downward for thrust)
        `<g fill="#000000">
           <ellipse cx="250" cy="270" rx="22" ry="40"/>
           <circle cx="250" cy="225" r="16"/>
           <polygon points="250,205 243,222 257,222"/>
           <polygon points="250,305 232,370 268,370"/>
           <!-- Left Wing Sweeping Down -->
           <path d="M 235 268 C 180 295 120 335 60 380 C 100 350 160 305 225 276 Z"/>
           <path d="M 225 272 C 160 310 90 355 30 405 C 80 370 150 315 215 280 Z"/>
           <!-- Right Wing Sweeping Down -->
           <path d="M 265 268 C 320 295 380 335 440 380 C 400 350 340 305 275 276 Z"/>
           <path d="M 275 272 C 340 310 410 355 470 405 C 420 370 350 315 285 280 Z"/>
         </g>`,

        // 5. Deep Downstroke (Lowest point of flap, gathering for upstroke)
        `<g fill="#000000">
           <ellipse cx="250" cy="270" rx="22" ry="40"/>
           <circle cx="250" cy="225" r="16"/>
           <polygon points="250,205 243,222 257,222"/>
           <polygon points="250,305 230,375 270,375"/>
           <!-- Left Wing Deep Down -->
           <path d="M 235 270 C 185 325 135 390 80 450 C 120 390 170 325 225 278 Z"/>
           <path d="M 225 275 C 165 345 110 415 50 475 C 95 410 150 335 215 282 Z"/>
           <!-- Right Wing Deep Down -->
           <path d="M 265 270 C 315 325 365 390 420 450 C 380 390 330 325 275 278 Z"/>
           <path d="M 275 275 C 335 345 390 415 450 475 C 405 410 350 335 285 282 Z"/>
         </g>`,
      ];

      return frames.map((frameSvg) =>
        svgToDataUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect width="500" height="500" fill="#ffffff"/>
            ${frameSvg}
          </svg>`
        )
      );
    },
  },
  {
    id: "spinning-star",
    title: "Hypnotic 3D Star",
    description: "A faceted geometric star rotating in perfect 72° increments (72° × 5 = 360° flawless seamless loop).",
    category: "mechanics",
    iconName: "Compass",
    generateFrames: () => {
      // 5 rotational angles (0, 72, 144, 216, 288) produce a mathematically continuous rotation
      const angles = [0, 72, 144, 216, 288];
      return angles.map((ang) =>
        svgToDataUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect width="500" height="500" fill="#ffffff"/>
            <g transform="translate(250, 250) rotate(${ang})">
              <!-- Outer 10-Point Star -->
              <polygon points="0,-190 40,-70 180,-70 70,10 115,145 0,70 -115,145 -70,10 -180,-70 -40,-70" fill="#000000"/>
              <!-- Light Bevel Facets -->
              <polygon points="0,0 0,-190 40,-70" fill="#ffffff"/>
              <polygon points="0,0 180,-70 70,10" fill="#ffffff"/>
              <polygon points="0,0 115,145 0,70" fill="#ffffff"/>
              <polygon points="0,0 -70,10 -180,-70" fill="#ffffff"/>
              <!-- Center Core Bullseye -->
              <circle cx="0" cy="0" r="36" fill="#000000"/>
              <circle cx="0" cy="0" r="18" fill="#ffffff"/>
            </g>
          </svg>`
        )
      );
    },
  },
  {
    id: "beating-heart",
    title: "Pulsing Anatomical Heart",
    description: "Rhythmic cardiac systole and diastole pumping with concentric optical shockwaves.",
    category: "anatomy",
    iconName: "Heart",
    generateFrames: () => {
      // 5 smooth scale phases: Resting -> Systole spike -> Peak expansion -> Recoil -> Relaxation
      const heartPhases = [
        { scale: 0.92, ringR: 190, ringStroke: 6 },
        { scale: 1.05, ringR: 210, ringStroke: 8 },
        { scale: 1.20, ringR: 235, ringStroke: 10 }, // Max Systole
        { scale: 1.10, ringR: 220, ringStroke: 8 },
        { scale: 0.98, ringR: 200, ringStroke: 6 },
      ];

      return heartPhases.map(({ scale, ringR, ringStroke }) =>
        svgToDataUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect width="500" height="500" fill="#ffffff"/>
            <!-- Concentric Pulse Shockwave Ring -->
            <circle cx="250" cy="245" r="${ringR}" fill="none" stroke="#000000" stroke-width="${ringStroke}" opacity="0.8"/>
            
            <!-- Scaled Central Heart Silhouette -->
            <g transform="translate(250, 245) scale(${scale}) translate(-250, -245)">
              <!-- Heart Body -->
              <path d="M 250,380 C 150,285 80,215 80,145 C 80,90 125,48 180,48 C 215,48 240,68 250,88 C 260,68 285,48 320,48 C 375,48 420,90 420,145 C 420,215 350,285 250,380 Z" fill="#000000"/>
              <!-- Aorta Arch Top -->
              <path d="M 225 55 C 225 25 275 25 275 55" fill="none" stroke="#000000" stroke-width="18"/>
              <!-- Internal Chamber Highlights -->
              <ellipse cx="205" cy="130" rx="26" ry="38" fill="#ffffff" transform="rotate(-25 205 130)"/>
              <circle cx="300" cy="140" r="14" fill="#ffffff"/>
            </g>
          </svg>`
        )
      );
    },
  },
  {
    id: "running-cheetah",
    title: "Prowling Cheetah",
    description: "Feline predatory locomotion with flexing spine and fluid paw cadence.",
    category: "animals",
    iconName: "Cat",
    generateFrames: () => {
      // 5 registered stride phases of a sprinting big cat
      const frames = [
        // 1. Coiled Spring (Paws gathered under torso)
        `<g fill="#000000">
           <path d="M 140 260 C 160 220 210 205 270 205 C 330 205 370 220 410 240 C 435 225 465 230 480 250 C 485 265 470 280 445 285 C 400 290 360 290 300 290 C 230 290 170 300 130 305 Z"/>
           <circle cx="465" cy="255" r="22"/>
           <polygon points="455,235 468,252 445,248"/>
           <!-- Tail -->
           <path d="M 140 270 C 85 275 60 230 50 170 C 70 175 90 215 130 255 Z"/>
           <!-- Paws gathered -->
           <path d="M 400 265 L 420 340 L 415 410 L 395 415 L 380 350 L 375 270 Z"/>
           <path d="M 360 270 L 380 345 L 375 420 L 355 425 L 345 350 L 340 275 Z"/>
           <path d="M 210 280 L 190 350 L 170 415 L 150 410 L 175 345 L 195 280 Z"/>
           <path d="M 180 275 L 160 345 L 140 405 L 120 400 L 145 340 L 165 275 Z"/>
         </g>`,

        // 2. Front Extension
        `<g fill="#000000">
           <path d="M 140 250 C 160 210 210 195 270 195 C 330 195 370 210 410 230 C 435 215 465 220 480 240 C 485 255 470 270 445 275 C 400 280 360 280 300 280 C 230 280 170 290 130 295 Z"/>
           <circle cx="465" cy="245" r="22"/>
           <polygon points="455,225 468,242 445,238"/>
           <path d="M 140 260 C 85 265 60 220 50 160 C 70 165 90 205 130 245 Z"/>
           <!-- Front Paws Reaching Forward -->
           <path d="M 410 255 L 455 315 L 485 365 L 470 375 L 430 330 L 385 260 Z"/>
           <path d="M 370 260 L 415 325 L 445 380 L 430 390 L 390 335 L 350 265 Z"/>
           <!-- Hind Paws Kicking Back -->
           <path d="M 200 275 L 160 335 L 120 385 L 105 375 L 140 330 L 185 275 Z"/>
           <path d="M 170 270 L 130 325 L 90 375 L 75 365 L 110 320 L 155 270 Z"/>
         </g>`,

        // 3. Full Leap Flight
        `<g fill="#000000">
           <path d="M 145 240 C 165 200 215 185 275 185 C 335 185 375 200 415 220 C 440 205 470 210 485 230 C 490 245 475 260 450 265 C 405 270 365 270 305 270 C 235 270 175 280 135 285 Z"/>
           <circle cx="470" cy="235" r="22"/>
           <polygon points="460,215 473,232 450,228"/>
           <path d="M 145 250 C 90 255 65 210 55 150 C 75 155 95 195 135 235 Z"/>
           <!-- Maximum Stretch -->
           <path d="M 420 245 L 480 290 L 520 330 L 510 345 L 455 310 L 395 250 Z"/>
           <path d="M 380 250 L 435 300 L 475 345 L 460 360 L 415 315 L 360 255 Z"/>
           <path d="M 190 270 L 135 315 L 80 350 L 70 335 L 120 300 L 175 265 Z"/>
           <path d="M 160 265 L 105 305 L 50 340 L 40 325 L 90 290 L 145 260 Z"/>
         </g>`,

        // 4. Forepaws Landing
        `<g fill="#000000">
           <path d="M 140 255 C 160 215 210 200 270 200 C 330 200 370 215 410 235 C 435 220 465 225 480 245 C 485 260 470 275 445 280 C 400 285 360 285 300 285 C 230 285 170 295 130 300 Z"/>
           <circle cx="465" cy="250" r="22"/>
           <polygon points="455,230 468,247 445,243"/>
           <path d="M 140 265 C 85 270 60 225 50 165 C 70 170 90 210 130 250 Z"/>
           <!-- Front Paws Planted On Ground -->
           <path d="M 410 260 L 425 340 L 430 415 L 410 420 L 395 345 L 385 265 Z"/>
           <path d="M 370 265 L 380 345 L 385 425 L 365 430 L 355 350 L 350 270 Z"/>
           <!-- Hind Paws Tucking In -->
           <path d="M 195 275 L 165 340 L 140 380 L 125 375 L 145 330 L 180 275 Z"/>
           <path d="M 165 270 L 135 330 L 110 370 L 95 365 L 115 320 L 150 270 Z"/>
         </g>`,

        // 5. Ground Thrust
        `<g fill="#000000">
           <path d="M 135 265 C 155 225 205 210 265 210 C 325 210 365 225 405 245 C 430 230 460 235 475 255 C 480 270 465 285 440 290 C 395 295 355 295 295 295 C 225 295 165 305 125 310 Z"/>
           <circle cx="460" cy="260" r="22"/>
           <polygon points="450,240 463,257 440,253"/>
           <path d="M 135 275 C 80 280 55 235 45 175 C 65 180 85 220 125 260 Z"/>
           <!-- Front Paws Lifting Off -->
           <path d="M 400 270 L 390 350 L 360 400 L 340 395 L 365 340 L 380 270 Z"/>
           <path d="M 360 275 L 350 355 L 320 405 L 300 400 L 325 345 L 340 275 Z"/>
           <!-- Hind Paws Driving Downward -->
           <path d="M 210 280 L 215 355 L 210 425 L 190 425 L 195 350 L 195 280 Z"/>
           <path d="M 180 275 L 185 345 L 175 415 L 155 415 L 165 340 L 165 275 Z"/>
         </g>`,
      ];

      return frames.map((frameSvg) =>
        svgToDataUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect width="500" height="500" fill="#ffffff"/>
            ${frameSvg}
          </svg>`
        )
      );
    },
  },
  {
    id: "hypnotic-spiral",
    title: "Hypnotic Optical Vortex",
    description: "Concentric optical rings continuously expanding outward into infinity.",
    category: "mechanics",
    iconName: "Compass",
    generateFrames: () => {
      // 5 phase shifts of concentric harmonic ripples: phase = 0, 1/5, 2/5, 3/5, 4/5 of ripple wavelength
      const phases = [0, 0.2, 0.4, 0.6, 0.8];
      const WAVELENGTH = 40;

      return phases.map((phase) => {
        const rings: string[] = [];
        for (let r = phase * WAVELENGTH; r <= 240; r += WAVELENGTH) {
          if (r > 10) {
            rings.push(
              `<circle cx="250" cy="250" r="${r}" fill="none" stroke="#000000" stroke-width="18"/>`
            );
          }
        }

        return svgToDataUrl(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect width="500" height="500" fill="#ffffff"/>
            ${rings.join("\n")}
            <!-- Center Core -->
            <circle cx="250" cy="250" r="16" fill="#000000"/>
          </svg>`
        );
      });
    },
  },
];
