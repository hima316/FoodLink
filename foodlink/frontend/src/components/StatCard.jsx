export default function StatCard({ icon, label, value, sub, color = 'green' }) {
  const colors = {
    green: 'from-brand-500 to-brand-600',
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-400 to-orange-500',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-400 to-yellow-500',
  };
  return (
    <div className="stat-card group cursor-default">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white shadow-sm mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-2xl font-display font-bold text-gray-900">{value ?? '—'}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
