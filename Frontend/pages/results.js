import { useRouter } from 'next/router';
import { ChevronLeft, AlertTriangle } from 'lucide-react';

export default function Results() {
  const router = useRouter();
  const results = router.query.data ? JSON.parse(router.query.data) : null;

  if (!results) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="flex items-center mb-12 animate-fadeIn">
        <ChevronLeft 
          className="cursor-pointer hover:text-blue-400 transition-transform hover:scale-110 mr-4"
          onClick={() => router.push('/scanner')}
          size={24}
        />
        <h1 className="text-2xl font-bold">Results for: {results.filename}</h1>
      </div>

      <div className="space-y-6">
        {results.malwareDetected && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 backdrop-blur-md animate-scaleIn">
            <div className="flex items-center space-x-2 text-red-500">
              <AlertTriangle size={24} className="animate-pulse" />
              <span className="font-semibold">Malware detected</span>
            </div>
            <p className="mt-2">{results.malwareType}</p>
          </div>
        )}

        <div className="space-y-4 animate-slideIn">
          <h2 className="text-xl font-semibold">Risk level</h2>
          <p className="text-red-500 font-semibold">{results.riskLevel}</p>
          
          <h2 className="text-xl font-semibold mt-6">Actions to take</h2>
          <button 
            className="w-full bg-slate-800/50 p-4 rounded-lg backdrop-blur-md transform transition-all hover:bg-slate-700/50 hover:translate-y-[-1px] hover:shadow-lg active:translate-y-[1px]"
            onClick={() => {/* Handle remove file */}}
          >
            Remove file
          </button>
          <button 
            className="w-full bg-slate-800/50 p-4 rounded-lg backdrop-blur-md transform transition-all hover:bg-slate-700/50 hover:translate-y-[-1px] hover:shadow-lg active:translate-y-[1px]"
            onClick={() => {/* Handle contact support */}}
          >
            Contact support
          </button>
          
          <button 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-lg transform transition-all hover:translate-y-[-1px] hover:shadow-lg hover:from-blue-500 hover:to-blue-400 active:translate-y-[1px] mt-6"
            onClick={() => router.push('/scanner')}
          >
            Start new scan
          </button>
        </div>
      </div>
    </div>
  );
}
