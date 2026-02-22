import {
  ShapeUtil,
  HTMLContainer,
  T,
  Rectangle2d,
  resizeBox,
} from "@tldraw/tldraw";
import { IProtractorShape } from "./protractor-shape-types";

export class ProtractorShapeUtil extends ShapeUtil<IProtractorShape> {
  static override type = "protractor" as const;
  static override props = {
    w: T.number,
    h: T.number,
  };

  override getDefaultProps(): IProtractorShape["props"] {
    return {
      w: 300,
      h: 150,
    };
  }

  override getGeometry(shape: IProtractorShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canResize = () => true;
  override onResize = (shape: IProtractorShape, info: any) => {
    return resizeBox(shape, info);
  };

  override component(shape: IProtractorShape) {
    const { w, h } = shape.props;
    const r = w / 2;

    // Create tick marks
    const ticks = [];

    // 0 to 180 degrees
    for (let i = 0; i <= 180; i++) {
      // Calculate position
      const angle = (i * Math.PI) / 180;
      // We want 0 on the right, 180 on the left (standard protractor)
      // or 0 on left? Standard is usually 0 on right counter-clockwise to 180 on left.
      // Let's do standard math: 0 is right (3 o'clock).

      // But screen coordinates: y is down.
      // Center is (w/2, h)
      // x = cx + r * cos(angle)
      // y = cy - r * sin(angle)

      const cx = w / 2;
      const cy = h;

      const isMajor = i % 10 === 0;
      const isMedium = i % 5 === 0;

      const length = isMajor ? 15 : isMedium ? 10 : 5;
      const tickR = r - 2; // slight padding from edge

      const x1 = cx + tickR * Math.cos(-angle); // negative angle because y grows down
      const y1 = cy + tickR * Math.sin(-angle);

      const matchR = tickR - length;
      const x2 = cx + matchR * Math.cos(-angle);
      const y2 = cy + matchR * Math.sin(-angle);

      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="black"
          strokeWidth={isMajor ? 1.5 : 0.5}
        />,
      );

      // Add labels
      if (isMajor && i !== 0 && i !== 180) {
        const textR = r - 25;
        const tx = cx + textR * Math.cos(-angle);
        const ty = cy + textR * Math.sin(-angle);
        ticks.push(
          <text
            key={`t-${i}`}
            x={tx}
            y={ty}
            fontSize={10}
            fontFamily="sans-serif"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="black"
            transform={`rotate(${90 - i}, ${tx}, ${ty})`} // Rotate text to be readable? Or keep horizontal?
            // Let's keep specific rotation: 0 degrees -> horizontal.
            // Actually, standard protractors often have text oriented towards center or horizontal.
            // Let's try simple horizontal first, but rotated might look cooler.
            // Let's remove transform for readability first.
          >
            {i}
          </text>,
        );
      }
    }

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: "all",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg
          width={w}
          height={h}
          style={{
            overflow: "visible",
            filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))",
          }}
        >
          <path
            d={`M 0 ${h} A ${w / 2} ${h} 0 0 1 ${w} ${h} Z`}
            fill="rgba(255, 255, 255, 0.4)"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1"
            fillRule="evenodd"
            style={{ backdropFilter: "blur(4px)" }}
          />
          {ticks}
          {/* Center point */}
          <circle cx={w / 2} cy={h} r={3} fill="black" />
          <line x1={w / 2} y1={h} x2={w / 2} y2={h - 10} stroke="black" />
          <line x1={0} y1={h} x2={w} y2={h} stroke="black" />
        </svg>
        {/* Close Button */}
        <button
          onPointerDown={() => this.editor.deleteShapes([shape.id])}
          style={{
            position: "absolute",
            right: -10,
            top: 0,
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
          title="Remove Protractor"
        >
          X
        </button>
      </HTMLContainer>
    );
  }

  override indicator(shape: IProtractorShape) {
    const { w, h } = shape.props;
    return <path d={`M 0 ${h} A ${w / 2} ${h} 0 0 1 ${w} ${h} Z`} />;
  }
}
