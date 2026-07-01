import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useProfileUpdate } from "../../hooks/useProfileUpdate"
import AdminProfile from "./AdminProfile"
import ClientProfile from "./ClientProfile"
import ProviderProfie from "./ProviderProfie"
import EditableAvatar from "../../components/EditableAvatar"
import ProfileHeader from "../../components/ProfileHeader"
import Button from "../../components/Button"
import type { User } from "../../_types/user.types"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL
function Profile() {
    const { user: loggedInUser, refreshUser } = useAuth()
    const [searchParams] = useSearchParams()
    const profileId = searchParams.get("id")
    const navigate = useNavigate();


    const [viewedUser, setViewedUser] = useState<User | null>(null)
    const [loadingProfile, setLoadingProfile] = useState(false)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [showEditor, setShowEditor] = useState(false)
    const [serverImageUrl, setServerImageUrl] = useState<string | null>(null)
    const [serverPhoneNumber, setServerPhoneNumber] = useState<string | null>(null)
    const [phoneError, setPhoneError] = useState<string | null>(null)
    const phoneErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (phoneErrorTimer.current) {
                clearTimeout(phoneErrorTimer.current)
            }
        }
    }, [])


    const isOwner = !profileId || (loggedInUser?.id === profileId)

    const {
        firstName: editFirstName,
        lastName: editLastName,
        phoneNumber: editPhoneNumber,
        imagePreview,
        isSubmitting,
        error: updateError,
        success: updateSuccess,
        setFirstName,
        setLastName,
        setPhoneNumber,
        handleImageChange,
        submitProfileUpdate,
    } = useProfileUpdate(
        isOwner && loggedInUser
            ? { ...loggedInUser, imageUrl: loggedInUser.imageUrl ?? null }
            : null
    )

    const fetchPublicProfile = useCallback(async (userId: string) => {
        setLoadingProfile(true)
        setProfileError(null)
        // Reset stale server state from any previous profile view
        setServerImageUrl(null)
        setServerPhoneNumber(null)
        try {
            const res = await fetch(`${API_URL}/users/${userId}`, {
                credentials: "include",
            })
            if (!res.ok) throw new Error("Public profile endpoint unavailable")
            const result = await res.json()
            setViewedUser(result.data)
            // Always set these — the viewed user may have null values, which must
            // override any stale state inherited from a previously viewed profile.
            setServerImageUrl(result.data?.imageUrl ?? null)
            setServerPhoneNumber(result.data?.phoneNumber ?? null)
        } catch {
            setViewedUser(null)
            setProfileError("User profile data is not available at this time.")
        } finally {
            setLoadingProfile(false)
        }
    }, [])

    useEffect(() => {
        if (isOwner && loggedInUser) {
            setViewedUser(loggedInUser as User)
            setFirstName(loggedInUser.firstName)
            setLastName(loggedInUser.lastName)
            // Fetch full profile to populate imageUrl (GET /auth/me doesn't return it)
            fetchPublicProfile(loggedInUser.id)
        } else if (profileId) {
            fetchPublicProfile(profileId)
        }
    }, [profileId, loggedInUser, isOwner, setFirstName, setLastName])

    // Sync phoneNumber into the edit form once the full profile fetch resolves
    useEffect(() => {
        if (serverPhoneNumber) {
            setPhoneNumber(serverPhoneNumber)
        }
    }, [serverPhoneNumber, setPhoneNumber])

    const activeUser = isOwner && loggedInUser ? (loggedInUser as User) : viewedUser

    const handleSaveProfile = async () => {
        const updated = await submitProfileUpdate()
        if (updated) {
            if (updated.imageUrl && typeof updated.imageUrl === "string") {
                setServerImageUrl(updated.imageUrl)
            }
            if (updated.phoneNumber && typeof updated.phoneNumber === "string") {
                setServerPhoneNumber(updated.phoneNumber)
            }
            // Still refresh the auth context so firstName/lastName stay in sync
            if (refreshUser) refreshUser()
        }
        setShowEditor(false)
    }

    const editMode = isOwner && loggedInUser

    if (!loggedInUser && !loadingProfile) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-text-tertiary text-sm">Please log in to view profiles.</p>
            </div>
        )
    }

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-brand-success text-sm animate-pulse font-bold tracking-wider uppercase">
                    Loading profile...
                </p>
            </div>
        )
    }

    if (profileError) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-status-error text-sm">{profileError}</p>
            </div>
        )
    }

    if (!activeUser) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-text-tertiary text-sm font-bold">User not found.</p>
            </div>
        )
    }

    const userForSub = {
        ...activeUser,
        imageUrl: serverImageUrl ?? activeUser.imageUrl ?? null,
        phoneNumber: serverPhoneNumber ?? activeUser.phoneNumber ?? null,
    }

    const options: Record<string, React.ReactNode> = {
        ROOT: <AdminProfile user={userForSub} isOwner={isOwner} />,
        ADMIN: <AdminProfile user={userForSub} isOwner={isOwner} />,
        PROVIDER: <ProviderProfie user={userForSub} isOwner={isOwner} />,
        CLIENT: <ClientProfile user={userForSub} isOwner={isOwner} />,
        PENDING: <ClientProfile user={userForSub} isOwner={isOwner} />,
    }
    return (
        <div className="space-y-8">
            <ProfileHeader user={userForSub} isOwner={isOwner} />

            {/* Edit Profile toggle — only visible to the owner */}
            {editMode && !showEditor && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setShowEditor(true)}
                        className="px-6 py-3 rounded-panel font-bold text-xs uppercase tracking-widest transition-all bg-brand-primary/10 border border-brand-primary/20 text-brand-success hover:bg-brand-primary/20 hover:border-brand-primary/40 cursor-pointer"
                    >
                        ✎ Edit Profile
                    </button>
                    {(userForSub.type === "CLIENT" || userForSub.type === "PENDING") && isOwner && (
                        <button
                            onClick={() => navigate('trustedRelations')}
                            className="ml-4 px-6 py-3 rounded-panel font-bold text-xs uppercase tracking-widest transition-all bg-brand-primary/10 border border-brand-primary/20 text-brand-success hover:bg-brand-primary/20 hover:border-brand-primary/40 cursor-pointer"
                        >
                            Manage Trusted Realations
                        </button>
                    )}
                    {userForSub.type === "PROVIDER" && isOwner && (
                        <button
                            onClick={() => navigate('trustedRelations')}
                            className="ml-4 px-6 py-3 rounded-panel font-bold text-xs uppercase tracking-widest transition-all bg-brand-primary/10 border border-brand-primary/20 text-brand-success hover:bg-brand-primary/20 hover:border-brand-primary/40 cursor-pointer"
                        >
                            Manage trusted Realations
                        </button>
                    )}
                </div>
            )}
            
            {/* Editable Avatar + Name Section — only visible after toggling */}
            {editMode && showEditor && (
                <div className="bg-surface-elevated/20 border border-border-default rounded-modal p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-text-primary">Edit Profile</h2>
                        <button
                            onClick={() => setShowEditor(false)}
                            className="text-text-tertiary hover:text-text-primary transition-colors text-sm font-bold cursor-pointer"
                        >
                            ✕ Cancel
                        </button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <EditableAvatar
                            firstName={editFirstName}
                            imagePreview={imagePreview}
                            currentImage={userForSub.imageUrl ?? null}
                            isOwner={isOwner}
                            onFileSelect={handleImageChange}
                        />
                        <div className="flex-1 w-full space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-caption-dense font-bold text-text-tertiary uppercase tracking-wider mb-2 block">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editFirstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-surface-panel border border-border-subtle rounded-panel px-4 py-3 text-text-primary outline-none focus:border-brand-primary transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-caption-dense font-bold text-text-tertiary uppercase tracking-wider mb-2 block">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editLastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full bg-surface-panel border border-border-subtle rounded-panel px-4 py-3 text-text-primary outline-none focus:border-brand-primary transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-caption-dense font-bold text-text-tertiary uppercase tracking-wider mb-2 block">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={editPhoneNumber}
                                    onChange={(e) => {
                                        const raw = e.target.value
                                        const digitsOnly = raw.replace(/\D/g, '')
                                        if (raw !== digitsOnly) {
                                            setPhoneError('Only digits are allowed')
                                            if (phoneErrorTimer.current) clearTimeout(phoneErrorTimer.current)
                                            phoneErrorTimer.current = setTimeout(() => {
                                                setPhoneError(null)
                                                phoneErrorTimer.current = null
                                            }, 3000)
                                        }
                                        setPhoneNumber(digitsOnly)
                                    }}
                                    placeholder="0623456789"
                                    maxLength={10}
                                    className={`w-full bg-surface-panel border rounded-panel px-4 py-3 text-text-primary outline-none transition-all text-sm ${
                                        phoneError
                                            ? 'border-status-error focus:border-status-error'
                                            : 'border-border-subtle focus:border-brand-primary'
                                    }`}
                                />
                                {phoneError ? (
                                    <p className="text-status-error text-xs font-medium mt-1">{phoneError}</p>
                                ) : (
                                    <p className="text-caption-dense text-text-muted mt-1">10-digit format, e.g. 0623456789</p>
                                )}
                            </div>

                            {updateError && (
                                <p className="text-status-error text-xs font-medium">{updateError}</p>
                            )}
                            {updateSuccess && (
                                <p className="text-brand-success text-xs font-medium">{updateSuccess}</p>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    label={isSubmitting ? "SAVING..." : "SAVE CHANGES"}
                                    variant="primary"
                                    onClick={handleSaveProfile}
                                    disabled={
                                isSubmitting ||
                                (!editFirstName.trim() || !editLastName.trim()) ||
                                !!phoneError
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {options[activeUser.type] || (
                <div className="text-center py-12">
                    <p className="text-text-tertiary text-sm font-bold">Profile type not recognized.</p>
                </div>
            )}
        </div>
    )
}

export default Profile
