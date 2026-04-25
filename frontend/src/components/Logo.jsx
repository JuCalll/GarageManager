export default function Logo({ size = 40, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Garage Manager"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
