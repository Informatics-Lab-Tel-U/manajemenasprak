import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireRole(['ADMIN']);
    const { term } = await req.json();

    logger.info(`Triggering seed for ${term}`);

    return new Promise<NextResponse>((resolve) => {
      exec(`npx tsx scripts/seed.ts`, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          logger.error(`Seed exec error: ${error.message}`);
          resolve(NextResponse.json({ error: error.message, details: stderr }, { status: 500 }));
          return;
        }
        logger.info(`Seed output: ${stdout}`);
        resolve(NextResponse.json({ message: 'Seed executed successfully', output: stdout }));
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

