import { useState, useCallback, useEffect } from "react";
import type { User } from "../_types/user.types";

const API_URL = import.meta.env.VITE_API_URL;

// ─── State shape ──────────────────────────────────────────────────────────────

interface ProfileUpdateState {
    // Editable text fields
    firstName: string;
    lastName: string;
    phoneNumber: string;

    // Raw binary file captured from the <input type="file"> change event.
    // This is the payload for FormData/multipart transmission.
    imageFile: File | null;

    // Short-lived blob URL used for instant local preview (session-scoped).
    imagePreview: string | null;

    // Submission lifecycle
    isSubmitting: boolean;
    error: string | null;
    success: string | null;
}

interface UseProfileUpdateReturn extends ProfileUpdateState {
    setFirstName: (value: string) => void;
    setLastName: (value: string) => void;
    setPhoneNumber: (value: string) => void;
    handleImageChange: (file: File | null) => void;
    clearImagePreview: () => void;
    submitProfileUpdate: () => Promise<Partial<User> | null>;
    clearMessages: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfileUpdate(initialUser: User | null): UseProfileUpdateReturn {
    const [state, setState] = useState<ProfileUpdateState>({
        firstName: initialUser?.firstName || "",
        lastName: initialUser?.lastName || "",
        phoneNumber: initialUser?.phoneNumber || "",
        imageFile: null,
        imagePreview: null,
        isSubmitting: false,
        error: null,
        success: null,
    });

    // Sync form fields when the initialUser changes (e.g., after auth refresh)
    useEffect(() => {
        if (initialUser) {
            setState(prev => ({
                ...prev,
                firstName: initialUser.firstName || prev.firstName,
                lastName: initialUser.lastName || prev.lastName,
                phoneNumber: initialUser.phoneNumber || prev.phoneNumber,
            }));
        }
    }, [initialUser?.firstName, initialUser?.lastName, initialUser?.phoneNumber]);

    const setFirstName = useCallback((value: string) => {
        setState(prev => ({ ...prev, firstName: value, error: null, success: null }));
    }, []);

    const setLastName = useCallback((value: string) => {
        setState(prev => ({ ...prev, lastName: value, error: null, success: null }));
    }, []);

    const setPhoneNumber = useCallback((value: string) => {
        setState(prev => ({ ...prev, phoneNumber: value, error: null, success: null }));
    }, []);

    // ── File selection → separate binary + preview paths ─────────────────────

    const handleImageChange = useCallback((file: File | null) => {
        if (!file) {
            setState(prev => ({ ...prev, imageFile: null, imagePreview: null }));
            return;
        }

        const preview = URL.createObjectURL(file);
        setState(prev => ({ ...prev, imageFile: file, imagePreview: preview }));
    }, []);

    const clearImagePreview = useCallback(() => {
        setState(prev => {
            if (prev.imagePreview) {
                URL.revokeObjectURL(prev.imagePreview);
            }
            return { ...prev, imageFile: null, imagePreview: null };
        });
    }, []);

    const clearMessages = useCallback(() => {
        setState(prev => ({ ...prev, error: null, success: null }));
    }, []);

    // ── Submit: single server call, no localStorage ──────────────────────────

    const submitProfileUpdate = useCallback(async (): Promise<Partial<User> | null> => {
        setState(prev => ({ ...prev, isSubmitting: true, error: null, success: null }));

        const formData = new FormData();
        formData.append("firstName", state.firstName);
        formData.append("lastName", state.lastName);

        // Only append phoneNumber when non-empty. Clearing is not supported
        // until the backend validation regex accepts empty strings.
        if (state.phoneNumber) {
            formData.append("phoneNumber", state.phoneNumber);
        }

        if (state.imageFile) {
            formData.append("imageUrl", state.imageFile);
        }

        try {
            const response = await fetch(`${API_URL}/users/me`, {
                method: "PATCH",
                credentials: "include",
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                setState(prev => ({
                    ...prev,
                    isSubmitting: false,
                    success: "Profile updated successfully",
                    imageFile: null,
                    imagePreview: null,
                }));
                return result.data as Partial<User>;
            }

            // Server returned an error
            const errorData = await response.json().catch(() => ({}));
            setState(prev => ({
                ...prev,
                isSubmitting: false,
                error: errorData.message || "Failed to update profile",
            }));
            return null;
        } catch {
            setState(prev => ({
                ...prev,
                isSubmitting: false,
                error: "Network error. Please try again.",
            }));
            return null;
        }
    }, [state.firstName, state.lastName, state.phoneNumber, state.imageFile]);

    return {
        ...state,
        setFirstName,
        setLastName,
        setPhoneNumber,
        handleImageChange,
        clearImagePreview,
        submitProfileUpdate,
        clearMessages,
    };
}
