import {
  ShapeUtil,
  HTMLContainer,
  T,
  Rectangle2d,
  resizeBox,
  createShapeId,
} from "@tldraw/tldraw";
import { ICompassShape } from "./compass-shape-types";

export class CompassShapeUtil extends ShapeUtil<ICompassShape> {
  static override type = "compass" as const;
  static override props = {
    w: T.number,
    h: T.number,
    radius: T.number,
  };

  override getDefaultProps(): ICompassShape["props"] {
    return {
      w: 150,
      h: 50,
      radius: 100,
    };
  }

  override getGeometry(shape: ICompassShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: Math.max(shape.props.h, 60),
      isFilled: true,
    });
  }

  override canResize = () => true;

  override onResize = (shape: ICompassShape, info: any) => {
    const resized = resizeBox(shape, info);
    return {
      ...resized,
      props: {
        ...resized.props,
        radius: Math.max(50, resized.props.w),
      },
    };
  };

  override component(shape: ICompassShape) {
    const { w, h, radius } = shape.props;

    // ── Point 1: Center Needle → Move entire compass ──
    const handleNeedleDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);

      const startPage = this.editor.screenToPage({
        x: e.clientX,
        y: e.clientY,
      });
      const startX = shape.x;
      const startY = shape.y;

      const move = (ev: PointerEvent) => {
        const p = this.editor.screenToPage({ x: ev.clientX, y: ev.clientY });
        this.editor.updateShape({
          id: shape.id,
          type: "compass",
          x: startX + (p.x - startPage.x),
          y: startY + (p.y - startPage.y),
        });
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

    // ── Point 2: Pencil Body → Rotate compass AND resize radius ──
    const handleBodyDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);

      const transform = this.editor.getShapePageTransform(shape.id);
      if (!transform) return;

      const needleLocal = { x: 0, y: h / 2 };
      const needlePage = transform.applyToPoint(needleLocal);

      const move = (ev: PointerEvent) => {
        const p = this.editor.screenToPage({ x: ev.clientX, y: ev.clientY });
        const dx = p.x - needlePage.x;
        const dy = p.y - needlePage.y;
        const angle = Math.atan2(dy, dx);
        const newRadius = Math.max(50, Math.hypot(dx, dy));
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rx = needleLocal.x * cosA - needleLocal.y * sinA;
        const ry = needleLocal.x * sinA + needleLocal.y * cosA;

        this.editor.updateShape({
          id: shape.id,
          type: "compass",
          x: needlePage.x - rx,
          y: needlePage.y - ry,
          rotation: angle,
          props: {
            w: newRadius,
            radius: newRadius,
          },
        });
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

    // ── Point 3: Pencil Tip → Rotate compass AND draw arc ──
    const handleTipDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);

      const transform = this.editor.getShapePageTransform(shape.id);
      if (!transform) return;

      const needleLocal = { x: 0, y: h / 2 };
      const needlePage = transform.applyToPoint(needleLocal);
      const startPencil = transform.applyToPoint({ x: radius, y: h / 2 });

      const drawId = createShapeId();
      const pts = [{ x: startPencil.x, y: startPencil.y, z: 0.5 }];

      this.editor.createShape({
        id: drawId,
        type: "draw",
        x: 0,
        y: 0,
        props: {
          segments: [{ type: "free", points: [...pts] }],
          color: "black",
          fill: "none",
          dash: "draw",
          size: "m",
          isComplete: false,
        },
      });

      const move = (ev: PointerEvent) => {
        const p = this.editor.screenToPage({ x: ev.clientX, y: ev.clientY });
        const angle = Math.atan2(p.y - needlePage.y, p.x - needlePage.x);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rx = needleLocal.x * cosA - needleLocal.y * sinA;
        const ry = needleLocal.x * sinA + needleLocal.y * cosA;

        this.editor.updateShape({
          id: shape.id,
          type: "compass",
          x: needlePage.x - rx,
          y: needlePage.y - ry,
          rotation: angle,
        });

        pts.push({
          x: needlePage.x + radius * cosA,
          y: needlePage.y + radius * sinA,
          z: 0.5,
        });

        this.editor.updateShape({
          id: drawId,
          type: "draw",
          props: { segments: [{ type: "free", points: [...pts] }] },
        });
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        this.editor.updateShape({
          id: drawId,
          type: "draw",
          props: { isComplete: true },
        });
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: "all",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          position: "relative",
        }}
      >
        <svg
          width={w + 20}
          height={Math.max(h, 60)}
          style={{
            overflow: "visible",
            filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))",
          }}
        >
          {/* ── Non-interactive visual elements ── */}
          <line
            x1={0}
            y1={h / 2}
            x2={radius}
            y2={h / 2}
            stroke="#666"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ pointerEvents: "none" }}
          />
          <text
            x={radius / 2}
            y={h / 2 - 8}
            fontSize={12}
            fill="#333"
            textAnchor="middle"
            fontFamily="sans-serif"
            style={{ pointerEvents: "none" }}
          >
            {(radius / 10).toFixed(1)} cm
          </text>

          {/* Needle point decoration (non-interactive) */}
          <path
            d={`M -2 ${h / 2 + 5} L 2 ${h / 2 + 5} L 0 ${h / 2 + 20} Z`}
            fill="#95a5a6"
            style={{ pointerEvents: "none" }}
          />

          {/* Pencil body decoration (non-interactive) */}
          <rect
            x={radius - 8}
            y={h / 2 - 12}
            width={16}
            height={24}
            rx={4}
            fill="#2c3e50"
            style={{ pointerEvents: "none" }}
          />

          {/* Pencil tip decoration (non-interactive) */}
          <path
            d={`M ${radius - 4} ${h / 2 + 12} L ${radius + 4} ${h / 2 + 12} L ${radius} ${h / 2 + 25} Z`}
            fill="#f39c12"
            style={{ pointerEvents: "none" }}
          />
          <polygon
            points={`${radius - 1},${h / 2 + 22} ${radius + 1},${h / 2 + 22} ${radius},${h / 2 + 25}`}
            fill="#333"
            style={{ pointerEvents: "none" }}
          />

          {/* ═══ CONTROL POINT 1: Center Needle (RED circle) ═══ */}
          <circle
            cx={0}
            cy={h / 2}
            r={8}
            fill="#e74c3c"
            stroke="#fff"
            strokeWidth={2}
            style={{ cursor: "move" }}
            onPointerDown={handleNeedleDown}
          />

          {/* ═══ CONTROL POINT 2: Pen Body (BLUE circle) ═══ */}
          <circle
            cx={radius}
            cy={h / 2}
            r={8}
            fill="#3498db"
            stroke="#fff"
            strokeWidth={2}
            style={{ cursor: "pointer" }}
            onPointerDown={handleBodyDown}
          />

          {/* ═══ CONTROL POINT 3: Pen Tip (GREEN circle) ═══ */}
          <circle
            cx={radius}
            cy={h / 2 + 25}
            r={8}
            fill="#2ecc71"
            stroke="#fff"
            strokeWidth={2}
            style={{ cursor: "crosshair" }}
            onPointerDown={handleTipDown}
          />
        </svg>

        {/* Close Button */}
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            this.editor.deleteShapes([shape.id]);
          }}
          style={{
            position: "absolute",
            left: -10,
            top: -10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#e74c3c",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            zIndex: 10,
          }}
          title="Remove Compass"
        >
          X
        </button>
      </HTMLContainer>
    );
  }

  override indicator(shape: ICompassShape) {
    const { w, h } = shape.props;
    return <rect width={w} height={h} rx={4} />;
  }
}
