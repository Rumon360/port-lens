export interface PortEntry {
  // Stable React key: "${protocol}-${port}-${pid}"
  key: string;
  port: number;
  protocol: 'TCP' | 'UDP';
  pid: number;
  processName: string;
  localAddress: string;
  status: string;
}
