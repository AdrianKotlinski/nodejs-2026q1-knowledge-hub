import { vi, describe, it, expect } from 'vitest';

vi.mock('../../../src/common/logger/log-rotation.writer', () => ({
  createFileWriter: vi.fn(() => vi.fn()),
}));

import { AppLogger } from '../../../src/common/logger/app.logger';
import { createFileWriter } from '../../../src/common/logger/log-rotation.writer';

describe('AppLogger', () => {
  it('calls the file writer for each log level', () => {
    const mockWrite = vi.fn();
    vi.mocked(createFileWriter).mockReturnValue(mockWrite);

    const logger = new AppLogger();
    logger.log('msg', 'Ctx');
    logger.warn('msg', 'Ctx');
    logger.error('msg', 'stack', 'Ctx');
    logger.debug('msg', 'Ctx');
    logger.verbose('msg', 'Ctx');

    expect(mockWrite).toHaveBeenCalledTimes(5);
  });
});
