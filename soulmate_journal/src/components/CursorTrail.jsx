import { useEffect, useRef } from "react";

export default function CursorTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial size safely
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth || document.documentElement.clientWidth || 800;
        canvas.height = window.innerHeight || document.documentElement.clientHeight || 600;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: null, y: null, active: false };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // Spawn elegant particles per movement (fewer particles = higher performance & cleaner look)
      const colors = ["#8b5cf6", "#ec4899", "#22d3ee", "#ffffff", "#c4b5fd"];
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: mouse.x,
          y: mouse.y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.3) * 1.4 - 0.3, // float slightly upward/drift
          size: Math.random() * 5 + 3, // size of stars/particles
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.022 + 0.014,
          type: Math.random() > 0.45 ? "star" : "circle",
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.04
        });
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Efficient 4-pointed star vector drawing with simulated glow layers
    const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius, color, alpha, rotation) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      
      const drawSingleStarPath = (rOut, rIn) => {
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(0, -rOut);
        for (let i = 0; i < spikes; i++) {
          let x = Math.cos(rot) * rOut;
          let y = Math.sin(rot) * rOut;
          ctx.lineTo(x, y);
          rot += step;

          x = Math.cos(rot) * rIn;
          y = Math.sin(rot) * rIn;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(0, -rOut);
        ctx.closePath();
      };

      // 1. Draw large soft outer glow star
      drawSingleStarPath(outerRadius * 2.2, innerRadius * 2.2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.15;
      ctx.fill();

      // 2. Draw sharp core star
      drawSingleStarPath(outerRadius, innerRadius);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();

      ctx.restore();
    };

    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles in one pass
      particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;
        p.size *= 0.975; // gradual shrink

        if (p.alpha <= 0 || p.size < 0.5) return false;

        if (p.type === "star") {
          drawStar(ctx, p.x, p.y, 4, p.size, p.size * 0.25, p.color, p.alpha, p.rotation);
        } else {
          ctx.save();
          // 1. Faint outer glow bubble
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.18;
          ctx.fill();

          // 2. Sharp core bubble
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          
          ctx.restore();
        }
        return true;
      });

      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 999999, // Draw on top of all visual layers
      }}
    />
  );
}
