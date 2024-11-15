import { useState } from 'react';
import { useRouter } from 'next/router';
import { X, ChevronRight } from 'lucide-react';

export default function Settings() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    language: 'English',
    dataUsage: 'High Quality'
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="flex justify-between items-center mb-12 animate-fadeIn">
        <X 
          className="cursor-pointer hover:text-blue-400 transition-transform hover:scale-110"
          onClick={() => router.push('/scanner')}
          size={24}
        />
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="w-6"></div>
      </div>

      <div className="space-y-8">
        <section className="animate-slideIn">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700 transition-all hover:border-blue-500/30">
              <span>Email</span>
              <span className="text-slate-400">charles.eames@gmail.com</span>
            </div>
            <button 
              className="flex justify-between items-center w-full p-4 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700 transition-all hover:border-blue-500/30 hover:translate-y-[-1px]"
              onClick={() => router.push('/change-password')}
            >
              <span>Password</span>
              <ChevronRight size={24} className="text-slate-400" />
            </button>
          </div>
        </section>

        <section className="animate-slideIn animation-delay-100">
          <h2 className="text-xl font-semibold mb-4">App Settings</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700 transition-all hover:border-blue-500/30">
              <span>Dark Mode</span>
              <button 
                className={`w-12 h-6 rounded-full transition-all ${
                  settings.darkMode ? 'bg-blue-600' : 'bg-slate-700'
                }`}
                onClick={() => setSettings({
                  ...settings,
                  darkMode: !settings.darkMode
                })}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex justify-between items-center p-4 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700 transition-all hover:border-blue-500/30">
              <span>Notifications</span>
              <button 
                className={`w-12 h-6 rounded-full transition-all ${
                  settings.notifications ? 'bg-blue-600' : 'bg-slate-700'
                }`}
                onClick={() => setSettings({
                  ...settings,
                  notifications: !settings.notifications
                })}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex justify-between items-center p-4 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700 transition-all hover:border-blue-500/30">
              <span>Language</span>
              <span className="text-slate-400">{settings.language}</span>
            </div>

            <div className="flex justify-between items-center p-4 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700 transition-all hover:border-blue-500/30">
              <span>Data Usage</span>
              <span className="text-slate-400">{settings.dataUsage}</span>
            </div>
          </div>
        </section>

        <button 
          className="w-full bg-slate-800/50 p-4 rounded-lg mt-8 backdrop-blur-md transform transition-all hover:bg-slate-700/50 hover:translate-y-[-1px] hover:shadow-lg active:translate-y-[1px]"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
