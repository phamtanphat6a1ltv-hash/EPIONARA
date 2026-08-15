import { useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { asmrSoundManager } from "../../utils/asmrSoundManager.js";
import { useGarden } from "../../hooks/useStorage.js";

export function SlimeGame() {
  const { t } = useAppContext();
  const { rewardXP } = useGarden();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const managerRef = useRef(asmrSoundManager);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, isDown: false, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = canvas.offsetWidth;
    canvas.height = 280;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const numPoints = 28;
    const baseRadius = 75;

    const points = Array.from({ length: numPoints }, (_, i) => {
      const angle = (i / numPoints) * Math.PI * 2;
      return {
        angle,
        x: centerX + Math.cos(angle) * baseRadius,
        y: centerY + Math.sin(angle) * baseRadius,
        vx: 0,
        vy: 0,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;

      let mouseSpeed = 0;
      if (mouse.active) {
        const dx = mouse.x - mouse.lastX;
        const dy = mouse.y - mouse.lastY;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
      }

      if (mouse.active && mouseSpeed > 1.0) {
        managerRef.current.init();
        managerRef.current.startSlimeLoop();
        const targetVol = Math.min(0.7, mouseSpeed / 30);
        managerRef.current.setSlimeVolume(targetVol);
      } else {
        managerRef.current.setSlimeVolume(0);
      }

      points.forEach((p) => {
        const tx = centerX + Math.cos(p.angle) * baseRadius;
        const ty = centerY + Math.sin(p.angle) * baseRadius;

        const fx = (tx - p.x) * 0.038;
        const fy = (ty - p.y) * 0.038;

        p.vx += fx;
        p.vy += fy;

        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mDist < 75) {
            const force = (75 - mDist) / 75;
            const pushX = (mdx / mDist) * force * (mouse.isDown ? 6 : 2.8);
            const pushY = (mdy / mDist) * force * (mouse.isDown ? 6 : 2.8);

            p.vx += pushX;
            p.vy += pushY;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.88;
        p.vy *= 0.88;
      });

      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % numPoints];
        const xc = (p1.x + p2.x) / 2;
        const yc = (p1.y + p2.y) / 2;

        if (i === 0) {
          ctx.moveTo(xc, yc);
        } else {
          ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
        }
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(
        centerX - 15,
        centerY - 15,
        10,
        centerX,
        centerY,
        100
      );
      grad.addColorStop(0, "#d946ef");
      grad.addColorStop(0.5, "#a855f7");
      grad.addColorStop(1, "#4f46e5");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(centerX - 30, centerY - 30, 18, 10, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.fill();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      managerRef.current.stopSlimeLoop();
    };
  }, []);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const mouse = mouseRef.current;
    if (!mouse.active) {
      mouse.lastX = x;
      mouse.lastY = y;
      mouse.active = true;
    }
    mouse.x = x;
    mouse.y = y;
  };

  const handleTouchMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    const mouse = mouseRef.current;
    if (!mouse.active) {
      mouse.lastX = x;
      mouse.lastY = y;
      mouse.active = true;
    }
    mouse.x = x;
    mouse.y = y;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center" }}>
        {t.game_slime_tip || "✨ Rê chuột / chạm kéo để nhào nặn chất nhờn Slime phát âm thanh"}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => {
          mouseRef.current.isDown = true;
          handleMouseMove(e);
          rewardXP(15, 5); // Quest 5: Làm 1 điều khiến bạn vui
        }}
        onMouseUp={() => (mouseRef.current.isDown = false)}
        onMouseLeave={() => {
          mouseRef.current.active = false;
          mouseRef.current.isDown = false;
          managerRef.current.setSlimeVolume(0);
        }}
        onTouchMove={handleTouchMove}
        onTouchStart={(e) => {
          mouseRef.current.isDown = true;
          handleTouchMove(e);
          rewardXP(15, 5); // Quest 5: Làm 1 điều khiến bạn vui
        }}
        onTouchEnd={() => {
          mouseRef.current.isDown = false;
          mouseRef.current.active = false;
          managerRef.current.setSlimeVolume(0);
        }}
        style={{
          width: "100%",
          height: 280,
          background: "rgba(0,0,0,0.18)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
          cursor: "grab",
        }}
      />
    </div>
  );
}
