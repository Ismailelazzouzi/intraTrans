import Button from "./Button";
import { USER_TYPE_STYLES } from "../_styles/tokens";

function AdminUserItem({ owner , removeProvider , deleteUser , makeAdmin ,onReview, ...thisUser }) {
    if (thisUser.id === owner.id)
        return null;
    const style = USER_TYPE_STYLES[thisUser.type] || USER_TYPE_STYLES.ADMIN;
    return (
        <div className="bg-surface-overlay border border-border-default p-4 rounded-panel flex items-center justify-between hover:bg-surface-elevated/40 transition-colors">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-primary text-xs font-bold">
                    {thisUser.firstName?.[0]?.toUpperCase()}{thisUser.lastName?.[0]?.toUpperCase()}
                </div>
                
                <div className="flex flex-col">
                    <h3 className="text-text-primary font-medium text-sm capitalize">
                        {thisUser.firstName} {thisUser.lastName}
                    </h3>
                    <p className="text-text-tertiary text-xs">{thisUser.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <span className={`px-2 py-1 rounded-md text-caption-dense font-bold border ${style.bg} ${style.border} ${style.text} ${style.animate || ''}`}>
                    {style.label}
                </span>

                <div className="flex items-center gap-3">
                    {thisUser.type === 'PENDING' && (
                        <Button 
                            label="REVIEW REQUEST" 
                            variant="primary" 
                            disabled={false}
                            onClick={() => onReview(thisUser.id)} 
                        />
                    )}
                    {
                        thisUser.type === 'PROVIDER' && (
                            <Button 
                                label="REMOVE PROVIDER" 
                                variant="primary" 
                                disabled={false}
                                onClick={() => removeProvider(thisUser)}
                            />
                        )
                    }
                    {
                        owner.type === 'ROOT' && thisUser.type !== 'ADMIN' && thisUser.type !== 'PENDING' && (
                            <Button 
                                label="MAKE ADMIN" 
                                variant="primary" 
                                disabled={false}
                                onClick={() => makeAdmin(thisUser)} 
                            />
                        )
                    }
                    {
                        owner.type === 'ADMIN' && !(thisUser.type === 'ADMIN' || thisUser.type === 'ROOT') && (
                            <Button disabled={false} label="DELETE" variant="primary" onClick={() => deleteUser(thisUser)}/>
                        )
                    }
                    {
                        owner.type === 'ROOT' && (
                            <Button disabled={false} label="DELETE" variant="primary" onClick={() => deleteUser(thisUser)}/>
                        )
                    }
                </div>
            </div>
        </div>
    );
}

export default AdminUserItem;