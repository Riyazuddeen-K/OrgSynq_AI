interface LogoProps {
  size?: number
  className?: string
}

// The OrgSynq AI logo mark — a transparent-background crop of the brand
// icon, sized for whatever slot it's dropped into. No colored background
// box needed; the mark carries its own color (navy/signal/teal), which
// already matches the app's palette.
export default function Logo({ size = 32, className }: LogoProps) {
  return (
    <img
      src="/brand/logo-mark.png"
      alt="OrgSynq AI"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}
