interface BadgeProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function Badge({ children, active, onClick }: BadgeProps) {
  const baseStyles = "text-xs px-2.5 py-1 rounded-full transition-colors";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} cursor-pointer ${
          active
            ? "bg-accent text-white"
            : "bg-border text-muted hover:bg-muted/30 hover:text-foreground"
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={`${baseStyles} bg-border text-muted`}>
      {children}
    </span>
  );
}
