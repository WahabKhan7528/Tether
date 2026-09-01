export default function EmptyState({ icon = '✨', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-lg font-semibold text-stone-700">{title}</h3>
      {description && <p className="mt-2 text-stone-400 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
