'use server';

export async function generateFont(labId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.HONO_BACKEND_URL || 'http://localhost:8787'}/api/fonts/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-praktikan-api-key': process.env.PRAKTIKAN_GET_API_KEY || ''
        },
        body: JSON.stringify({ lab_id: labId })
      }
    );

    if (!response.ok) {
      console.error('Failed to generate font, status:', response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (e) {
    console.error('Error in font service action:', e);
    return null;
  }
}
