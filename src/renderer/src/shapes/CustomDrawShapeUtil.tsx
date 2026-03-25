import {
  HTMLContainer,
  ShapeUtil,
  TLDrawShape,
  getDefaultColorTheme,
  Polyline2d,
  Vec,
} from "@tldraw/tldraw";

// Helper to convert points to SVG path data
const ptsToPath = (pts: any[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
};

/**
 * Custom Utility for Draw shapes to support continuous thickness and painting brush effect
 */
export class CustomDrawShapeUtil extends ShapeUtil<TLDrawShape> {
  static override type = "custom-draw" as const;

  override canBind = () => false;
  override canSnap = () => false;

  getDefaultProps(): TLDrawShape["props"] {
    return {
      color: "black",
      fill: "none",
      dash: "draw",
      size: "m",
      segments: [],
      isComplete: false,
      isClosed: false,
      isPen: false,
      scale: 1,
    };
  }

  getGeometry(shape: TLDrawShape) {
    const points: Vec[] = [];
    shape.props.segments.forEach((segment: any) => {
      segment.points.forEach((p: any) => {
        points.push(new Vec(p.x, p.y));
      });
    });

    if (points.length < 2) {
      return new Polyline2d({ points: [new Vec(0, 0), new Vec(1, 1)] });
    }

    return new Polyline2d({
      points,
    });
  }

  component(shape: TLDrawShape) {
    const { props } = shape;
    const { color, segments } = props;
    const theme = getDefaultColorTheme({ isDarkMode: this.editor.user.getIsDarkMode() });
    const strokeColor = theme[color].solid;
    const thickness = (shape.meta?.thickness as number) || 7;
    const isBrush = !!shape.meta?.isBrush;
    const brushType = (shape.meta?.brushType as string) || "normal";

    if (segments.length === 0) return null;

    if (isBrush) {
      if (brushType === "normal") {
        // Normal Pressure-Sensitive Pen Brush (Cohesive Ribbon)
        const renderPenRibbon = (offsetAngle: number, widthScale: number, opacity: number) => {
          let d = "";
          let reverseD = "";
          
          segments.forEach((segment: any) => {
            const pts = segment.points;
            if (pts.length < 2) return;

            pts.forEach((p: any, i: number) => {
              const z = p.z !== undefined ? p.z : 0.5;
              const pressureEffect = Math.max(0.1, (z - 0.1) * 2.0); 
              const size = (thickness * pressureEffect * widthScale) / 2;
              
              const dx = Math.cos(offsetAngle) * size;
              const dy = Math.sin(offsetAngle) * size;

              if (i === 0) {
                d += `M ${p.x - dx} ${p.y - dy} `;
              } else {
                d += `L ${p.x - dx} ${p.y - dy} `;
              }
            });

            [...pts].reverse().forEach((p: any) => {
              const z = p.z !== undefined ? p.z : 0.5;
              const pressureEffect = Math.max(0.1, (z - 0.1) * 2.0); 
              const size = (thickness * pressureEffect * widthScale) / 2;
              const dx = Math.cos(offsetAngle) * size;
              const dy = Math.sin(offsetAngle) * size;
              reverseD += `L ${p.x + dx} ${p.y + dy} `;
            });
          });

          if (!d) return null;
          return <path key={offsetAngle} d={d + reverseD + " Z"} fill={strokeColor} opacity={opacity} stroke="none" />;
        };

        return (
          <HTMLContainer>
            <svg style={{ overflow: "visible", width: "100%", height: "100%" }}>
              {renderPenRibbon(0, 1.0, 0.95)}
              {renderPenRibbon(Math.PI / 2, 0.8, 0.3)}
            </svg>
          </HTMLContainer>
        );
      }

      if (brushType === "airbrush") {
        // Airbrush: Soft, fuzzy stroke
        const paths = segments.map((segment: any, sIdx: number) => {
           const d = ptsToPath(segment.points);
           return (
             <g key={sIdx}>
               <path d={d} fill="none" stroke={strokeColor} strokeWidth={thickness * 3} strokeLinecap="round" opacity={0.05} />
               <path d={d} fill="none" stroke={strokeColor} strokeWidth={thickness * 2} strokeLinecap="round" opacity={0.1} />
               <path d={d} fill="none" stroke={strokeColor} strokeWidth={thickness * 1} strokeLinecap="round" opacity={0.2} />
               <path d={d} fill="none" stroke={strokeColor} strokeWidth={thickness * 0.5} strokeLinecap="round" opacity={0.4} />
             </g>
           );
        });
        return (
          <HTMLContainer>
            <svg style={{ overflow: "visible", width: "100%", height: "100%" }}>
              {paths}
            </svg>
          </HTMLContainer>
        );
      }

      // Default: Calligraphy (The tapered ribbon approach)
      const angle = Math.PI / 4; 
      const renderCalligraphyRibbon = (offsetT: number, opacity: number, widthScale: number) => {
        let leftD = "";
        let reverseRightD = "";
        
        segments.forEach((segment: any) => {
          const pts = segment.points;
          pts.forEach((p: any, i: number) => {
            const z = p.z !== undefined ? p.z : 0.5;
            const pressureEffect = Math.max(0.05, (z - 0.1) * 2.5); 
            const size = thickness * pressureEffect * widthScale;
            const dx = Math.cos(angle + Math.PI/2) * (size / 2);
            const dy = Math.sin(angle + Math.PI/2) * (size / 2);
            const bx = Math.cos(angle + Math.PI/2) * (offsetT * thickness);
            const by = Math.sin(angle + Math.PI/2) * (offsetT * thickness);

            if (i === 0) {
              leftD += `M ${p.x - dx + bx} ${p.y - dy + by} `;
            } else {
              leftD += `L ${p.x - dx + bx} ${p.y - dy + by} `;
            }
          });
          
          [...segment.points].reverse().forEach((p: any) => {
            const z = p.z !== undefined ? p.z : 0.5;
            const pressureEffect = Math.max(0.05, (z - 0.1) * 2.5); 
            const size = thickness * pressureEffect * widthScale;
            const dx = Math.cos(angle + Math.PI/2) * (size / 2);
            const dy = Math.sin(angle + Math.PI/2) * (size / 2);
            const bx = Math.cos(angle + Math.PI/2) * (offsetT * thickness);
            const by = Math.sin(angle + Math.PI/2) * (offsetT * thickness);
            reverseRightD += `L ${p.x + dx + bx} ${p.y + dy + by} `;
          });
        });

        if (!leftD) return null;

        return (
          <path
            key={offsetT}
            d={leftD + reverseRightD + " Z"}
            fill={strokeColor}
            opacity={opacity}
            stroke="none"
          />
        );
      };

      const ribbons = [
        renderCalligraphyRibbon(0, 0.8, 1.0),
        renderCalligraphyRibbon(-0.15, 0.4, 0.6),
        renderCalligraphyRibbon(0.15, 0.4, 0.6),
      ].filter(Boolean);

      return (
        <HTMLContainer>
          <svg style={{ overflow: "visible", width: "100%", height: "100%" }}>
            {ribbons}
          </svg>
        </HTMLContainer>
      );
    }

    // Normal Draw Shape (Pen)
    const pathData = ptsToPath(segments[0].points);

    return (
      <HTMLContainer>
        <svg style={{ overflow: "visible", width: "100%", height: "100%" }}>
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </HTMLContainer>
    );
  }

  indicator(shape: TLDrawShape) {
    const thickness = (shape.meta?.thickness as number) || 7;
    const points: Vec[] = [];
    shape.props.segments.forEach((segment: any) => {
      segment.points.forEach((p: any) => {
        points.push(new Vec(p.x, p.y));
      });
    });

    if (points.length < 2) return null;

    return (
      <path
        d={ptsToPath(points)}
        fill="none"
        strokeWidth={thickness}
        stroke="currentColor"
      />
    );
  }
}
