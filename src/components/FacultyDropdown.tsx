'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type Faculty = {
    id: string;
    name_th: string;
    icon?: string | null;
};

type FacultyDropdownProps = {
    faculties: Faculty[];
    selectedFaculty?: string;
};

export function FacultyDropdown({
    faculties,
    selectedFaculty,
}: FacultyDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedItem = faculties.find(
        (faculty) => faculty.id === selectedFaculty
    );

    const filteredFaculties = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return faculties;

        return faculties.filter((faculty) =>
            `${faculty.id} ${faculty.name_th}`
                .toLowerCase()
                .includes(query)
        );
    }, [faculties, search]);

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen((previous) => !previous)}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-xl border border-[#eee2d8] bg-white px-4 py-3 text-left shadow-sm hover:border-purple-400 dark:border-neutral-700 dark:bg-neutral-900"
            >
                <span className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true">🏛️</span>

                    <span className="truncate">
                        {selectedItem ? (
                            <>
                                <span className="font-semibold text-purple-700">
                                    {selectedItem.id}
                                </span>
                                <span className="ml-2 text-neutral-700 dark:text-neutral-200">
                                    {selectedItem.name_th}
                                </span>
                            </>
                        ) : (
                            'Select a faculty'
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
                            placeholder="Search faculties by ID or name..."
                            autoFocus
                            className="w-full rounded-lg border border-[#eee2d8] bg-transparent px-3 py-2 text-sm outline-none focus:border-purple-400 dark:border-neutral-700"
                        />
                    </div>

                    <div className="max-h-72 overflow-y-auto p-1">
                        {filteredFaculties.length > 0 ? (
                            filteredFaculties.map((faculty) => (
                                <Link
                                    key={faculty.id}
                                    href={{
                                        pathname: '/search',
                                        query: {
                                            type: 'faculties',
                                            faculty: faculty.id,
                                        },
                                    }}
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-purple-50 dark:hover:bg-neutral-800 ${faculty.id === selectedFaculty
                                            ? 'bg-purple-50 dark:bg-neutral-800'
                                            : ''
                                        }`}
                                >
                                    {faculty.icon && (
                                        <span aria-hidden="true">{faculty.icon}</span>
                                    )}

                                    <span className="w-20 shrink-0 font-semibold text-purple-700">
                                        {faculty.id}
                                    </span>

                                    <span className="text-neutral-800 dark:text-neutral-200">
                                        {faculty.name_th}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <p className="px-3 py-6 text-center text-sm text-neutral-500">
                                No faculties found.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}