import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  trend?: string;
  color: 'purple' | 'blue' | 'green' | 'red';
}

const colorMap: Record<string, string> = {
  purple: 'var(--primary)',
  blue: 'var(--secondary)',
  green: 'var(--success)',
  red: 'var(--danger)',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  const badgeClass = `badge badge-${color}`;

  return (
    <div className="card glass">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
        }}
      >
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            {title}
          </p>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginTop: '0.25rem' }}>
            {value}
          </h3>
        </div>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '12px',
            background: `rgba(255,255,255,0.05)`,
            color: colorMap[color],
          }}
        >
          <Icon size={24} />
        </div>
      </div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{subtitle}</p>
        {trend && (
          <span className={badgeClass} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
