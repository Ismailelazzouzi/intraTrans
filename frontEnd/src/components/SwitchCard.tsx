import Card from "./Card";
import Button from "./Button";
import toolbox from '../assets/toolbox.png'
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function SwitchCard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const states = {
        PENDING: {
            icon: <span className="text-brand-success text-xl animate-pulse">⏳</span>,
            title: "Application Pending",
            desc: "We are currently reviewing your documents. You will be notified once verified.",
            btnLabel: "UNDER REVIEW",
            action: () => {},
            disabled: true,
            variant: "secondary"
        },
        REJECTED: {
            icon: <span className="text-status-error text-xl">❌</span>,
            title: "Action Required",
            desc: "Your application was not approved. Please review your details and try again.",
            btnLabel: "RE-APPLY NOW",
            action: () => navigate('/provider/providerRequest'),
            disabled: false,
            variant: "primary"
        },
        PROVIDER: {
            icon: <img className="h-10 w-10" src={toolbox} alt="toolbox" />,
            title: "Provider Mode",
            desc: "Go to your provider Profile to manage your jobs.",
            btnLabel: "GO TO STUDIO",
            action: () => navigate('/profile'),
            disabled: false,
            variant: "primary"
        },
        DEFAULT: {
            icon: <img className="h-10 w-10" src={toolbox} alt="toolbox" />,
            title: "Are you a craftsman?",
            desc: "Become a provider at THE HIVE. Share your expertise and help homeowners.",
            btnLabel: "BECOME A PROVIDER",
            action: () => navigate('/provider/providerRequest'),
            disabled: false,
            variant: "primary"
        }
    };

    const content = states[user?.type as keyof typeof states] || states.DEFAULT;

    return (
        <Card>
            <div className="h-10 w-10 flex items-center justify-center">
                {content.icon}
            </div>
            <h2 className="text-xl font-bold text-text-primary text-center mt-4">
                {content.title}
            </h2>
            <p className="text-text-secondary text-center text-sm mt-2 mb-6 max-w-[220px]">
                {content.desc}
            </p>
            <Button 
                label={content.btnLabel} 
                variant={content.variant as any} 
                disabled={content.disabled} 
                onClick={content.action} 
            />
        </Card>
    );
}

export default SwitchCard;
