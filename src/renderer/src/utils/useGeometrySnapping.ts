import { useEffect } from "react";
import { Editor, TLShape, TLDrawShape } from "@tldraw/tldraw";

const SNAP_DIST = 20;

export function useGeometrySnapping(editor: Editor) {
  useEffect(() => {
    if (!editor) return;

    const cleanup = editor.sideEffects.registerBeforeChangeHandler(
      "shape",
      (_prev: TLShape, next: TLShape) => {
        // We only intercept active ('isComplete: false') draw shapes
        if (next.type !== "draw") {
          return next;
        }

        const drawShape = next as TLDrawShape;
        if (drawShape.props.isComplete) {
          return next;
        }
        const segments = drawShape.props.segments;
        if (!segments || segments.length === 0) return next;

        const drawTransform = editor.getShapePageTransform(drawShape.id);
        if (!drawTransform) return next;
        const inverseDrawTransform = drawTransform.clone().invert();

        // Convert and cache tool transforms
        const shapes = editor.getCurrentPageShapes();
        const rulersAndProtractors = shapes
          .filter((s) => s.type === "ruler" || s.type === "protractor")
          .map((shape) => ({
            shape,
            transform: editor.getShapePageTransform(shape.id),
          }));

        let didSnap = false;

        const newSegments = segments.map((segment) => {
          if (!segment.points || segment.points.length === 0) return segment;

          const newPoints = segment.points.map((localPoint) => {
            const pagePoint = drawTransform.applyToPoint({
              x: localPoint.x,
              y: localPoint.y,
            });

            let snappedPagePoint: { x: number; y: number } | null = null;
            let minDistance = SNAP_DIST;

            for (const tool of rulersAndProtractors) {
              if (!tool.transform) continue;

              const inverseToolTransform = tool.transform.clone().invert();
              const pLocal = inverseToolTransform.applyToPoint(pagePoint);

              const { w, h } = tool.shape.props as any;

              if (tool.shape.type === "ruler") {
                // Check Top Edge
                if (
                  Math.abs(pLocal.y) < minDistance &&
                  pLocal.x >= -20 &&
                  pLocal.x <= w + 20
                ) {
                  minDistance = Math.abs(pLocal.y);
                  snappedPagePoint = tool.transform.applyToPoint({
                    x: Math.max(0, Math.min(w, pLocal.x)),
                    y: 0,
                  });
                }
                // Check Bottom Edge
                else if (
                  Math.abs(pLocal.y - h) < minDistance &&
                  pLocal.x >= -20 &&
                  pLocal.x <= w + 20
                ) {
                  minDistance = Math.abs(pLocal.y - h);
                  snappedPagePoint = tool.transform.applyToPoint({
                    x: Math.max(0, Math.min(w, pLocal.x)),
                    y: h,
                  });
                }
              } else if (tool.shape.type === "protractor") {
                const cx = w / 2;
                const cy = h;
                const r = w / 2;

                // Check Arc
                const dCenter = Math.hypot(pLocal.x - cx, pLocal.y - cy);

                // Only snap to arc if drawing in the upper half of the protractor
                if (
                  Math.abs(dCenter - r) < minDistance &&
                  pLocal.y <= cy + 10
                ) {
                  minDistance = Math.abs(dCenter - r);
                  // Calculate angle and force point onto the exact arc radius
                  const angle = Math.atan2(pLocal.y - cy, pLocal.x - cx);
                  snappedPagePoint = tool.transform.applyToPoint({
                    x: cx + r * Math.cos(angle),
                    y: cy + r * Math.sin(angle),
                  });
                }
                // Check Bottom Straight Edge
                else if (
                  Math.abs(pLocal.y - h) < minDistance &&
                  pLocal.x >= -20 &&
                  pLocal.x <= w + 20
                ) {
                  minDistance = Math.abs(pLocal.y - h);
                  snappedPagePoint = tool.transform.applyToPoint({
                    x: Math.max(0, Math.min(w, pLocal.x)),
                    y: h,
                  });
                }
              }
            }

            if (snappedPagePoint) {
              didSnap = true;
              const newLocalPoint =
                inverseDrawTransform.applyToPoint(snappedPagePoint);
              return {
                ...localPoint,
                x: newLocalPoint.x,
                y: newLocalPoint.y,
              };
            }

            return localPoint;
          });

          return {
            ...segment,
            points: newPoints,
          };
        });

        if (didSnap) {
          return {
            ...next,
            props: {
              ...next.props,
              segments: newSegments,
            },
          };
        }

        return next;
      },
    );

    return cleanup;
  }, [editor]);
}
