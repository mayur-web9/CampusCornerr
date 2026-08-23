import { Link } from 'react-router-dom';

interface LogoProps {
  subtitle?: string;
  size?: number;
  to?: string;
  wordmark?: boolean;
  className?: string;
}

export default function Logo({ subtitle, size = 40, to, wordmark = true, className = '' }: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/images/campus-corner-mascot.png"
        alt="Campus Corner"
        style={{ width: size, height: size }}
        className="rounded-xl object-contain flex-shrink-0"
      />
      {wordmark && (
        <div className="min-w-0">
          <div className="font-bold text-slate-900 text-base leading-tight truncate">Campus Corner</div>
          {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="hover:opacity-90 transition-opacity duration-200">
        {content}
      </Link>
    );
  }

  return content;
}
