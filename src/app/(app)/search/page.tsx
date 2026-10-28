import { searchPosts, searchPeople, getFeed, getSubjects, getFaculties, } from '@/lib/data';
import type { PostTag, FeedSort } from '@/lib/types';
import { FeedList } from '@/components/FeedList';
import { getT } from '@/lib/i18n/server';
import Link from 'next/link';
import { CourseDropdown } from '@/components/CourseDropdown';
import { FacultyDropdown } from '@/components/FacultyDropdown';

export const dynamic = 'force-dynamic';

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
    type?: string | string[];
    course?: string | string[];
    faculty?: string | string[];
  }>;
};

const categories = [
  { label: 'ทั้งหมด', tag: 'all', icon: '▦', color: 'bg-amber-100 text-amber-800' },
  { label: 'ชีท', tag: 'sheet', icon: '▤', color: 'bg-sky-50 text-sky-700' },
  { label: 'หาเพื่อนติว', tag: 'studybuddy', icon: '♧', color: 'bg-emerald-50 text-emerald-700' },
  { label: 'ถาม-ตอบ', tag: 'qa', icon: '?', color: 'bg-orange-50 text-orange-700' },
  { label: 'โพล', tag: 'poll', icon: '♧', color: 'bg-pink-50 text-pink-700' },
  { label: 'ประกาศ', tag: 'announce', icon: '📢', color: 'bg-violet-50 text-violet-700' },
  { label: 'ทั่วไป', tag: 'general', icon: '◯', color: 'bg-neutral-100 text-neutral-700' },
  { label: 'รายวิชา', tag: 'courses', icon: '📚', color: 'bg-indigo-50 text-indigo-700' },
  { label: 'คณะ', tag: 'faculties', icon: '🏛️', color: 'bg-purple-50 text-purple-700' },
];

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;

  const typeValue = params.type;
  const courseValue = params.course;
  const facultyValue = params.faculty;

  const selectedType = (
    Array.isArray(typeValue) ? typeValue[0] : typeValue ?? 'all'
  ).trim();

  const selectedCourse = (
    Array.isArray(courseValue) ? courseValue[0] : courseValue ?? ''
  ).trim();

  const selectedFaculty = (
    Array.isArray(facultyValue) ? facultyValue[0] : facultyValue ?? ''
  ).trim();

  const [subjects, faculties] = await Promise.all([
    getSubjects(),
    getFaculties(),
  ]);

  const value = params.q;
  const tagValue = params.tag;

  const query = (
    Array.isArray(value) ? value[0] : value ?? ''
  ).trim();

  const selectedTag = (
    Array.isArray(tagValue) ? tagValue[0] : tagValue ?? ''
  ).trim();

  const validTags: PostTag[] = [
    'sheet',
    'studybuddy',
    'qa',
    'poll',
    'announce',
    'general',
  ];

  const tag = validTags.includes(selectedTag as PostTag)
    ? (selectedTag as PostTag)
    : null;

  const normalizedQuery = query.toLowerCase();

  const matchingSubjects = query
    ? subjects.filter((subject) =>
      `${subject.code} ${subject.name_th}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
    : [];


  const matchingFaculties = query
    ? faculties.filter((faculty) =>
      Object.values(faculty).some(
        (value) =>
          typeof value === 'string' &&
          value.toLowerCase().includes(normalizedQuery)
      )
    )
    : selectedFaculty
      ? faculties.filter((faculty) => faculty.id === selectedFaculty)
      : [];

  const displayedSubjects = query
    ? matchingSubjects
    : subjects;

  const displayedFaculties = query
    ? matchingFaculties
    : faculties;

  const matchingSubjectCodes =
    selectedType === 'courses' && selectedCourse
      ? [selectedCourse]
      : matchingSubjects.map((subject) => subject.code);

  const [textPosts, people] = await Promise.all([
    query ? searchPosts(query) : Promise.resolve([]),
    query ? searchPeople(query) : Promise.resolve([]),
  ]);

  const subjectPosts = matchingSubjectCodes.length > 0
    ? await Promise.all(
      matchingSubjectCodes.map((code) =>
        getFeed({
          tag: null,
          subject: code,
          group: null,
          faculty: null,
          scope: 'all',
          sort: 'new',
          limit: 20,
          offset: 0,
        })
      )
    )
    : [];
  const matchingFacultyIds =
    selectedType === 'faculties' && selectedFaculty
      ? [selectedFaculty]
      : matchingFaculties.map((faculty) => faculty.id);

  const facultyPosts = matchingFacultyIds.length > 0
    ? await Promise.all(
      matchingFacultyIds.map((facultyId) =>
        getFeed({
          tag: null,
          subject: null,
          group: null,
          faculty: facultyId,
          scope: 'all',
          sort: 'new',
          limit: 20,
          offset: 0,
        })
      )
    )
    : [];

  const categoryPosts =
    !query && selectedType !== 'courses' && selectedType !== 'faculties'
      ? await getFeed({
        tag,
        subject: null,
        group: null,
        faculty: null,
        scope: 'all',
        sort: 'new',
        limit: 20,
        offset: 0,
      })
      : [];

  const posts = Array.from(
    new Map(
      [
        ...textPosts,
        ...subjectPosts.flat(),
        ...facultyPosts.flat(),
        ...categoryPosts,
      ].map((post) => [post.id, post])
    ).values()
  );

  const t = await getT();

  return (
    <main className="mx-auto w-full max-w-[720px] space-y-4 px-4 py-6">
      {/* Search category pills */}
      <nav
        className="flex flex-wrap items-center gap-2"
        aria-label="หมวดหมู่การค้นหา"
      >
        {categories.map((category) => (
          <Link
            key={category.tag}
            href={{
              pathname: '/search',
              query: {
                ...(query ? { q: query } : {}),
                ...(category.tag === 'courses' || category.tag === 'faculties'
                  ? { type: category.tag }
                  : category.tag !== 'all'
                    ? { tag: category.tag }
                    : {}),
              },
            }}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${(
              category.tag === 'all'
                ? selectedType === 'all' && !selectedTag
                : category.tag === 'courses' || category.tag === 'faculties'
                  ? selectedType === category.tag
                  : selectedTag === category.tag
            )
              ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-neutral-900'
              : `${category.color} hover:opacity-80`
              }`}
          >
            <span aria-hidden="true">{category.icon}</span>
            {t(category.label)}
          </Link>
        ))}
      </nav>

      {!query && !selectedTag && selectedType === 'all' ? (
        <section className="flex min-h-[202px] flex-col items-center justify-center rounded-[20px] border border-[#eee2d8] bg-white px-6 py-10 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a8a29e"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <h1
            className="mt-3 text-base font-bold"
            style={{ color: 'var(--color-ink)' }}
          >
            {t('ค้นหาอะไรดี?')}
          </h1>

          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {t('พิมพ์รหัสวิชา ชื่อชีท ชื่อเพื่อน หรือเลือกแท็กด้านบนเพื่อดูได้ทั้งหมด')}
          </p>

          <form action="/search" method="GET" className="mt-5 w-full max-w-md">
            <div className="flex items-center gap-3 rounded-xl border border-[#eee2d8] bg-white px-4 py-3 transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 dark:border-neutral-600 dark:bg-neutral-900 dark:focus-within:border-amber-400 dark:focus-within:ring-amber-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-neutral-500"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              <input
                type="search"
                name="q"
                placeholder={t('ค้นหากระทู้, ชีท, คน, วิชา, หรือแท็ก...')}
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--color-ink)' }}
              />
            </div>
          </form>
        </section>
      ) : (
        <>
          <p className="pt-1 text-sm text-ink-soft">
            {query
              ? t('ผลการค้นหาสำหรับ: {q}', { q: query })
              : selectedTag
                ? t(categories.find((c) => c.tag === selectedTag)?.label ?? 'โพสต์')
                : t('โพสต์ล่าสุด')}
          </p>

          {selectedType === 'courses' && (
            <CourseDropdown
              subjects={subjects}
              selectedCourse={selectedCourse}
            />
          )}

          {selectedType !== 'courses' &&
            matchingSubjects.map((subject) => (
              <Link
                key={subject.code}
                href={{
                  pathname: '/search',
                  query: {
                    type: 'courses',
                    course: subject.code,
                  },
                }}
                className="flex gap-4 border-b border-[#eee2d8] py-3 last:border-b-0 hover:bg-amber-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                <span className="shrink-0 font-semibold text-amber-700">
                  {subject.code}
                </span>

                <span className="text-neutral-800 dark:text-neutral-200">
                  {subject.name_th}
                </span>
              </Link>
            ))}

          <div className="space-y-3">
            {selectedType === 'faculties' && (
              <FacultyDropdown
                faculties={faculties}
                selectedFaculty={selectedFaculty}
              />
            )}

            {selectedType !== 'faculties' &&
              matchingFaculties.map((faculty) => (
                <Link
                  key={faculty.id}
                  href={{
                    pathname: '/search',
                    query: {
                      type: 'faculties',
                      faculty: faculty.id,
                    },
                  }}
                  className="flex items-center gap-3 border-b border-[#eee2d8] py-3 last:border-b-0 hover:bg-purple-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {faculty.icon && (
                    <span aria-hidden="true">{faculty.icon}</span>
                  )}

                  <span className="text-neutral-800 dark:text-neutral-200">
                    {faculty.name_th}
                  </span>
                </Link>
              ))}
          </div>
          {/* People results */}
          {people.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold">ผู้คน</h2>

              {people.map((person) => (
                <Link
                  key={person.id}
                  href={`/u/${person.username}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#eee2d8] bg-white p-4 shadow-sm transition hover:border-amber-400"
                >
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800">
                      {(person.display_name || person.username || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-900">
                      {person.display_name || person.username}
                    </p>

                    <p className="truncate text-sm text-ink-soft">
                      @{person.username}
                    </p>

                    {person.faculty_name && (
                      <p className="truncate text-xs text-ink-soft">
                        {person.faculty_name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </section>
          )}

          {/* Post results */}
          {posts.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold">โพสต์</h2>

              <FeedList
                initial={posts}
                meId={null}
                isAdmin={false}
                emptyTitle="ไม่พบผลลัพธ์"
                emptyHint="ลองใช้คำค้นหาอื่น"
              />
            </section>
          )}

          {people.length === 0 && posts.length === 0 && matchingSubjects.length === 0 && matchingFaculties.length === 0 && (
            <section className="rounded-2xl border border-[#eee2d8] bg-white px-6 py-10 text-center shadow-sm">
              <h2 className="font-bold">ไม่พบผลลัพธ์</h2>
              <p className="mt-2 text-sm text-ink-soft">
                ลองใช้ชื่อผู้ใช้ ชื่อบุคคล หรือคำค้นหาอื่น
              </p>
            </section>
          )}
        </>
      )}
    </main >
  );
}
