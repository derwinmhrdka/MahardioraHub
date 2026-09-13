type DinoPawProps = {
  size?: number;
  className?: string;
  title?: string;
};

/** Tiny dino footprint mark for buttons / chips. */
export function DinoPaw({ size = 14, className, title }: DinoPawProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 13c2.5 0 5 2.7 5 5.3 0 1.8-1.4 2.7-3 2.2-1-.3-1.3-.3-2 0-1.6.5-3-.4-3-2.2C9 15.7 9.5 13 12 13Z" />
      <path d="M6 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
      <path d="M18 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
      <path d="M9 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
      <path d="M15 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
    </svg>
  );
}
