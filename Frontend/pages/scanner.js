import { useState } from 'react';
import { useRouter } from 'next/router';
import { Settings, Upload } from 'lucide-react';

export default function Scanner() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [scanMode, setScanMode] = useState('quick');

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleScan = async () => {
    if (!file) return;
    // ... rest of the scanning logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="flex justify-between items-center mb-12 animate-fadeIn">
        <h1 className="text-2xl font-bold">Malware Scanner</h1>
        <Settings 
          className="cursor-pointer hover:text-blue-400 transition-transform hover:scale-110"
          onClick={() => router.push('/settings')}
          size={24}
        />
      </div>

      <div className="space-y-6">
        <div className="border border-slate-700 rounded-lg p-6 bg-slate-800/30 backdrop-blur-md transition-all hover:border-blue-500/30 hover:translate-y-[-2px] hover:shadow-xl">
          <h2 className="text-lg mb-6">Select a file to upload and scan for malware</h2>
          
          <div className="flex justify-between items-center">
            <span>File</span>
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">
                {file ? file.name : 'Choose File'}
              </span>
              <label className="cursor-pointer transform transition-all hover:scale-110">
                <Upload size={24} className="hover:text-blue-400" />
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="border border-slate-700 rounded-lg p-6 bg-slate-800/30 backdrop-blur-md transition-all hover:border-blue-500/30 hover:translate-y-[-2px] hover:shadow-xl">
          <div className="flex justify-between items-center">
            <span>Scan Mode</span>
            <span className="text-slate-400">Quick (10-15 seconds)</span>
          </div>
        </div>

        <button 
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-lg font-semibold transform transition-all hover:translate-y-[-1px] hover:shadow-lg hover:from-blue-500 hover:to-blue-400 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          onClick={handleScan}
          disabled={!file}
        >
          Start Scan
        </button>
      </div>
    </div>
  );
}
