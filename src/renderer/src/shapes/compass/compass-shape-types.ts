import { TLBaseShape } from "@tldraw/tldraw";

export type ICompassShape = TLBaseShape<
  "compass",
  {
    w: number;
    h: number;
    radius: number;
  }
>;
