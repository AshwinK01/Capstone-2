// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple validation
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      // Local authentication success
      router.push('/scanner');
    } else {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Malware Scanner</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
        <div className="flex justify-between items-center mb-12">
          <ChevronLeft
            className="cursor-pointer hover:text-gray-300 transition-colors"
            onClick={() => router.back()}
            size={24}
          />
        </div>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, Sir</h1>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-center text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                className="w-full bg-slate-800/50 rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={credentials.username}
                onChange={(e) => setCredentials({
                  ...credentials,
                  username: e.target.value
                })}
                disabled={loading}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-slate-800/50 rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={credentials.password}
                onChange={(e) => setCredentials({
                  ...credentials,
                  password: e.target.value
                })}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 rounded-lg p-4 font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
