'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type Subject = {
  code: string;
  name_th: string;
};

type CourseDropdownProps = {
  subjects: Subject[];
  selectedCourse?: string;
};

export function CourseDropdown({
  subjects,
  selectedCourse,
}: CourseDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedSubject = subjects.find(
    (subject) => subject.code === selectedCourse
  );

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return subjects;

    return subjects.filter((subject) =>
      `${subject.code} ${subject.name_th}`
        .toLowerCase()
        .includes(query)
    );
  }, [subjects, search]);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-[#eee2d8] bg-white px-4 py-3 text-left shadow-sm hover:border-amber-400 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true">📚</span>

          <span className="truncate">
            {selectedSubject ? (
              <>
                <span className="font-semibold text-amber-700">
                  {selectedSubject.code}
                </span>
                <span className="ml-2 text-neutral-700 dark:text-neutral-200">
                  {selectedSubject.name_th}
                </span>
              </>
            ) : (
              'Select a course'
            )}
          </span>
        </span>

        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#eee2d8] bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <div className="border-b border-[#eee2d8] p-3 dark:border-neutral-700">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses by code or name..."
              autoFocus
              className="w-full rounded-lg border border-[#eee2d8] bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-neutral-700"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-1">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <Link
                  key={subject.code}
                  href={{
                    pathname: '/search',
                    query: {
                      type: 'courses',
                      course: subject.code,
                    },
                  }}
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-neutral-800 ${
                    subject.code === selectedCourse
                      ? 'bg-amber-50 dark:bg-neutral-800'
                      : ''
                  }`}
                >
                  <span className="w-20 shrink-0 font-semibold text-amber-700">
                    {subject.code}
                  </span>

                  <span className="text-neutral-800 dark:text-neutral-200">
                    {subject.name_th}
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-sm text-neutral-500">
                No courses found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}