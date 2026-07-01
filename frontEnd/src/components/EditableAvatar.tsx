import { useRef, useEffect } from "react";
import { useProtectedImage } from "../hooks/useProtectedImage";

interface EditableAvatarProps {
    firstName: string;
    imagePreview: string | null;
    currentImage: string | null;
    isOwner: boolean;
    onFileSelect: (file: File | null) => void;
}

function EditableAvatar({ firstName, imagePreview, currentImage, isOwner, onFileSelect }: EditableAvatarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // When the user has selected a local file (imagePreview is a blob: URL),
    // skip the protected fetch and show the local preview instead.
    // Only fetch from the server when there's no pending local preview.
    const protectedImageUrl = useProtectedImage(imagePreview ? null : currentImage);

    // Revoke previous blob URL on cleanup to prevent memory leaks
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleClick = () => {
        if (isOwner) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onFileSelect(file);
        // Reset the input so the same file can be re-selected
        e.target.value = "";
    };

    const hasImage = imagePreview || currentImage;
    // Show local preview first, fall back to the fetched blob URL
    const imgSrc = imagePreview || protectedImageUrl;

    return (
        <div className="relative group">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
            <div
                onClick={handleClick}
                className={`h-32 w-32 rounded-card border-4 border-surface-background flex items-center justify-center text-4xl shadow-xl overflow-hidden ${
                    isOwner ? "cursor-pointer" : ""
                }`}
            >
                {hasImage && imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={firstName}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-text-primary font-black text-5xl select-none">
                        {firstName?.toUpperCase()?.[0] || "?"}
                    </span>
                )}
            </div>
            {isOwner && (
                <div
                    onClick={handleClick}
                    className="absolute inset-0 rounded-card bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                    <span className="text-text-primary text-xs font-bold uppercase tracking-wider">
                        {hasImage ? "Change" : "Upload"}
                    </span>
                </div>
            )}
        </div>
    );
}

export default EditableAvatar;
