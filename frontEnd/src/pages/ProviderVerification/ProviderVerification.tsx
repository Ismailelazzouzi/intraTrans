import Button from "../../components/Button"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as z from "zod";
import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";

const initialState = {
    profession: "",
    description: "",
    image1: null,
    image2: null,
};

const interactionStatus = {
    profession: false,
    description: false,
    image1: false,
    image2: false
};

function ProviderVerification() {
    const { refreshUser, user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialState);
    const [Loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const providerSchema = z.object({
        description: z.string().min(50, "description must be at least 50 characters"),
        image1: z.any().refine((file) => file !== null, "ID image is required"),
        image2: z.any().refine((file) => file !== null, "License image is required"),
        profession: z.string().min(1, "Please select a profession"),
    })
    const validation = providerSchema.safeParse(formData);
    const isInvalid = !validation.success;
    const [touched, setTouched] = useState(interactionStatus);
    

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        const finalValue = type === "file" ? files[0] : value;

        if (type === "file" && files && files[0]) {
            const file = files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes

            if (file.size > maxSize) {
                alert("File is too large! Please select an image under 5MB.");
                e.target.value = ""; 
                return;
            }

            const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
            if (!ALLOWED_TYPES.includes(file.type)) {
                alert('Only JPEG, PNG, and WebP files are allowed');
                e.target.value = "";
                return;
            }

            setFormData((prev) => ({
                ...prev,
                [name]: file,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: finalValue,
            }));
        }


        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }));
    };
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        if (isInvalid){
            setLoading(false);
            return;
        }
        const data = new FormData();
        data.append('profession', formData.profession);
        data.append('description', formData.description);
        data.append('image1', formData.image1);
        data.append('image2', formData.image2);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/provider/apply`, {
                method: 'POST',
                body: data,
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || `Request failed (${response.status})`);
            } else {
                await refreshUser();
                navigate('/dashboard');
            }
        } catch (error) {
            console.error("Network Error: ", error);
            setError("Network error. Please try again.");
        }
        setLoading(false);
    }
    useEffect(() => {
    if (!isLoading && user) {
            if (user.type === "PENDING" || user.type === "PROVIDER") {
                navigate("/dashboard", { replace: true });
            }
        }
    }, [user, isLoading, navigate]);
    return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] w-full p-4">
        <form onSubmit={handleSubmit} className="bg-surface-elevated/50 border border-brand-primary/20 p-10 rounded-card w-full max-w-2xl flex flex-col gap-6">
            <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-text-primary tracking-tighter">Become a provider</h2>
                <p className="text-text-secondary mt-2">Enter your details to Start Working At THE HIVE</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="relative cursor-pointer">
                    <input onChange={handleChange} required type="radio" name="profession" value="PLUMBER" className="peer hidden" />
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10">
                        <span className="font-semibold text-sm">Plumber</span>
                    </div>
                </label>
                <label className="relative cursor-pointer">
                    <input onChange={handleChange} required type="radio" name="profession" value="ELECTRICIAN" className="peer hidden" />
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10">
                        <span className="font-semibold text-sm">Electritician</span>
                    </div>
                </label>
                <label className="relative cursor-pointer">
                    <input onChange={handleChange} required type="radio" name="profession" value="CARPENTER" className="peer hidden" />
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10">
                        <span className="font-semibold text-sm">Carpenter</span>
                    </div>
                </label>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-text-primary font-medium ml-1">Professional Description</label>
                <textarea 
                    onChange={handleChange}
                    required
                    name="description"
                    placeholder="Describe your skills, tools, and how you can help homeowners..."
                    className="w-full bg-surface-panel/50 border border-border-subtle rounded-panel p-4 text-text-primary focus:outline-none focus:border-brand-primary transition-colors resize-none"
                    rows={4}
                />
                {touched.description && !validation.success && <span className="text-red-500 text-xs">{validation.error.format().description?._errors[0]}</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-text-primary font-medium ml-1">ID Verification</label>
                    <input 
                        onChange={handleChange}
                        required
                        accept="image/jpeg,image/png,image/webp"
                        type="file" 
                        name="image1"
                        className="block w-full text-sm text-text-secondary
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-brand-primary/10 file:text-brand-primary
                            hover:file:bg-brand-primary/20"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-text-primary font-medium ml-1">Professional Liscence</label>
                    <input 
                        onChange={handleChange}
                        required
                        accept="image/jpeg,image/png,image/webp"
                        type="file" 
                        name="image2"
                        className="block w-full text-sm text-text-secondary
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-brand-primary/10 file:text-brand-primary
                            hover:file:bg-brand-primary/20"
                    />
                </div>
            </div>
            {error && (
                <div className="mb-4 px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
                    {error}
                </div>
            )}
            <Button label="SUBMIT REQUEST" variant="primary" disabled={isInvalid || Loading}/>
        </form>
    </div>
  )
}

export default ProviderVerification
