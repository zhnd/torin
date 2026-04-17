import { Buffer } from 'node:buffer';
import path from 'node:path/posix';
import type Docker from 'dockerode';
import * as tar from 'tar-stream';

/**
 * Upload a single file to the container filesystem via `putArchive`.
 * Safe for arbitrary binary content and large files (no argv length limit).
 */
export async function writeFileToContainer(
  container: Docker.Container,
  absolutePath: string,
  content: string | Buffer,
  mode = 0o644
): Promise<void> {
  const parentDir = path.dirname(absolutePath);
  const fileName = path.basename(absolutePath);
  const buffer =
    typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

  const pack = tar.pack();
  pack.entry({ name: fileName, mode, size: buffer.length }, buffer);
  pack.finalize();

  await container.putArchive(pack as unknown as NodeJS.ReadableStream, {
    path: parentDir,
  });
}

/**
 * Download a single file from the container filesystem via `getArchive`.
 * Returns the raw bytes; caller decides how to decode.
 */
export async function readFileFromContainer(
  container: Docker.Container,
  absolutePath: string
): Promise<Buffer> {
  const stream = await container.getArchive({ path: absolutePath });
  const extract = tar.extract();

  return await new Promise<Buffer>((resolve, reject) => {
    let found: Buffer | undefined;

    extract.on(
      'entry',
      (
        _header: tar.Headers,
        entryStream: NodeJS.ReadableStream,
        next: () => void
      ) => {
        const chunks: Buffer[] = [];
        entryStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        entryStream.on('end', () => {
          if (!found) found = Buffer.concat(chunks);
          next();
        });
        entryStream.on('error', reject);
        entryStream.resume();
      }
    );

    extract.on('finish', () => {
      if (!found) {
        reject(new Error(`File not found in archive: ${absolutePath}`));
        return;
      }
      resolve(found);
    });

    extract.on('error', reject);
    stream.pipe(extract);
  });
}
