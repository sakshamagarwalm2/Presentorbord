import { useState, useRef } from "react";
import { useTimer } from "react-timer-hook";

export function TimerWidget({ onClose }: { onClose?: () => void }) {
  const [totalSeconds, setTotalSeconds] = useState(30);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  const expiryTime = new Date();
  expiryTime.setSeconds(expiryTime.getSeconds() + totalSeconds);

  const {
    seconds: displaySeconds,
    minutes: displayMinutes,
    isRunning,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp: expiryTime,
    autoStart: false,
    interval: 100,
    onExpire: () => {
      console.log("Timer expired!");
    },
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
        width: 320,
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        borderRadius: 16,
        padding: 16,
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        border: "3px solid rgba(249, 115, 22, 0.6)",
      }}
    >
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        gap: 12,
        marginBottom: showSetter ? 8 : 0,
        padding: "8px 12px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 10,
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>SET</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => adjustMinutes(-1)}
            style={{
              width: 28,
              height: 28,
              border: "none",
              borderRadius: 6,
              background: "rgba(249, 115, 22, 0.6)",
              color: "white",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            -
          </button>
          <span style={{ color: "white", fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: "center" }}>
            {minutes}
          </span>
          <button
            onClick={() => adjustMinutes(1)}
            style={{
              width: 28,
              height: 28,
              border: "none",
              borderRadius: 6,
              background: "rgba(249, 115, 22, 0.6)",
              color: "white",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            +
          </button>
          <span style={{ color: "white", fontSize: 18, fontWeight: 700, margin: "0 4px" }}>:</span>
          <button
            onClick={() => adjustSeconds(-10)}
            style={{
              width: 28,
              height: 28,
              border: "none",
              borderRadius: 6,
              background: "rgba(249, 115, 22, 0.6)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            -
          </button>
          <span style={{ color: "white", fontSize: 18, fontWeight: 700, minWidth: 30, textAlign: "center" }}>
            {seconds.toString().padStart(2, "0")}
          </span>
          <button
            onClick={() => adjustSeconds(10)}
            style={{
              width: 28,
              height: 28,
              border: "none",
              borderRadius: 6,
              background: "rgba(249, 115, 22, 0.6)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>

      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          textAlign: "center",
          background: isExpired
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : displayMinutes === 0 && displaySeconds <= 10 && isRunning
              ? "linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
              : "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "0 0 40px rgba(249, 115, 22, 0.6)",
          padding: "8px 0",
        }}
      >
        {isExpired ? "Done!" : `${displayMinutes.toString().padStart(2, "0")}:${displaySeconds.toString().padStart(2, "0")}`}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button
          onClick={isRunning ? pause : handleStart}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            color: "white",
          }}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "10px 16px",
            border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            fontSize: 14,
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
            onClick={onClose}
            style={{
              padding: "10px 16px",
              border: "2px solid rgba(239, 68, 68, 0.4)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
            }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
