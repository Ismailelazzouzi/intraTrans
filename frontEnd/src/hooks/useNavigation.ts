import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
    const navigate = useNavigate();
    
    const goToLogin = () => {
        navigate('/login');
    };
    const goToRegister = () => {
        navigate('/register');
    };
    const goToDashboard = () => {
        navigate('/dashboard');
    };
    const goToHome = () => {
        navigate('/');
    };
    const goToProfile = (userId?: string) => {
        if (userId) {
            navigate(`/profile?id=${userId}`);
        } else {
            navigate('/profile');
        }
    };
    return {
        goToLogin,
        goToRegister,
        goToHome,
        goToDashboard,
        goToProfile
    };
};

