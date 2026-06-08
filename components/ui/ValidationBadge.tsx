import type { ValidationStatus } from '@/types';

const STATUS_CONFIG: Record<ValidationStatus, { label: string; classes: string }> = {
  verified: {
    label: 'Verificado',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  partially_verified: {
    label: 'Parcialmente verificado',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  needs_review: {
    label: 'Requiere revisión',
    classes: 'bg-red-50 text-red-600 border-red-200',
  },
};

export default function ValidationBadge({ status }: { status: ValidationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${cfg.classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}
