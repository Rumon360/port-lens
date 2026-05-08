interface PortLabel {
  name: string;
  https?: boolean;
}

const LABELS: Record<number, PortLabel> = {
  80:    { name: 'HTTP' },
  443:   { name: 'HTTPS', https: true },
  3000:  { name: 'React · Next' },
  3001:  { name: 'Express' },
  4000:  { name: 'GraphQL' },
  4200:  { name: 'Angular' },
  4321:  { name: 'Astro' },
  5000:  { name: 'Flask' },
  5173:  { name: 'Vite' },
  5432:  { name: 'Postgres' },
  6379:  { name: 'Redis' },
  8000:  { name: 'HTTP Dev' },
  8080:  { name: 'HTTP Alt' },
  8443:  { name: 'HTTPS', https: true },
  8888:  { name: 'Jupyter' },
  9200:  { name: 'Elasticsearch' },
  9229:  { name: 'Node Debug' },
  27017: { name: 'MongoDB' },
  3306:  { name: 'MySQL' },
  5601:  { name: 'Kibana' },
};

export function getPortLabel(port: number): PortLabel | null {
  return LABELS[port] ?? null;
}

export function getLocalhostUrl(port: number): string {
  const label = LABELS[port];
  const scheme = label?.https ? 'https' : 'http';
  return `${scheme}://localhost:${port}`;
}

export function isListenPort(status: string): boolean {
  const s = status.toUpperCase();
  return s === 'LISTEN' || s === 'LISTENING';
}
