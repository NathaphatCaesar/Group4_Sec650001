'use client';

import { useEffect, useState } from 'react';
import { UserRound, X } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { useT } from '@/lib/i18n/client';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const DISPLAY_NAME_MAX = 40;
const BIO_MAX = 300;
const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ProfileEditDialog({
  displayName: initialDisplayName,
  username: initialUsername,
  avatarUrl,
  bio: initialBio,
}: {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  function selectAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setError(t('รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ GIF'));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError(t('รูปโปรไฟล์ต้องมีขนาดไม่เกิน 2 MB'));
      return;
    }
    setError(null);
    setNotice(null);
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  const changed =
    avatarFile !== null ||
    displayName !== initialDisplayName ||
    username !== initialUsername ||
    bio !== (initialBio ?? '');

  function validate(): string | null {
    if (!displayName.trim()) return t('กรุณาใส่ชื่อที่แสดง');
    if (!USERNAME_PATTERN.test(username)) {
      return t('ชื่อผู้ใช้ต้องยาว 3–20 ตัว ใช้ได้เฉพาะ a-z 0-9 _ และ .');
    }
    return null;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changed || saving) return;
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setSaving(true);
    // TODO: เชื่อม API อัปโหลด avatarFile ผ่าน /api/upload แล้วบันทึก displayName, username, bio
    setNotice(t('การบันทึกจะเปิดใช้งานในขั้นตอนถัดไป'));
    setSaving(false);
  }

  function close() {
    setOpen(false);
    setDisplayName(initialDisplayName);
    setUsername(initialUsername);
    setBio(initialBio ?? '');
    setAvatarFile(null);
    setPreviewUrl(null);
    setNotice(null);
    setError(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-outline px-5 py-2 text-sm">
        {t('แก้ไขโปรไฟล์')}
      </button>

      {open ? (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/35 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
            className="modal-panel card flex max-h-[100dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-b-none sm:max-h-[88dvh] sm:rounded-[18px]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center border-b border-[color:var(--color-line)] px-4 py-3.5">
              <h2 id="profile-edit-title" className="flex-1 text-sm font-semibold">{t('แก้ไขโปรไฟล์')}</h2>
              <button type="button" onClick={close} aria-label={t('ปิด')} className="rounded-full p-1.5 text-ink-soft hover:bg-brand-50">
                <X size={18} />
              </button>
            </header>

            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-4 flex items-center gap-3">
                  {previewUrl || avatarUrl ? (
                    <Avatar
                      name={displayName}
                      src={previewUrl ?? avatarUrl}
                      size={64}
                      className="ring-4 ring-brand-50"
                    />
                  ) : (
                    <div className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                      <UserRound size={26} />
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="profile-avatar-upload"
                      className="inline-flex cursor-pointer rounded-full bg-brand-50 px-3.5 py-2 text-xs font-medium text-brand-700 hover:bg-brand-100"
                    >
                      {t('เปลี่ยนรูปโปรไฟล์')}
                    </label>
                    <input
                      id="profile-avatar-upload"
                      type="file"
                      accept={AVATAR_TYPES.join(',')}
                      onChange={selectAvatar}
                      className="sr-only"
                    />
                    <p className="mt-1 text-[11px] text-ink-soft">{t('รูปโปรไฟล์ต้องมีขนาดไม่เกิน 2 MB')}</p>
                  </div>
                </div>

                <label htmlFor="profile-display-name" className="mb-1.5 block text-sm font-medium">
                  {t('ชื่อที่แสดง')}
                </label>
                <input
                  id="profile-display-name"
                  value={displayName}
                  onChange={(event) => { setDisplayName(event.target.value); setNotice(null); setError(null); }}
                  maxLength={DISPLAY_NAME_MAX}
                  className="input"
                />
                <p className="mt-1.5 text-[11px] text-ink-soft">
                  {t('คนอื่นเห็นชื่อนี้ · {count}/{max}', { count: displayName.length, max: DISPLAY_NAME_MAX })}
                </p>

                <label htmlFor="profile-username" className="mb-1.5 mt-3.5 block text-sm font-medium">
                  {t('ชื่อผู้ใช้')}
                </label>
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-sm text-ink-soft">@</span>
                  <input
                    id="profile-username"
                    value={username}
                    onChange={(event) => { setUsername(event.target.value.toLowerCase()); setNotice(null); setError(null); }}
                    maxLength={20}
                    className="input"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-soft">
                  {t('เป็นลิงก์โปรไฟล์ของคุณ เปลี่ยนได้ 15 วันครั้ง')}
                </p>

                <label htmlFor="profile-bio" className="mb-1.5 mt-3.5 block text-sm font-medium">
                  {t('แนะนำตัว')}
                </label>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(event) => { setBio(event.target.value); setNotice(null); }}
                  maxLength={BIO_MAX}
                  rows={3}
                  placeholder={t('เรียนอะไร สนใจอะไร ติวให้ใครได้บ้าง...')}
                  className="input resize-none"
                />
                <p className="mt-1 text-right text-[11px] text-ink-soft">{bio.length}/{BIO_MAX}</p>

                <p className="mt-2 rounded-2xl bg-[color:var(--color-canvas)] px-3.5 py-3 text-[11px] leading-relaxed text-ink-soft">
                  {t('role คณะ และชั้นปีมาจากบัญชี มธ. โดยอัตโนมัติและแก้ไขเองไม่ได้')}
                </p>

                {error ? <p role="alert" className="mt-2 text-xs text-red-600">{error}</p> : null}
                {notice ? <p role="status" className="mt-2 text-xs text-ink-soft">{notice}</p> : null}
              </div>

              <footer className="flex justify-end gap-2 border-t border-[color:var(--color-line)] px-4 py-3">
                <button type="button" onClick={close} className="btn-outline px-4 py-2 text-sm">{t('ยกเลิก')}</button>
                <button
                  type="submit"
                  disabled={!changed || saving}
                  className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? t('กำลังบันทึก...') : t('บันทึก')}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
