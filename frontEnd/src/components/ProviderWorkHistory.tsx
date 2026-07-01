import { useState } from "react";
import type { ProviderWithHistory } from "../_types/user.types";
import Pagination from "./Pagination";

interface ProviderWorkHistoryProps {
    provider: ProviderWithHistory;
}

function ProviderWorkHistory({ provider }: ProviderWorkHistoryProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const responses = provider.broadcastResponses;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentResponses = responses.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="space-y-6">
            {/* Bio Card */}
            <div className="bg-surface-elevated/20 border border-border-default rounded-modal p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Provider Profile</h2>
                        {provider.profession && (
                            <p className="text-brand-success text-sm font-bold mt-1 uppercase tracking-wide">
                                {provider.profession}
                            </p>
                        )}
                    </div>
                    {provider.isVerified === "VERIFIED" && (
                        <span className="inline-flex items-center gap-1.5 shrink-0 text-caption-dense font-bold px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-success uppercase tracking-wider">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Verified
                        </span>
                    )}
                </div>

                {provider.description ? (
                    <p className="text-text-secondary text-sm leading-relaxed">
                        {provider.description}
                    </p>
                ) : (
                    <p className="text-text-tertiary text-sm italic">
                        No professional description provided.
                    </p>
                )}

                {provider.isVerified !== "VERIFIED" && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
                        <span className="h-1.5 w-1.5 rounded-full bg-status-pending" />
                        Verification pending
                    </div>
                )}
                
            </div>

            {/* Work History Section */}
            {responses.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-primary">Completed Assignments</h3>
                        <span className="text-caption-dense font-bold text-text-tertiary uppercase tracking-wider bg-surface-elevated/40 px-3 py-1.5 rounded-full border border-border-subtle/50">
                            {responses.length} Job{responses.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {currentResponses.map((response) => (
                            <div
                                key={response.id}
                                className="bg-surface-elevated/20 border border-border-default rounded-card p-5 hover:border-border-subtle/60 hover:bg-surface-elevated/30 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-text-primary font-bold text-sm leading-snug truncate">
                                            {response.broadcast.title}
                                        </h4>
                                        <p className="text-caption-dense font-bold text-text-tertiary uppercase tracking-wider mt-1.5">
                                            {new Date(
                                                response.broadcast.createdAt
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-brand-success font-bold text-sm">
                                            {Number(response.price).toLocaleString()} DH
                                        </p>
                                        {response.task && (
                                            <p className="text-caption-dense text-text-tertiary font-medium uppercase tracking-wider mt-0.5">
                                                {response.task}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {response.broadcast.description && (
                                    <p className="text-text-secondary text-xs mt-3 leading-relaxed line-clamp-2">
                                        {response.broadcast.description}
                                    </p>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px]">
                                    {response.broadcast.location && (
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
                                            {response.broadcast.location}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 text-brand-success font-bold uppercase">
                                        <span className="h-1.5 w-1.5 rounded-full bg-status-active" />
                                        Completed
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Pagination
                        postsPerPage={itemsPerPage}
                        totalPosts={responses.length}
                        paginate={paginate}
                        currentPage={currentPage}
                    />
                </div>
            )}

            {responses.length === 0 && provider.description && (
                <div className="bg-surface-elevated/20 border border-dashed border-border-default rounded-modal p-6 md:p-8 text-center">
                    <p className="text-text-tertiary text-sm font-medium">
                        No completed assignments to display yet.
                    </p>
                </div>
            )}
        </div>
    );
}

export default ProviderWorkHistory;
