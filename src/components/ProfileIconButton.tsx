import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
};

// Round outlined button with a gold icon and a small label (PRD 7.5).
export function ProfileIconButton({ label, children, href, onClick }: Props) {
  const circle =
    "flex h-[54px] w-[54px] items-center justify-center rounded-full border border-line text-[var(--accent,#c9a34e)] transition-colors hover:border-[var(--accent,#c9a34e)]";
  return (
    <div className="flex flex-col items-center gap-2">
      {href ? (
        <a
          href={href}
          aria-label={label}
          className={circle}
          {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      ) : (
        <button type="button" aria-label={label} onClick={onClick} className={circle}>
          {children}
        </button>
      )}
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}
