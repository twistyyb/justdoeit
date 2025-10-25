interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
  children?: React.ReactNode;
}

export function AnalyticsCard({ title, subtitle, content, children }: AnalyticsCardProps) {
  return (
    <div className="bg-orange-200/70 backdrop-blur-sm border-2 border-orange-400 rounded-2xl p-4 mb-4">
      <div className="text-sm font-bold text-gray-900 mb-2">{title}</div>
      {subtitle && <div className="text-xs text-gray-700 mb-3">{subtitle}</div>}
      {content && <div className="text-xs text-gray-700">{content}</div>}
      {children && <div className="text-xs text-gray-700">{children}</div>}
    </div>
  );
}
