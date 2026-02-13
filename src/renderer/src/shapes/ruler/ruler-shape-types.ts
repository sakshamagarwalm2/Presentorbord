import { TLBaseShape } from '@tldraw/tldraw'

export type IRulerShape = TLBaseShape<
  'ruler',
  {
    w: number
    h: number
  }
>
