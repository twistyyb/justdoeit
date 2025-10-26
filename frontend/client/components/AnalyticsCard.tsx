interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
  children?: React.ReactNode;
  textColor: string;
}

export function AnalyticsCard({ title, subtitle, content, children, textColor }: AnalyticsCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4">
      <div className={`text-sm font-bold ${textColor} mb-2`}>{title}</div>
      {subtitle && <div className={`text-xs ${textColor} opacity-80 mb-3`}>{subtitle}</div>}
      {content && <div className={`text-xs ${textColor} opacity-90`}>{content}</div>}
      {children && <div className={`text-xs ${textColor} opacity-90`}>{children}</div>}
    </div>
  );
}
