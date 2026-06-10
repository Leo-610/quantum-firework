import { useEffect, useRef } from 'react';

/**
 * BJTU 点阵灯光效果
 * 在地图上用发光点阵绘制 "BJTU" 字样，带有呼吸闪烁效果
 */

// 5x5 点阵字模
const DOT_PATTERNS = {
  B: [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
  ],
  J: [
    [0,0,0,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  T: [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  U: [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  Q: [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [0,1,1,1,1],
  ],
  I: [
    [1,1,1],
    [0,1,0],
    [0,1,0],
    [0,1,0],
    [0,1,0],
    [0,1,0],
    [1,1,1],
  ],
  N: [
    [1,0,0,1],
    [1,1,0,1],
    [1,0,1,1],
    [1,0,0,1],
    [1,0,0,1],
    [1,0,0,1],
    [1,0,0,1],
  ],
};

// 绘制单个字符
function drawChar(ctx, char, startX, startY, dotSize, dotSpacing, opacity, glowIntensity) {
  const pattern = DOT_PATTERNS[char.toUpperCase()];
  if (!pattern) return 0;

  const cols = pattern[0].length;
  const rows = pattern.length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (pattern[row][col]) {
        const x = startX + col * (dotSize + dotSpacing);
        const y = startY + row * (dotSize + dotSpacing);

        // 绘制发光效果
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, dotSize * 2);
        gradient.addColorStop(0, `rgba(0, 240, 255, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(0, 200, 255, ${opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');

        ctx.beginPath();
        ctx.arc(x, y, dotSize * 2 * glowIntensity, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 绘制核心点
        ctx.beginPath();
        ctx.arc(x, y, dotSize * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
    }
  }

  return cols * (dotSize + dotSpacing) - dotSpacing;
}

// 贝塞尔曲线点
function drawCurve(ctx, points, dotSize, opacity, glowIntensity) {
  points.forEach(([x, y], index) => {
    const phase = (Date.now() / 1000 + index * 0.2) % 1;
    const pulse = Math.sin(phase * Math.PI * 2);

    // 发光效果
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, dotSize * 3);
    gradient.addColorStop(0, `rgba(0, 240, 255, ${opacity * (0.5 + pulse * 0.5)})`);
    gradient.addColorStop(0.4, `rgba(0, 180, 255, ${opacity * 0.4 * (0.5 + pulse * 0.5)})`);
    gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');

    ctx.beginPath();
    ctx.arc(x, y, dotSize * 3, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 核心点
    ctx.beginPath();
    ctx.arc(x, y, dotSize * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * (0.8 + pulse * 0.2)})`;
    ctx.fill();
  });
}

export default function BJTULights({ mapContainer }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!mapContainer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 设置 Canvas 尺寸
    const resizeCanvas = () => {
      canvas.width = mapContainer.offsetWidth;
      canvas.height = mapContainer.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 动画参数
    const dotSize = 3;
    const dotSpacing = 4;
    const text = 'BJTU';
    const textY = 22; // 顶部位置，避开标题栏

    // 计算文本宽度
    let textWidth = 0;
    text.split('').forEach(char => {
      const pattern = DOT_PATTERNS[char.toUpperCase()];
      if (pattern) {
        textWidth += pattern[0].length * (dotSize + dotSpacing);
      }
    });
    const startX = (canvas.width - textWidth) / 2;

    // 底部装饰曲线点（位置靠上一些，避开底部面板）
    const curvePoints = [];
    const curveY = canvas.height - 120;
    for (let i = 0; i < 20; i++) {
      const x = (canvas.width / 20) * i + Math.random() * 10;
      const y = curveY + Math.sin(i * 0.5) * 10;
      curvePoints.push([x, y]);
    }

    // 绘制函数
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() / 1000;

      // 主文字呼吸效果
      const breathe = Math.sin(time * 1.5) * 0.3 + 0.7;
      const glowPulse = Math.sin(time * 2) * 0.3 + 0.7;

      // 绘制 BJTU
      let x = startX;
      text.split('').forEach((char, index) => {
        const charPhase = time + index * 0.3;
        const charPulse = Math.sin(charPhase * 2) * 0.2 + 0.8;
        const charOpacity = breathe * charPulse;

        drawChar(ctx, char, x, textY, dotSize, dotSpacing, charOpacity, glowPulse);
        x += DOT_PATTERNS[char.toUpperCase()]?.[0].length * (dotSize + dotSpacing) || 0;
      });

      // 绘制连接线（字之间的小点）
      for (let i = 0; i < 3; i++) {
        const lineX = startX + (i + 1) * 80 - 2;
        const linePhase = time + i * 0.5;
        const lineOpacity = Math.sin(linePhase * 3) * 0.3 + 0.5;

        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(lineX, textY + 14 + j * 10, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 240, 255, ${lineOpacity})`;
          ctx.fill();
        }
      }

      // 底部装饰点
      drawCurve(ctx, curvePoints, 2, 0.3 + Math.sin(time) * 0.2, 1);

      // 左右两侧装饰
      const sideDots = [];
      for (let i = 0; i < 5; i++) {
        sideDots.push([15, 55 + i * 12]);
        sideDots.push([canvas.width - 15, 55 + i * 12]);
      }
      drawCurve(ctx, sideDots, 1.5, 0.4, 0.8);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mapContainer]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
