
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '../constants';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      onLogin(email, password);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
           <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
               <ShieldCheck className="text-emerald-500" size={32} />
           </div>
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{APP_NAME} Portal</h1>
           <p className="text-slate-500 text-sm mt-2">Sign in to access your dashboard</p>
        </div>

        {/* Form */}
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-slate-800"
                            placeholder="user@qonnect.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-slate-800"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                >
                    {isLoading ? (
                        <span className="animate-pulse">Authenticating...</span>
                    ) : (
                        <>
                            Sign In <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>

            {/* Helper Text for Demo */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-center text-slate-400 uppercase font-bold mb-4">Default Credentials</p>
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-500">
                    <button onClick={() => { setEmail('admin@qonnect.com'); setPassword('admin123'); }} className="p-2 bg-slate-50 rounded hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> <b>Admin:</b> admin@qonnect.com / admin123
                    </button>
                </div>
            </div>
        </div>
      </div>
      <p className="mt-8 text-slate-600 text-sm">© {new Date().getFullYear()} {APP_NAME} Enterprise Solutions</p>
    </div>
  );
};

export default Login;
