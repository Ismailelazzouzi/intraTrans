import { useNavigate } from "react-router-dom";
import type { User } from "../_types/user.types";
import { useProtectedImage } from "../hooks/useProtectedImage";

interface ProfileHeaderProps {
    user: User;
    isOwner: boolean;
}

function ProfileHeader({ user, isOwner }: ProfileHeaderProps) {
    const navigate = useNavigate();
    const imageSrc = useProtectedImage(user.imageUrl);

    const handleProfileClick = () => {
        if (user?.id && !isOwner) {
            navigate(`/profile?id=${user.id}`);
        }
    };

    return (
        <div className="relative">
            <div className="h-48 w-full bg-gradient-to-r from-surface-elevated to-surface-panel rounded-b-3xl border-x border-b border-border-subtle" />
            <div className="max-w-5xl mx-auto px-8">
                <div className="flex flex-col md:flex-row items-end gap-6 -mt-12">
                    <div
                        onClick={handleProfileClick}
                        className={`h-32 w-32 rounded-card border-4 border-surface-background flex items-center justify-center text-4xl shadow-xl overflow-hidden ${
                            !isOwner ? "cursor-pointer hover:border-brand-primary/50 transition-colors" : ""
                        }`}
                    >
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-text-primary font-black text-5xl select-none">
                                {user.firstName?.toUpperCase()?.[0] ?? '?'}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 pb-2">
                        <div className="flex items-center gap-3">
                            <h1
                                onClick={handleProfileClick}
                                className={`text-3xl font-bold text-text-primary ${
                                    !isOwner ? "cursor-pointer hover:text-brand-success transition-colors" : ""
                                }`}
                            >
                                {user.firstName} {user.lastName}
                            </h1>
                            <span className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-success rounded-full text-xs font-bold tracking-widest uppercase">
                                {user.type}
                            </span>
                        </div>
                        <p className="text-text-secondary mt-1">{user.email}</p>
                        {user.phoneNumber && (
                            <p className="text-text-secondary text-sm mt-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                                {user.phoneNumber.replace(/(\d{2})(?=\d)/g, "$1 ")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfileHeader;
