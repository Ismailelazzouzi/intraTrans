import './App.css'

import toolbox from './assets/toolbox.png'
import Button from './components/Button'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import ProtectedRoute from './Auth/ProtectedRoute'
import PublicRoute from './Auth/PublicRoute'
import GoogleCallback from './Auth/GoogleCallback'

import { Routes, Route, Link } from 'react-router-dom';
import { useNavigation } from './hooks/useNavigation';
import { useAuth } from './hooks/useAuth'
import Dashboard from './pages/Dashboard/Dashboard'
import ProviderVerification from './pages/ProviderVerification/ProviderVerification'
import Profile from './pages/Profile/Profile'
import BroadCast from './pages/BroadCast/BroadCast'
import ChatLayout from './components/ChatLayout'
import TrustedRelationsManager from './pages/trustedRelations/trustedRelationManager'
import PrivacyPolicy from './pages/Privacy&Policy&termsOfService/PrivacyPolicy'
import TermsOfService from './pages/Privacy&Policy&termsOfService/TermsOfService'

function App() {
	const { goToHome , goToLogin, goToRegister, goToDashboard } = useNavigation();
	const { isAuthenticated, user, logout , isLoading} = useAuth();
	return (
    	<>
    		<div className='min-h-screen bg-surface-background flex flex-col'>
    		<div className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
				<header className='py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4'>
					<div onClick={isAuthenticated ? goToDashboard : goToHome} className='flex items-center gap-3 cursor-pointer'>
						<h1 className='text-xl md:text-2xl font-bold tracking-tighter text-brand-success'>THE HIVE</h1>
						<img src={toolbox} alt="toolboxIcon" className='h-8 w-8 md:h-10 md:w-10'/>
					</div>
					<nav className='flex items-center gap-3 md:gap-6 flex-wrap justify-center'>
						{ 	isLoading ? (
								<></>
							)

							: !isAuthenticated ? (
								<>
									<Button label="Login" variant="secondary" onClick={goToLogin} disabled={false}/>
									<Button label="Sign Up" variant="primary" onClick={goToRegister} disabled={false}/>
								</>
							) : (
								<>
									<div className="flex items-center gap-4">
                                		<span className="text-text-secondary">Welcome, {user?.firstName}</span>
										<Button label="Logout" variant="primary" onClick={logout} disabled={false}/>
									</div>
								</>
							)
						}
					</nav>
				</header>
				<Routes>
					<Route element={<PublicRoute />}>
						<Route path="/" element={<Home />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
					</Route>
						<Route path="/terms" element={<TermsOfService />} />
						<Route path="/privacy" element={<PrivacyPolicy />} />
						<Route path="/auth/callback" element={<GoogleCallback />} />
					<Route element={<ProtectedRoute />}>
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/profile" element={<Profile />} />
						<Route path="/profile/trustedRelations" element={<TrustedRelationsManager />} />
						<Route path="/broadCast" element={<BroadCast />} />
						<Route path="/chatroom" element={<ChatLayout />} />
						<Route path="/provider/providerRequest" element={<ProviderVerification />} />
					</Route>
					<Route path="*" element={<div className="text-2xl text-text-primary">404 - Page Not Found</div>} />
				</Routes>
    		</div>
			<div className='mt-10 bg-surface-background text-text-secondary text-sm py-4 text-center border-t border-surface-border flex flex-col md:flex-row justify-center items-center gap-2'>
				<p>&copy; 2026 The Hive. All rights reserved.</p>
				<Link to='/privacy' className="text-brand-primary hover:underline">
					Privacy Policy
                </Link>
				<Link to='/terms' className="text-brand-primary hover:underline">
					Terms of Service
                </Link>
			</div>
		</div>
    	</>
    )
}

export default App
