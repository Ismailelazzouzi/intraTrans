import Button from "../components/Button";
import { useNavigation } from '../hooks/useNavigation';

export default function Hero(){
    const {goToRegister} = useNavigation();
    return (
        <section className="mt-20 flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-text-primary tracking-tighter">Precision Meets <span className="text-brand-primary">Productivity.</span></h1>
            <p className="mt-10 mb-10 text-lg md:text-xl text-text-secondary max-w-2xl">The Hive is a decentralized marketplace for high-performance talent. Simple tools for complex projects. Everything you need, in one place.</p>
            <Button onClick={goToRegister} label="Get Started" variant="primary" disabled={false}/>
        </section>
    );   
}