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

const BACKEND_URL = 'http://localhost:5000';

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

    const report = `MALWARE SCAN REPORT
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
  ${scanResults.behaviors?.map(behavior => `Type: ${behavior.type} Severity: ${behavior.severity} Description: ${behavior.description}`).join('\n') || 'No behavioral analysis data available'}
  
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
            setError('Server error occurred during scanning. Possible malicious url.');
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
                  <div className={`bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-lg p-8 text-center transition-colors cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50'} ${url ? 'opacity-50' : ''}`}>
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
                            {file.name} ({Math.round(file.size / 1024)} KB)
                          </span>
                        ) : (
                          <span>Select a file to scan</span>
                        )}
                      </div>
                    </div>
                  </div>
                </label>

                {/* URL Scan */}
                <div className="flex flex-col items-center">
                  <label htmlFor="url" className="block text-slate-400">
                    Or enter a URL:
                  </label>
                  <input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={handleUrlChange}
                    className="mt-2 p-3 bg-slate-800 text-white rounded-lg border border-slate-700"
                    disabled={loading || !!file}
                  />
                </div>
              </div>

              {/* Scan button */}
              <div className="text-center">
                <button
                  onClick={handleScan}
                  className={`mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                  disabled={loading}
                >
                  {loading ? <Activity size={20} className="animate-spin" /> : 'Start Scan'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-semibold">
                  Scan Result: {getThreatLevel(scanResults)}
                </h2>
                <p className="text-xl">
                  {scanResults.malicious > 0 ? (
                    <span className="text-red-500">Malicious</span>
                  ) : scanResults.suspicious > 0 ? (
                    <span className="text-orange-500">Suspicious</span>
                  ) : (
                    <span className="text-green-500">Clean</span>
                  )}
                </p>
                <p className="text-slate-400">
                  Scan completed at {new Date(scanResults.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Scan Details */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Behavioral Analysis</h3>
                  <div className="space-y-2">
                    {scanResults.behaviors?.map((behavior, index) => (
                      <div key={index} className="flex justify-between">
                        <div>
                          <span className="font-medium">{behavior.type}</span>:{' '}
                          <span
                            className={renderBehaviorSeverity(behavior.severity)}
                          >
                            {behavior.severity}
                          </span>
                        </div>
                        <div>{behavior.description}</div>
                      </div>
                    ))}

                    {scanResults.behaviors?.length === 0 && (
                      <div>No behavioral analysis data available</div>
                    )}
                  </div>
                </div>

                {/* Threat Classification */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Threat Classification</h3>
                  <div>
                    <div className="flex justify-between">
                      <span className="font-medium">Classification Type</span>
                      <span>{scanResults.classification?.type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Confidence</span>
                      <span className={getConfidenceColor(scanResults.classification?.confidence)}>
                        {scanResults.classification ? (scanResults.classification.confidence * 100).toFixed(1) + '%' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scan Stats */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Scan Statistics</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Malicious</span>:{' '}
                      {scanResults.malicious}
                    </div>
                    <div>
                      <span className="font-medium">Suspicious</span>:{' '}
                      {scanResults.suspicious}
                    </div>
                    <div>
                      <span className="font-medium">Harmless</span>:{' '}
                      {scanResults.harmless}
                    </div>
                    <div>
                      <span className="font-medium">Undetected</span>:{' '}
                      {scanResults.undetected}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={handleDownloadReport}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg"
                >
                  <Download size={20} /> Download Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
  