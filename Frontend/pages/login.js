import { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import Head from 'next/head';
import { login } from '../utils/api';

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

    try {
      await login(credentials);
      router.push('/scanner');
    } catch (error) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Malware Scanner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="hover:text-gray-300 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="max-w-sm w-full mx-auto space-y-8">
            <h1 className="text-4xl font-bold animate-fadeIn">
              Welcome back
            </h1>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full bg-slate-800/30 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
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
                  className="w-full bg-slate-800/30 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
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
                className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}