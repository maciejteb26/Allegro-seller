type LogLevel = 'info' | 'warn' | 'error' | 'security';

function write(level: LogLevel, event: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn' || level === 'security') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => write('info', event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => write('warn', event, meta),
  error: (event: string, meta?: Record<string, unknown>) => write('error', event, meta),
  security: (event: string, meta?: Record<string, unknown>) => write('security', event, meta),
};
