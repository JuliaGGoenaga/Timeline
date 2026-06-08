import disciplines from '@/data/disciplines.json';

const MAP = Object.fromEntries(disciplines.map((d) => [d.id, d]));

export default function DisciplineTag({ id }: { id: string }) {
  const disc = MAP[id];
  if (!disc) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: disc.color + 'cc' }}
    >
      {disc.icon} {disc.label}
    </span>
  );
}
