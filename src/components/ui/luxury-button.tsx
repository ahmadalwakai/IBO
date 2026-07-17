import Link from "next/link";
import { ArrowRight } from "lucide-react";

type LuxuryButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "default" | "warm";
  className?: string;
  external?: boolean;
  icon?: React.ReactNode;
};

export function LuxuryButton({
  href,
  children,
  variant = "default",
  className = "",
  external = false,
  icon,
}: LuxuryButtonProps) {
  const content = (
    <>
      <span>{children}</span>
      {icon ?? <ArrowRight aria-hidden="true" />}
    </>
  );
  const classes = `luxury-button ${variant} ${className}`.trim();

  if (external) {
    return (
      <a className={classes} href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {content}
    </Link>
  );
}
