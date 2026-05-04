interface SectionHeadProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHead({ title, subtitle, action }: SectionHeadProps) {
  return (
    <div className="mb-2.5 flex items-end justify-between">
      <div>
        <h2 className="m-0 text-[14px] font-semibold tracking-normal">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[12px] text-foreground-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
