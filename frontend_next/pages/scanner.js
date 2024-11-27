import { useState, useCallback } from 'react';
import { Upload, AlertTriangle, Shield, ShieldCheck, Activity, FileWarning, Terminal, Download, RefreshCw, Link } from 'lucide-react';
import Head from 'next/head';
import { saveAs } from 'file-saver';

const MAX_FILE_SIZE = 32 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/pdf',
  'application/x-dosexec',
  'application/vnd.microsoft.portable-executable'
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function Scanner() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [scanResults, setScanResults] = useState(null);

  // Helper Functions
  const getThreatLevel = (results) => {
    if (!results) return 'Unknown';
    if (results.malicious > 0) return 'Critical';
    if (results.suspicious > 0) return 'Warning';
    return 'Safe';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-red-500';
    if (confidence >= 0.6) return 'text-orange-500';
    if (confidence >= 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const renderBehaviorSeverity = (severity) => {
    const severityColors = {
      high: 'text-red-500',
      medium: 'text-orange-500',
      low: 'text-yellow-500',
      unknown: 'text-slate-400'
    };
    return severityColors[severity.toLowerCase()] || severityColors.unknown;
  };

  const generateReport = (source, scanResults) => {
    const timestamp = new Date().toISOString();
    const threatLevel = getThreatLevel(scanResults);

    const report = `
  MALWARE SCAN REPORT
  Generated: ${new Date().toLocaleString()}
  ----------------------------------------
  
  SOURCE INFORMATION
  ----------------------------------------
  ${file ? `Filename: ${file.name}\nSize: ${Math.round(file.size / 1024)}KB` : `URL: ${url}`}
  SHA-256: ${scanResults.sha256}
  Threat Level: ${threatLevel}
  
  SCAN STATISTICS
  ----------------------------------------
  Malicious Detections: ${scanResults.malicious}
  Suspicious Detections: ${scanResults.suspicious}
  Harmless Detections: ${scanResults.harmless}
  Undetected: ${scanResults.undetected}
  
  CLASSIFICATION
  ----------------------------------------
  Type: ${scanResults.classification?.type || 'N/A'}
  Confidence: ${scanResults.classification ? (scanResults.classification.confidence * 100).toFixed(1) + '%' : 'N/A'}
  
  BEHAVIORAL ANALYSIS
  ----------------------------------------
  ${scanResults.behaviors?.map(behavior => `
  Type: ${behavior.type}
  Severity: ${behavior.severity}
  Description: ${behavior.description}
  `).join('\n') || 'No behavioral analysis data available'}
  
  ----------------------------------------
  Report End
  `;

    return new Blob([report], { type: 'text/plain;charset=utf-8' });
  };

  const handleDownloadReport = () => {
    if ((!file && !url) || !scanResults) return;

    const reportBlob = generateReport(file || url, scanResults);
    const fileName = `malware-scan-report-${file ? file.name : 'url'}-${new Date().toISOString()}.txt`;
    saveAs(reportBlob, fileName);
  };

  const validateFile = useCallback((file) => {
    if (!file) {
      throw new Error('Please select a file');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 32MB');
    }

    return true;
  }, []);

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      throw new Error('Please enter a valid URL');
    }
  };

  const handleFileUpload = useCallback((e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setScanResults(null);
    setUrl('');

    try {
      if (selectedFile && validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    } catch (err) {
      setError(err.message);
      setFile(null);
    }
  }, [validateFile]);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setFile(null);
    setError('');
    setScanResults(null);
  };
  const handleScan = async () => {
    if (!file && !url) {
      setError('Please select a file or enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setProgress('Analyzing...');
    setScanResults(null);

    try {
      let response;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        response = await fetch(`${BACKEND_URL}/api/classify`, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/classify-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
      }

      // Improved error handling
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error ||
          `Scan failed (${response.status}). Please check the URL and try again.`;

        // More descriptive error handling
        switch (response.status) {
          case 400:
            setError(errorMessage || 'Invalid URL or request');
            break;
          case 404:
            setError('URL endpoint not found. Please check server configuration.');
            break;
          case 500:
            setError('Server error occurred during scanning. Possible a malicious url.');
            break;
          default:
            setError(errorMessage);
        }

        return;
      }

      const result = await response.json();
      setScanResults(result);
      localStorage.setItem('lastScanResults', JSON.stringify(result));

    } catch (error) {
      console.error('Scan error:', error);

      // Network-level error handling
      if (error instanceof TypeError) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(error.message || 'An unexpected error occurred during scanning');
      }
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setUrl('');
    setScanResults(null);
    setError('');
    setProgress('');
  };

  return (
    <>
      <Head>
        <title>
          {scanResults
            ? `${getThreatLevel(scanResults)} - Malware Analysis Results`
            : 'Malware Scanner'}
        </title>
        <meta name="description" content="Secure file and URL scanner for malware detection" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Malware Scanner</h1>
            {scanResults && (
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw size={20} />
                <span>New Scan</span>
              </button>
            )}
          </div>

          {!scanResults ? (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">
                  Select a file or enter a URL to scan
                </h2>
                <p className="text-slate-400">
                  Supported files: EXE, DLL, PDF (Max size: 32MB)
                </p>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <label className="block">
                  <div className={`
                    bg-slate-800/30 border-2 border-dashed border-slate-700 
                    rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50'}
                    ${url ? 'opacity-50' : ''}
                  `}>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={loading || !!url}
                    />
                    <div className="flex flex-col items-center space-y-4">
                      <Upload size={40} className="text-slate-400" />
                      <div>
                        {file ? (
                          <span className="break-all">
                            {file.name} ({Math.round(file.size / 1024)}KB)
                          </span>
                        ) : (
                          'Choose File'
                        )}
                      </div>
                    </div>
                  </div>
                </label>

                {/* URL Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link className="text-slate-400" size={20} />
                  </div>
                  <input
                    type="url"
                    placeholder="Or enter a URL to scan"
                    value={url}
                    onChange={handleUrlChange}
                    disabled={loading || !!file}
                    className={`
                      w-full pl-10 pr-4 py-3 bg-slate-800/30 border border-slate-700 
                      rounded-lg focus:outline-none focus:border-blue-500
                      ${loading || file ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-center">
                  {error}
                </div>
              )}

              {progress && (
                <div className="text-center text-slate-400">
                  {progress}
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={(!file && !url) || loading}
                className="w-full bg-blue-600 rounded-lg p-4 font-semibold 
                         hover:bg-blue-500 transition-colors disabled:opacity-50 
                         disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Scanning...
                  </>
                ) : (
                  'Start Scan'
                )}
              </button>
            </div>
          ) : (

            // Results Section (replaces the commented section in the previous code)
            <div className="space-y-6 animate-fadeIn">
              {/* File/URL Information */}
              <div className="p-6 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Scan Details</h2>
                    <div className="text-slate-400">
                      {file ? (
                        <>
                          <p>Filename: {file.name}</p>
                          <p className="text-xs">SHA-256: {scanResults.sha256}</p>
                        </>
                      ) : (
                        <>
                          <p>URL: {url}</p>
                          <p className="text-xs">SHA-256: {scanResults.sha256}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`
        px-4 py-2 rounded-full flex items-center space-x-2
        ${getThreatLevel(scanResults) === 'Critical' ? 'bg-red-500/20 text-red-500' :
                      getThreatLevel(scanResults) === 'Warning' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-green-500/20 text-green-500'}
      `}>
                    {getThreatLevel(scanResults) === 'Critical' ? <AlertTriangle size={20} /> :
                      getThreatLevel(scanResults) === 'Warning' ? <FileWarning size={20} /> :
                        <ShieldCheck size={20} />}
                    <span>{getThreatLevel(scanResults)}</span>
                  </div>
                </div>
              </div>

              {/* Analysis Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scan Statistics */}
                <div className="p-6 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="text-blue-500" />
                    <h2 className="text-xl font-semibold">Scan Statistics</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="text-sm text-slate-400">Malicious</div>
                      <div className="text-2xl font-bold text-red-500">
                        {scanResults.malicious}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="text-sm text-slate-400">Suspicious</div>
                      <div className="text-2xl font-bold text-yellow-500">
                        {scanResults.suspicious}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="text-sm text-slate-400">Harmless</div>
                      <div className="text-2xl font-bold text-green-500">
                        {scanResults.harmless}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
                      <div className="text-sm text-slate-400">Undetected</div>
                      <div className="text-2xl font-bold text-slate-400">
                        {scanResults.undetected}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Classification Results */}
                {scanResults.classification && (
                  <div className="p-6 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700">
                    <div className="flex items-center space-x-2 mb-4">
                      <Terminal className="text-blue-500" />
                      <h2 className="text-xl font-semibold">Classification</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-slate-800/50">
                        <div className="text-sm text-slate-400">Detected Type</div>
                        <div className="text-xl font-semibold">
                          {scanResults.classification.type}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-800/50">
                        <div className="text-sm text-slate-400">Confidence Score</div>
                        <div className={`text-xl font-semibold ${getConfidenceColor(scanResults.classification.confidence)}`}>
                          {(scanResults.classification.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Behavioral Analysis */}
              {scanResults.behaviors && scanResults.behaviors.length > 0 && (
                <div className="p-6 rounded-lg bg-slate-800/30 backdrop-blur-md border border-slate-700">
                  <h2 className="text-xl font-semibold mb-4">Behavioral Analysis</h2>
                  <div className="space-y-4">
                    {scanResults.behaviors.map((behavior, index) => (
                      <div key={index} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{behavior.type}</span>
                          <span className={`px-3 py-1 rounded-full text-sm ${renderBehaviorSeverity(behavior.severity)}`}>
                            {behavior.severity}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{behavior.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  className="w-full bg-slate-800/30 p-4 rounded-lg backdrop-blur-md border border-slate-700 
                 transform transition-all hover:bg-slate-700/50 flex items-center justify-center space-x-2"
                  onClick={handleDownloadReport}
                >
                  <Download size={20} />
                  <span>Download Report</span>
                </button>
              </div>
            </div>)}
        </div>
      </div>
    </>
  );
}