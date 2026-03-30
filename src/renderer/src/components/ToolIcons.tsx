export function MarkerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="7" y="2" width="6" height="11" rx="2" fill="currentColor" opacity="0.85" />
      <path d="M7 13 L5.5 17 L14.5 17 L13 13 Z" fill="currentColor" opacity="0.7" />
      <rect x="5" y="17" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="8.5" y="2" width="3" height="1" rx="0.5" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

export function PenIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 2.5L17.5 5.5L7 16L3 17L4 13L14.5 2.5Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M14.5 2.5L17.5 5.5L15.5 7.5L12.5 4.5L14.5 2.5Z" fill="currentColor" />
    </svg>
  )
}

export function BrushIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.5 3C15.5 3 17 5 17 7.5C17 9 16 10 14.5 10.5C13.5 10.8 12 10.5 11 10C10 9.5 9.5 8.5 9.5 7.5C9.5 5 11 3 11 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 3V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="11" cy="17" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

export function HighlighterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="1" width="8" height="12" rx="1" fill="currentColor" opacity="0.85" />
      <path d="M6 13 L4 18 L16 18 L14 13 Z" fill="currentColor" opacity="0.7" />
      <rect x="4" y="18" width="12" height="1" fill="currentColor" />
      <rect x="8" y="1" width="4" height="1.5" rx="0.5" fill="currentColor" opacity="0.4" />
      <rect x="7" y="5" width="6" height="1" rx="0.5" fill="currentColor" opacity="0.2" />
    </svg>
  )
}

export function LaserIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="4" fill="currentColor" opacity="0.3" />
      <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="10" cy="10" r="0.8" fill="currentColor" />
      <path d="M10 2 L10 4" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <path d="M10 16 L10 18" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <path d="M2 10 L4 10" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <path d="M16 10 L18 10" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <path d="M4.2 4.2 L5.6 5.6" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <path d="M14.4 14.4 L15.8 15.8" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <path d="M4.2 15.8 L5.6 14.4" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <path d="M14.4 5.6 L15.8 4.2" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    </svg>
  )
}
