import Card from "./Card";

interface FeatureCardProps {
	title: string;
	description: string;
    icon: any;
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
    return (
        <Card>
            <img src={icon} alt={title} className="w-12 h-12 mb-4"/>
            <h3 className="text-xl font-bold text-text-primary">{title}</h3>
            <p className="text-text-secondary">{description}</p>
        </Card>
    );
}