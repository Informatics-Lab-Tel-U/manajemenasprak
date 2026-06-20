import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { logger } from '@/lib/logger';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { term } = await req.json();

    logger.info(`Triggering seed for ${term}`);

    return new Promise<NextResponse>((resolve) => {
      // Use execFile instead of exec to avoid shell injection vector.
      const child = execFile(
        'npx',
        ['tsx', 'scripts/seed.ts'],
        { cwd: process.cwd() },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(`Seed exec error: ${error.message}`, { stderr });
            resolve(
              NextResponse.json(
                { error: 'Gagal menjalankan proses seeding database' },
                { status: 500 }
              )
            );
            return;
          }
          logger.info(`Seed output: ${stdout}`);
          resolve(NextResponse.json({ message: 'Seed executed successfully', output: stdout }));
        }
      );
    });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/seed');
  }
}
