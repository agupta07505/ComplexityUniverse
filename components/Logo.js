export default function Logo({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* orbit ring */}
      <ellipse
        cx="16"
        cy="16"
        rx="13.2"
        ry="6.4"
        transform="rotate(-24 16 16)"
        stroke="#4338ca"
        strokeWidth="1.7"
        fill="none"
        opacity="0.75"
      />
      {/* planet */}
      <circle cx="16" cy="16" r="5.4" fill="#1b1b1f" />
      <circle cx="16" cy="16" r="5.4" stroke="#4338ca" strokeWidth="1.2" fill="none" opacity="0.5" />
      {/* travelling star */}
      <circle cx="27.1" cy="10.4" r="2.1" fill="#b98a1c" />
    </svg>
  );
}
