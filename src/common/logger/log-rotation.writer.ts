import * as fs from 'fs';
import * as path from 'path';

function rotateIfNeeded(filename: string, maxSizeBytes: number): void {
  try {
    const stat = fs.statSync(filename);
    if (stat.size >= maxSizeBytes) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = path.extname(filename);
      const base = filename.slice(0, -ext.length);
      fs.renameSync(filename, `${base}-${timestamp}${ext}`);
    }
  } catch {
    // file doesn't exist yet — first write will create it
  }
}

export function createFileWriter(
  filename: string,
  maxSizeBytes: number,
): (entry: Record<string, unknown>) => void {
  fs.mkdirSync(path.dirname(filename), { recursive: true });

  return (entry) => {
    rotateIfNeeded(filename, maxSizeBytes);
    fs.appendFileSync(
      filename,
      JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n',
    );
  };
}
