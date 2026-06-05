import { AlertTriangle } from 'lucide-react';

interface Props {
  titles: Record<string, string>;
  limits: Record<string, number>;
}

export function TitlePreview({ titles, limits }: Props) {
  return (
    <div className="space-y-2">
      {Object.entries(titles).map(([platform, title]) => {
        const limit = limits[platform] ?? 999;
        const trimmed = title.length >= limit;
        return (
          <div key={platform} className="rounded-md border border-gray-200 p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>{platform}</span>
              <span className="flex items-center gap-1">
                {title.length}/{limit}
                {trimmed && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              </span>
            </div>
            <p className="text-sm text-gray-800">{title}</p>
          </div>
        );
      })}
    </div>
  );
}
