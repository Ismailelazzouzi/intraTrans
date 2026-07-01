import Button from "../../components/Button";

import { useNavigation } from '../../hooks/useNavigation';
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import * as z from "zod"; 
import { useAuth } from "../../hooks/useAuth";

import googleIcon from '../../assets/google.png'
import eyeIcon from '../../assets/eye.png'
import eyeCloseIcon from '../../assets/eyeClose.png'

const loginSchema = z.object({
  email: z.string().email("please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain one uppercase letter")
    .regex(/[a-z]/, "Must contain one lowercase letter")
    .regex(/[0-9]/, "Must contain one number")
    .regex(/[\W_]/, "Must contain one special character"),
});

const interactionStatus = {
    email: false,
    password: false,
};

const initialState = {
    email: "",
    password: ""
};


export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState(initialState);
    const [touched, setTouched] = useState(interactionStatus);
    const { loginUser } = useAuth();
    const validation = loginSchema.safeParse(formData);
    const isInvalid = !validation.success;
    const [isLoading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate();


    async function handleSubmit(e: React.FormEvent){
        e.preventDefault();
        setLoading(true);
        if (isInvalid === true){
            setLoading(false);
            return ;
        }
        const loginData = validation.data;
        try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            loginUser(data.data.user);
            navigate("/dashboard");
        } else {
            setError(data.message || "Login failed");
        }
    } catch (error) {
            console.error("Connection error:", error);
            setError("Connection error. Please try again.");
        }
    setLoading(false);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }));
    };
    
    const handleGoogleLogin = () => {
        window.location.href = import.meta.env.VITE_GOOGLE_AUTH_URL;
    }

    const { goToRegister } = useNavigation();
    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <form onSubmit={handleSubmit} className="bg-surface-elevated/50 border border-brand-primary/20 p-10 rounded-card w-full max-w-md flex flex-col gap-6">
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold text-text-primary tracking-tighter">Welcome Back</h2>
                    <p className="text-text-secondary mt-2">Enter your details to access the Hive.</p>
                </div>
                {error && (
                    <div className="px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in text-center">
                        {error}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-brand-success text-sm font-medium">Email</label>
                    <input 
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-surface-panel border border-border-subtle p-3 rounded-interactive text-text-primary focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                        type="text" 
                        placeholder="Email"
                    />
                </div>
                {touched.email && !validation.success && <span className="text-status-error text-xs">{validation.error.format().email?._errors[0]}</span>}
                <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-brand-success text-sm font-medium">Password</label>
                    <div className="relative">
                    <input 
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="bg-surface-panel border border-border-subtle p-3 pr-15 rounded-interactive text-text-primary focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="cursor-pointer absolute right-1 top-1/2 -translate-y-1/2" type="button">
                        {showPassword && <img className="w-6" src={eyeIcon}/>}
                        {!showPassword && <img className="w-6" src={eyeCloseIcon}/>}
                    </button>
                    </div>
                    {touched.password && !validation.success && <span className="text-status-error text-xs">{validation.error.format().password?._errors[0]}</span>}
                </div>
                <Button label={isLoading ? "Logging In" : "Log In"} variant="primary" disabled={isInvalid}/>
                
                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-border-subtle"></div>
                    <span className="flex-shrink mx-4 text-text-tertiary text-sm">OR</span>
                    <div className="flex-grow border-t border-border-subtle"></div>
                </div>

                <button onClick={handleGoogleLogin} type="button" className="cursor-pointer flex items-center justify-center gap-3 w-full bg-surface-panel border border-border-subtle text-text-primary py-3 px-6 rounded-interactive font-medium hover:bg-surface-elevated transition-all">
                    <img src={googleIcon} alt="Google" className="w-5 h-5"/>
                    Continue with Google       
                </button>
                <p className="text-center text-text-tertiary text-sm">
                    Don't have an account? <span onClick={goToRegister} className="text-brand-primary cursor-pointer hover:underline">Register</span>
                </p>
            </form>
        </div>
    );
}