import { useState } from 'react';
import { useRouter } from 'next/router';
import { Settings, Upload, AlertCircle } from 'lucide-react';
import Head from 'next/head';
import { scanFile } from '../utils/api';

export default function Scanner() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 32 * 1024 * 1024) { // 32MB limit
        setError('File size must be less than 32MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleScan = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await scanFile(file);
      router.push({
        pathname: '/results',
        query: { data: JSON.stringify(result) }
      });
    } catch (error) {
      setError(error.message || 'Failed to scan file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Scanner - Malware Scanner</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
        <div className="flex justify-between items-center mb-12 animate-fadeIn">
          <h1 className="text-2xl font-bold">Malware Scanner</h1>
          <Settings
            className="cursor-pointer hover:text-blue-400 transition-transform hover:scale-110"
            onClick={() => router.push('/settings')}
            size={24}
          />
        </div>
        
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-500 flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="border border-slate-700 rounded-lg p-6 bg-slate-800/30 backdrop-blur-md transition-all hover:border-blue-500/30 hover:translate-y-[-2px] hover:shadow-xl">
            <h2 className="text-lg mb-6">Select a file to scan for malware</h2>
            
            <div className="flex justify-between items-center">
              <span>File</span>
              <div className="flex items-center space-x-4">
                <span className="text-slate-400 max-w-[200px] truncate">
                  {file ? file.name : 'Choose File'}
                </span>
                <label className="cursor-pointer transform transition-all hover:scale-110">
                  <Upload size={24} className="hover:text-blue-400" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-lg font-semibold
                       transform transition-all hover:translate-y-[-1px] hover:shadow-lg
                       hover:from-blue-500 hover:to-blue-400 active:translate-y-[1px]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            onClick={handleScan}
            disabled={!file || loading}
          >
            {loading ? 'Scanning...' : 'Start Scan'}
          </button>
        </div>
      </div>
    </>
  );
}