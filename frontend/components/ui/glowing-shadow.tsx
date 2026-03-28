"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils" // Typical shadcn util

interface GlowingShadowProps {
  children: ReactNode;
  className?: string;
}

export function GlowingShadow({ children, className = "" }: GlowingShadowProps) {
  return (
    <>
      <style jsx>{`
        @property --hue {
          syntax: "<number>";
          inherits: true;
          initial-value: 260; /* Initial to purple */
        }
        @property --rotate {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-x {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-translate-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --bg-size {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-opacity {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-blur {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --glow-scale {
          syntax: "<number>";
          inherits: true;
          initial-value: 2;
        }
        @property --glow-radius {
          syntax: "<number>";
          inherits: true;
          initial-value: 2;
        }
        @property --white-shadow {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }

        .glow-container {
          /* Matched hues to the second image you uploaded: deep purples, indigos, dark backgrounds */
          --card-color: hsl(260deg 100% 3%); 
          --text-color: hsl(260deg 10% 55%);
          --card-radius: 1.25rem; /* Standardizing for Tailwind 'rounded-xl' */
          --border-width: 1px; /* Subtle thin glowing border instead of thick 3px */
          --bg-size: 1;
          --hue: 260; /* Starting the spectrum at deep blue/purple */
          --hue-speed: 1;
          --rotate: 0;
          --animation-speed: 4s;
          --interaction-speed: 0.55s;
          --glow-scale: 1.5;
          --scale-factor: 1;
          --glow-blur: 8;
          --glow-opacity: 0.8;
          --glow-radius: 100;
          --glow-rotate-unit: 1deg;

          /* RESPONSIVE MODIFICATION: Making it fill parents exactly */
          width: 100%;
          height: 100%;
          color: white;
          margin: 0;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          position: relative;
          z-index: 2;
          border-radius: var(--card-radius);
          cursor: pointer;
        }

        .glow-container:before,
        .glow-container:after {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: var(--card-radius);
        }

        .glow-content {
          position: relative; 
          width: 100%;
          height: 100%;
          background: var(--card-color);
          border-radius: calc(var(--card-radius) * 0.95);
          display: flex;
          flex-direction: column;
        }

        .glow-content:before {
          content: "";
          display: block;
          position: absolute;
          width: calc(100% + var(--border-width) * 2);
          height: calc(100% + var(--border-width) * 2);
          left: calc(var(--border-width) * -1);
          top: calc(var(--border-width) * -1);
          border-radius: var(--card-radius);
          box-shadow: 0 0 20px black;
          mix-blend-mode: color-burn;
          z-index: -1;
          background: hsl(240deg 10% 8%) radial-gradient( /* Dark indigo base */
            30% 30% at calc(var(--bg-x) * 1%) calc(var(--bg-y) * 1%),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 80% 80%) calc(0% * var(--bg-size)),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 80% 60%) calc(20% * var(--bg-size)),
            hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 80% 40%) calc(40% * var(--bg-size)),
            transparent 100%
          );
          animation: hue-animation var(--animation-speed) linear infinite,
                     rotate-bg var(--animation-speed) linear infinite;
          transition: --bg-size var(--interaction-speed) ease;
        }

        .glow {
          --glow-translate-y: 0;
          display: block;
          position: absolute;
          width: 20%; /* Relative to the container */
          height: 20%;
          left: 40%;
          top: 40%;
          animation: rotate var(--animation-speed) linear infinite;
          transform: rotateZ(calc(var(--rotate) * var(--glow-rotate-unit)));
          transform-origin: center;
          border-radius: calc(var(--glow-radius) * 10vw);
        }

        .glow:after {
          content: "";
          display: block;
          z-index: -2;
          filter: blur(calc(var(--glow-blur) * 10px));
          width: 130%;
          height: 130%;
          left: -15%;
          top: -15%;
          background: hsl(calc(var(--hue) * var(--hue-speed) * 1deg) 90% 55%); /* Moody glow */
          position: relative;
          border-radius: calc(var(--glow-radius) * 10vw);
          animation: hue-animation var(--animation-speed) linear infinite;
          transform: scaleY(calc(var(--glow-scale) * var(--scale-factor) / 1.1))
                     scaleX(calc(var(--glow-scale) * var(--scale-factor) * 1.2))
                     translateY(calc(var(--glow-translate-y) * 1%));
          opacity: var(--glow-opacity);
        }

        /* Hover Interaction Effects */
        .glow-container:hover .glow-content {
          mix-blend-mode: normal; /* Better contrast */
          --text-color: white;
          box-shadow: inset 0 0 calc(var(--white-shadow) * 1vw) calc(var(--white-shadow) * 0.1vw) rgb(255 255 255 / 10%);
          animation: shadow-pulse calc(var(--animation-speed) * 2) linear infinite;
        }

        .glow-container:hover .glow-content:before {
          --bg-size: 15;
          animation-play-state: paused;
          transition: --bg-size var(--interaction-speed) ease;
        }

        .glow-container:hover .glow {
          --glow-blur: 2;
          --glow-opacity: 0.4; /* Softer, broader glow */
          --glow-scale: 2.5;
          --glow-radius: 0;
          --rotate: 900;
          --glow-rotate-unit: 0;
          --scale-factor: 1.25;
          animation-play-state: paused;
        }

        .glow-container:hover .glow:after {
          --glow-translate-y: 0;
          animation-play-state: paused;
          transition: --glow-translate-y 0s ease, --glow-blur 0.05s ease,
                      --glow-opacity 0.05s ease, --glow-scale 0.05s ease,
                      --glow-radius 0.05s ease;
        }

        @keyframes shadow-pulse {
          0%, 24%, 46%, 73%, 96% { --white-shadow: 0.1; }
          12%, 28%, 41%, 63%, 75%, 82%, 98% { --white-shadow: 1.5; }
          6%, 32%, 57% { --white-shadow: 0.8; }
          18%, 52%, 88% { --white-shadow: 2; }
        }

        @keyframes rotate-bg {
          0% { --bg-x: 0; --bg-y: 0; }
          25% { --bg-x: 100; --bg-y: 0; }
          50% { --bg-x: 100; --bg-y: 100; }
          75% { --bg-x: 0; --bg-y: 100; }
          100% { --bg-x: 0; --bg-y: 0; }
        }

        @keyframes rotate {
          from { --rotate: -70; --glow-translate-y: -65; }
          25% { --glow-translate-y: -65; }
          50% { --glow-translate-y: -65; }
          60%, 75% { --glow-translate-y: -65; }
          85% { --glow-translate-y: -65; }
          to { --rotate: calc(360 - 70); --glow-translate-y: -65; }
        }

        @keyframes hue-animation {
          0% { --hue: 240; } /* Start in deep blue */
          50% { --hue: 300; } /* Shift towards purple/magenta */
          100% { --hue: 240; } /* Loop back */
        }
      `}</style>

      <div className={cn("glow-container", className)} role="button">
        <span className="glow"></span>
        <div className="glow-content p-8 lg:p-10">{children}</div>
      </div>
    </>
  )
}
