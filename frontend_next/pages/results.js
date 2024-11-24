// import { useRouter } from 'next/router';
// import { ChevronLeft, AlertTriangle, Shield, ShieldCheck } from 'lucide-react';
// import Head from 'next/head';

// export default function Results() {
//   const router = useRouter();
//   const results = router.query.data ? JSON.parse(router.query.data) : null;

//   if (!results) {
//     router.push('/scanner');
//     return null;
//   }

//   return (
//     <>
//       <Head>
//         <title>Scan Results - Malware Scanner</title>
//       </Head>
//       <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
//         <div className="flex items-center mb-12 animate-fadeIn">
//           <ChevronLeft
//             className="cursor-pointer hover:text-blue-400 transition-transform hover:scale-110 mr-4"
//             onClick={() => router.push('/scanner')}
//             size={24}
//           />
//           <h1 className="text-2xl font-bold">Scan Results</h1>
//         </div>

//         <div className="space-y-6">
//           <div className="p-6 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700 animate-fadeIn">
//             <div className="flex items-center space-x-3 mb-4">
//               <span className="text-lg">File:</span>
//               <span className="text-slate-400">{results.filename}</span>
//             </div>
            
//             {results.malicious > 0 ? (
//               <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 backdrop-blur-md animate-scaleIn">
//                 <div className="flex items-center space-x-2 text-red-500">
//                   <AlertTriangle size={24} className="animate-pulse" />
//                   <span className="font-semibold">Threat Detected</span>
//                 </div>
//                 <p className="mt-2">This file may be harmful to your system.</p>
//               </div>
//             ) : (
//               <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-6 backdrop-blur-md animate-scaleIn">
//                 <div className="flex items-center space-x-2 text-green-500">
//                   <ShieldCheck size={24} />
//                   <span className="font-semibold">File is Safe</span>
//                 </div>
//                 <p className="mt-2">No threats were detected in this file.</p>
//               </div>
//             )}
//           </div>

//           <div className="space-y-4 animate-slideIn">
//             <h2 className="text-xl font-semibold">Scan Details</h2>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="p-4 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700">
//                 <div className="text-sm text-slate-400">Risk Level</div>
//                 <div className={`text-lg font-semibold ${
//                   results.riskLevel === 'Low' ? 'text-green-500' :
//                   results.riskLevel === 'Medium' ? 'text-yellow-500' :
//                   results.riskLevel === 'High' ? 'text-orange-500' :
//                   'text-red-500'
//                 }`}>
//                   {results.riskLevel}
//                 </div>
//               </div>
              
//               <div className="p-4 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700">
//                 <div className="text-sm text-slate-400">Detection Rate</div>
//                 <div className="text-lg font-semibold">
//                   {results.malicious} / {results.malicious + results.harmless}
//                 </div>
//               </div>
//             </div>

//             <div className="mt-8 space-y-4">
//               <button
//                 className="w-full bg-red-600/20 text-red-500 border border-red-500/30 p-4 rounded-lg backdrop-blur-md transform transition-all hover:bg-red-500/30"
//                 onClick={() => {/* Handle quarantine */}}
//               >
//                 Quarantine File
//               </button>

//               <button
//                 className="w-full bg-slate-800/30 p-4 rounded-lg backdrop-blur-md border border-slate-700 transform transition-all hover:bg-slate-700/50"
//                 onClick={() => {/* Handle delete */}}
//               >
//                 Delete File
//               </button>

//               <button
//                 className="w-full bg-blue-600 p-4 rounded-lg transform transition-all hover:bg-blue-500"
//                 onClick={() => router.push('/scanner')}
//               >
//                 Scan Another File
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
