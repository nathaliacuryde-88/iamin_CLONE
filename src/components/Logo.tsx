interface LogoProps {
  /** Tailwind text size class. Defaults to text-[17px]. */
  size?: string;
  className?: string;
}

/**
 * Brand wordmark: "I am (IN)".
 *  - "I am" stays in normal sentence case (lowercase a/m).
 *  - "IN" is uppercase.
 *  - Only the parentheses are tinted purple (the brand accent).
 *  - Uses the app body font (Space Grotesk) — inherited via font-sans.
 */
const Logo = ({ size = "text-[17px]", className = "" }: LogoProps) => {
  return (
    <span
      // `normal-case` defends against any ancestor `uppercase` utility.
      className={`font-black tracking-[0.04em] text-foreground leading-none normal-case font-sans ${size} ${className}`}
    >
      I am <span className="text-primary">(</span>
      <span className="uppercase">IN</span>
      <span className="text-primary">)</span>
    </span>
  );
};

export default Logo;
