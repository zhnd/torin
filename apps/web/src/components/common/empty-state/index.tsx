interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="mb-3 inline-block h-px w-8 bg-border-strong" />
      <h3 className="text-[16px] font-semibold tracking-normal text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-72 text-[12.5px] text-foreground-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
