import MyBroadcasts from "../../components/MyBroadcasts";
import ClientProjectHistory from "../../components/ClientProjectHistory";
import type { User } from "../../_types/user.types";

interface ClientProfileProps {
    user: User;
    isOwner: boolean;
}

function ClientProfile({ user, isOwner }: ClientProfileProps) {
    if (!isOwner) {
        return (
            <div className="space-y-6">
                <ClientProjectHistory broadcasts={user.broadcastsCreated ?? []} />
            </div>
        );
    }
    return (
        <div>
            <MyBroadcasts />
        </div>
    );
}

export default ClientProfile;
