import { NextResponse } from 'next/server';
import { clearAllData } from '@/services/databaseService';

export async function POST() {
  try {
    await clearAllData();
    return NextResponse.json({ message: 'Database cleared' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
