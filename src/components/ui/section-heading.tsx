import { LuxuryButton } from "./luxury-button";

type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  text?: string;
  action?: {
    label: string;
    href: string;
  };
  split?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  text,
  action,
  split = false,
}: SectionHeadingProps) {
  return (
    <div className={`section-heading ${split ? "split" : ""}`.trim()}>
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="headline">{title}</h2>
        {text ? <p className="lede">{text}</p> : null}
      </div>
      {action ? (
        <LuxuryButton href={action.href}>{action.label}</LuxuryButton>
      ) : null}
    </div>
  );
}
