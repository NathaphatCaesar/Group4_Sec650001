import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  const { data, error } = await db()
    .from('files')
    .select('id, bucket, storage_path, public_url, file_name, mime_type, download_count')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  const row = data as {
    id: string;
    bucket: string;
    storage_path: string;
    public_url: string;
    file_name: string;
    mime_type: string;
    download_count: number;
  };

  if (request.nextUrl.searchParams.get('download') === '1') {
    await db()
      .from('files')
      .update({ download_count: (row.download_count ?? 0) + 1 })
      .eq('id', row.id);
  }

  if (row.public_url) {
    return NextResponse.redirect(row.public_url, 302);
  }

  const { data: pub } = db().storage.from(row.bucket).getPublicUrl(row.storage_path);
  return NextResponse.redirect(pub.publicUrl, 302);
}
