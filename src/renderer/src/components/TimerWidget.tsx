import { useState, useRef } from "react";
import { useTimer } from "react-timer-hook";

export function TimerWidget({ onClose }: { onClose?: () => void }) {
  const [totalSeconds, setTotalSeconds] = useState(30);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const expiryTime = new Date();
  expiryTime.setSeconds(expiryTime.getSeconds() + totalSeconds);

  const {
    seconds: displaySeconds,
    minutes: displayMinutes,
    isRunning,
    pause,
    restart,
  } = useTimer({
    expiryTimestamp: expiryTime,
    autoStart: false,
    interval: 100,
    onExpire: () => {},
  });

  const adjustMinutes = (delta: number) => {
    const newMins = Math.max(0, Math.min(59, minutes + delta));
    setMinutes(newMins);
    const newTotal = newMins * 60 + seconds;
    setTotalSeconds(newTotal);
    if (!isRunning) {
      const time = new Date();
      time.setSeconds(time.getSeconds() + newTotal);
      restart(time, false);
    }
  };

  const adjustSeconds = (delta: number) => {
    let newSecs = seconds + delta;
    let newMins = minutes;
    if (newSecs >= 60) {
      newSecs = 0;
      newMins = Math.min(59, newMins + 1);
    } else if (newSecs < 0) {
      if (newMins > 0) {
        newSecs = 50;
        newMins = Math.max(0, newMins - 1);
      } else {
        newSecs = 0;
      }
    }
    setMinutes(newMins);
    setSeconds(newSecs);
    const newTotal = newMins * 60 + newSecs;
    setTotalSeconds(newTotal);
    if (!isRunning) {
      const time = new Date();
      time.setSeconds(time.getSeconds() + newTotal);
      restart(time, false);
    }
  };

  const handleStart = () => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + totalSeconds);
    restart(time, true);
  };

  const handleReset = () => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + totalSeconds);
    restart(time, false);
  };

  const isExpired = !isRunning && totalSeconds > 0 && displayMinutes === 0 && displaySeconds === 0;
  const showSetter = !isRunning;

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const timerColor = isExpired
    ? "#22c55e"
    : displayMinutes === 0 && displaySeconds <= 10 && isRunning
      ? "#ef4444"
      : "#f97316";

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 60,
        right: 70,
        zIndex: 99998,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: 200,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          border: "2px solid rgba(249, 115, 22, 0.6)",
          overflow: "hidden",
          userSelect: "none",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        <div style={{ padding: "10px 12px" }}>
          {showSetter && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: 6,
              marginBottom: 8,
              padding: "6px 8px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
            }}>
              <button
                onPointerDown={(e) => { e.stopPropagation(); adjustMinutes(-1); }}
                style={{ width: 24, height: 24, border: "none", borderRadius: 4, background: "rgba(249, 115, 22, 0.6)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                -
              </button>
              <span style={{ color: "white", fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{minutes}</span>
              <button
                onPointerDown={(e) => { e.stopPropagation(); adjustMinutes(1); }}
                style={{ width: 24, height: 24, border: "none", borderRadius: 4, background: "rgba(249, 115, 22, 0.6)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                +
              </button>
              <span style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 2px" }}>:</span>
              <button
                onPointerDown={(e) => { e.stopPropagation(); adjustSeconds(-10); }}
                style={{ width: 24, height: 24, border: "none", borderRadius: 4, background: "rgba(249, 115, 22, 0.6)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                -
              </button>
              <span style={{ color: "white", fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{seconds.toString().padStart(2, "0")}</span>
              <button
                onPointerDown={(e) => { e.stopPropagation(); adjustSeconds(10); }}
                style={{ width: 24, height: 24, border: "none", borderRadius: 4, background: "rgba(249, 115, 22, 0.6)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                +
              </button>
            </div>
          )}

          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              textAlign: "center",
              color: timerColor,
              marginBottom: 8,
            }}
          >
            {isExpired ? "Done!" : `${displayMinutes.toString().padStart(2, "0")}:${displaySeconds.toString().padStart(2, "0")}`}
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            <button
              onPointerDown={(e) => { e.stopPropagation(); isRunning ? pause() : handleStart(); }}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                color: "white",
              }}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              onPointerDown={(e) => { e.stopPropagation(); handleReset(); }}
              style={{
                padding: "8px 12px",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: "rgba(255,255,255,0.1)",
                color: "white",
              }}
            >
              Reset
            </button>
            {onClose && (
              <button
                onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#fca5a5",
                }}
              >
                X
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
