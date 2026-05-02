import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-brand-primary/15 bg-white/60 text-center dark:border-white/10 dark:bg-brand-surface/72">
      <h3 className="font-heading text-xl font-semibold text-brand-primary dark:text-brand-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-brand-mist">{description}</p>
    </Card>
  );
}
