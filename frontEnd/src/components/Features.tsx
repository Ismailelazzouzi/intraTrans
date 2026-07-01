import FeatureCard from "./FeatureCard";

import sheildIcon from '../assets/sheild.png'
import lighteningIcon from '../assets/lightening.png'
import networkIcon from '../assets/network.png'


const featureData = [
    {title: 'Verified Talent', description: 'Every craftsman in the Hive is licensed and goes through a rigorous peer-review process', icon: sheildIcon},
    {title: 'Fast communication', description: 'Instant messaging and live updates powered by high-performance system architecture', icon: lighteningIcon},
    {title: 'Global Network', description: 'Connect with top-tier masters from our growing local community.', icon: networkIcon}
];
export default function Features (){
    return (
        <section className="mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featureData.map((f) => <FeatureCard 
                key={f.title} 
                title={f.title}
                description={f.description}
                icon={f.icon} />)}
            </div>
        </section>
    );
}