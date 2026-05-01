import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';

vi.mock('fs');

import { createFileWriter } from '../../../src/common/logger/log-rotation.writer';

describe('createFileWriter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.appendFileSync).mockReturnValue(undefined);
    vi.mocked(fs.renameSync).mockReturnValue(undefined);
  });

  it('creates the log directory on initialisation', () => {
    vi.mocked(fs.statSync).mockImplementation(() => { throw new Error('ENOENT'); });
    createFileWriter('logs/app.log', 1024);
    expect(fs.mkdirSync).toHaveBeenCalledWith('logs', { recursive: true });
  });

  it('appends a JSON line with timestamp on write', () => {
    vi.mocked(fs.statSync).mockImplementation(() => { throw new Error('ENOENT'); });
    const write = createFileWriter('logs/app.log', 1024);
    write({ level: 'log', message: 'hello' });
    const written = vi.mocked(fs.appendFileSync).mock.calls[0][1] as string;
    const parsed = JSON.parse(written.trim());
    expect(parsed.level).toBe('log');
    expect(parsed.message).toBe('hello');
    expect(parsed.timestamp).toBeDefined();
  });

  it('renames the log file when it exceeds maxSizeBytes', () => {
    vi.mocked(fs.statSync).mockReturnValue({ size: 2048 } as fs.Stats);
    const write = createFileWriter('logs/app.log', 1024);
    write({ level: 'warn', message: 'big file' });
    expect(fs.renameSync).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalled();
  });

  it('does not rename when file is under maxSizeBytes', () => {
    vi.mocked(fs.statSync).mockReturnValue({ size: 512 } as fs.Stats);
    const write = createFileWriter('logs/app.log', 1024);
    write({ level: 'log', message: 'small file' });
    expect(fs.renameSync).not.toHaveBeenCalled();
  });
});
