import type { User } from "../../_types/user.types";

interface AdminProfileProps {
    user: User;
    isOwner: boolean;
}

function AdminProfile({ user, isOwner }: AdminProfileProps) {
    if (!isOwner) {
        return (
            <div className="space-y-6">
                <div className="bg-surface-elevated/20 border border-border-default rounded-modal p-6 md:p-8">
                    <h2 className="text-lg font-bold text-text-primary mb-2">Administrator</h2>
                    <p className="text-text-secondary text-sm leading-relaxed">
                        {user.firstName} {user.lastName} is an administrator on The Hive.
                        Administrative actions are restricted to the account owner.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />
                        Administrator account
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-heading-section font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary text-sm mt-2">Manage platform users and settings.</p>
        </div>
    );
}

export default AdminProfile;
