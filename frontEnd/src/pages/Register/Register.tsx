import Button from "../../components/Button";

import { useNavigation } from '../../hooks/useNavigation';
import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import * as z from "zod"; 

import googleIcon from '../../assets/google.png'
import eyeIcon from '../../assets/eye.png'
import eyeCloseIcon from '../../assets/eyeClose.png'


const initialState = {
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
};

const interactionStatus = {
    firstName: false,
    lastName: false,
    userName: false,
    email: false,
    password: false,
    confirmPassword: false
};

const signUpSchema = z.object({
    firstName: z.string().min(3, "first name must be at least 3 characters"),
    lastName: z.string().min(3, "last name must be at least 3 characters"),
    userName: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please Enter a valid email"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain one uppercase letter")
        .regex(/[a-z]/, "Must contain one lowercase letter")
        .regex(/[0-9]/, "Must contain one number")
        .regex(/[\W_]/, "Must contain one special character"),
    confirmPassword: z
        .string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


export default function Register() {
    
    
    const { goToLogin } = useNavigation();
    const { loginUser } = useAuth();
    const [formData, setFormData] = useState(initialState);
    const validation = signUpSchema.safeParse(formData);
    const isInvalid = !validation.success;
    const [isLoading, setLoading] = useState(false)
    const [touched, setTouched] = useState(interactionStatus);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e:any){
        e.preventDefault();
        setLoading(true);
        if (isInvalid === true){
            setLoading(false);
            return ;
        }
        const {confirmPassword, ...registerData} = validation.data;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerData),
                credentials: "include"
            });
            const data = await response.json();
            if (response.ok)
            {
                loginUser(data.data.user);
                navigate('/dashboard');
            }
            else
                setError(data.message || 'Sign up failed');
        }catch (error) {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    }

    const handleChange = (e:any) => {
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

    return (
        <div className="flex min-h-[80vh] items-center justify-center pb-20">
            <form onSubmit={handleSubmit} className="bg-surface-elevated/50 border border-brand-primary/20 p-10 rounded-card w-full max-w-2xl flex flex-col gap-6">
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold text-text-primary tracking-tighter">Join Us</h2>
                    <p className="text-text-secondary mt-2">Enter your details to Join the Hive.</p>
                </div>
                {error && (
                    <div className="px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in text-center">
                        {error}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="firstName" className="text-brand-success text-sm font-medium">FIRST NAME</label>
                        <input 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            id="firstName"
                            className="bg-surface-panel border border-border-subtle p-3 rounded-interactive text-text-primary focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                            type="text" 
                            placeholder="First Name"
                        />
                        {touched.firstName && !validation.success && <span className="text-status-error text-xs">{validation.error.format().firstName?._errors[0]}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="lastName" className="text-brand-success text-sm font-medium">LAST NAME</label>
                        <input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            id="lastName"
                            className="bg-surface-panel border border-border-subtle p-3 rounded-interactive text-text-primary focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                            type="text" 
                            placeholder="Last Name"
                        />
                        {touched.lastName && !validation.success && <span className="text-status-error text-xs">{validation.error.format().lastName?._errors[0]}</span>}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="userName" className="text-brand-success text-sm font-medium">USERNAME</label>
                    <input 
                        name="userName"
                        value={formData.userName}
                        onChange={handleChange}
                        id="userName"
                        className="bg-surface-panel border border-border-subtle p-3 rounded-interactive text-text-primary focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                        type="text" 
                        placeholder="Username"
                    />
                    {touched.userName && !validation.success && <span className="text-status-error text-xs">{validation.error.format().userName?._errors[0]}</span>}
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-brand-success text-sm font-medium">EMAIL</label>
                    <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        id="email"
                        className="bg-surface-panel border border-border-subtle p-3 rounded-interactive text-text-primary focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                        type="text" 
                        placeholder="Email"
                    />
                    {touched.email && !validation.success && <span className="text-status-error text-xs">{validation.error.format().email?._errors[0]}</span>}
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-brand-success text-sm font-medium">Password</label>
                    <div className="relative w-full">
                        <input
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-surface-panel border border-border-subtle p-3 rounded-interactive text-text-primary focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                        />
                        <button onClick={() => setShowPassword(!showPassword)} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2" type="button">
                            {showPassword && <img className="w-6" src={eyeIcon}/>}
                            {!showPassword && <img className="w-6" src={eyeCloseIcon}/>}
                        </button>
                    </div>
                    {touched.password && !validation.success && <span className="text-status-error text-xs">{validation.error.format().password?._errors[0]}</span>}
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="confirmPassword" className="text-brand-success text-sm font-medium">Confirm Password</label>
                    <div className="relative w-full">
                        <input 
                            name="confirmPassword"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full bg-surface-panel border border-border-subtle p-3 rounded-interactive text-text-primary focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="••••••••"
                        />
                        <button onClick={() => setShowConfirm(!showConfirm)} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2" type="button">
                            {showConfirm && <img className="w-6" src={eyeIcon}/>}
                            {!showConfirm && <img className="w-6" src={eyeCloseIcon}/>}
                        </button>
                    </div>
                    {touched.confirmPassword && !validation.success && <span className="text-status-error text-xs">{validation.error.format().confirmPassword?._errors[0]}</span>}
                </div>
                <Button label={isLoading ? "submitting" : "Sign Up"} variant="primary" disabled={isInvalid || isLoading}/>
                <button onClick={handleGoogleLogin} type="button" className="cursor-pointer flex items-center justify-center gap-3 w-full bg-surface-panel border border-border-subtle text-text-primary py-3 px-6 rounded-interactive font-medium hover:bg-surface-elevated transition-all">
                    <img src={googleIcon} alt="Google" className="w-5 h-5"/>
                    Continue with Google       
                </button>
                <p className="text-center text-text-tertiary text-sm">
                    Already have an account? <span onClick={goToLogin} className="text-brand-primary cursor-pointer hover:underline">Log In</span>
                </p>
            </form>
        </div>
    );
}