import { useState } from "react";
import type { BroadcastSummary } from "../_types/broadCast.types";
import Pagination from "./Pagination";

interface ClientProjectHistoryProps {
    broadcasts: BroadcastSummary[];
}

function ClientProjectHistory({ broadcasts }: ClientProjectHistoryProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const sorted = [...broadcasts].sort(
        (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sorted.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (broadcasts.length === 0) {
        return (
            <div className="bg-surface-elevated/20 border border-border-default rounded-modal p-6 md:p-8">
                <h2 className="text-lg font-bold text-text-primary mb-2">Project Portfolio</h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                    This client has no completed projects on record yet.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
                    No public project history
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Project Portfolio</h2>
                <span className="text-caption-dense font-bold text-text-tertiary uppercase tracking-wider bg-surface-elevated/40 px-3 py-1.5 rounded-full border border-border-subtle/50">
                    {broadcasts.length} Project{broadcasts.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-brand-primary/40 via-brand-primary/20 to-transparent" />

                <div className="space-y-5">
                    {currentItems.map((broadcast) => (
                        <div
                            key={broadcast.id}
                            className="relative pl-12 group"
                        >
                            {/* Timeline dot */}
                            <div className="absolute left-2.5 top-2 h-3.5 w-3.5 rounded-full border-2 border-brand-primary/60 bg-surface-background group-hover:border-brand-success group-hover:scale-110 transition-all duration-200">
                                <div className="absolute inset-1 rounded-full bg-brand-primary/40 group-hover:bg-brand-success/60 transition-colors duration-200" />
                            </div>

                            {/* Card */}
                            <div className="bg-surface-elevated/20 border border-border-default rounded-card p-5 hover:border-border-subtle/60 hover:bg-surface-elevated/30 transition-all duration-200">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-text-primary font-bold text-sm leading-snug truncate">
                                            {broadcast.title}
                                        </h3>
                                        <p className="text-caption-dense font-bold text-text-tertiary uppercase tracking-wider mt-1.5">
                                            {new Date(
                                                broadcast.createdAt
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-caption-dense font-bold px-2.5 py-1 rounded-interactive bg-surface-background text-text-secondary border border-border-default uppercase tracking-wider">
                                        {broadcast.type}
                                    </span>
                                </div>

                                {broadcast.description && (
                                    <p className="text-text-secondary text-xs mt-3 leading-relaxed line-clamp-2">
                                        {broadcast.description}
                                    </p>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px]">
                                    {broadcast.location && (
                                        <span className="inline-flex items-center gap-1.5 text-text-tertiary font-medium">
                                            <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                            {broadcast.location}
                                        </span>
                                    )}
                                    {broadcast.status && (
                                        <span className="inline-flex items-center gap-1.5 text-brand-success font-bold uppercase">
                                            <span className="h-1.5 w-1.5 rounded-full bg-status-active" />
                                            {broadcast.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Pagination
                postsPerPage={itemsPerPage}
                totalPosts={broadcasts.length}
                paginate={paginate}
                currentPage={currentPage}
            />
        </div>
    );
}

export default ClientProjectHistory;
