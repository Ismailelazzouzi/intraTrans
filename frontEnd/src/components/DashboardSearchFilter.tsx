import { INPUT_CLASSES } from "../_styles/tokens";

interface DashboardSearchFilterProps {
    search: string;
    onSearchChange: (value: string) => void;
    activeFilter: string;
    onFilterChange: (value: string) => void;
    professions: string[];
}

function DashboardSearchFilter({
    search,
    onSearchChange,
    activeFilter,
    onFilterChange,
    professions,
}: DashboardSearchFilterProps) {
    const chipBase = "px-4 py-2 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10 text-sm font-semibold";

    return (
        <div>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search providers by name, email, or profession..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={INPUT_CLASSES}
                />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <label className="relative cursor-pointer">
                    <input
                        onChange={() => onFilterChange("ALL")}
                        readOnly
                        checked={activeFilter === "ALL"}
                        type="radio"
                        name="professionFilter"
                        value="ALL"
                        className="peer hidden"
                    />
                    <div className={chipBase}>
                        ALL
                    </div>
                </label>
                {professions.map((profession) => (
                    <label key={profession} className="relative cursor-pointer">
                        <input
                            onChange={() => onFilterChange(profession)}
                            readOnly
                            checked={activeFilter === profession}
                            type="radio"
                            name="professionFilter"
                            value={profession}
                            className="peer hidden"
                        />
                        <div className={`${chipBase} uppercase tracking-wide`}>
                            {profession}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}

export default DashboardSearchFilter;
