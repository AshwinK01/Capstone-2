# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import os
# import vt
# from dotenv import load_dotenv
# import tempfile
# import hashlib
# import numpy as np
# from sklearn.ensemble import RandomForestClassifier
# import joblib
# import yara
# import time
# import requests
# from urllib.parse import urlparse  # Add this import at the top of the file

# # Initialize Flask app
# app = Flask(__name__)
# CORS(app)  # Enable Cross-Origin Resource Sharing (CORS)

# # Load environment variables
# load_dotenv()

# # Constants
# VIRUSTOTAL_API_KEY = os.getenv('VIRUSTOTAL_API_KEY')
# MAX_FILE_SIZE = 32 * 1024 * 1024  # 32MB
# ALLOWED_EXTENSIONS = {'exe', 'dll', 'pdf'}

# class MalwareAnalyzer:
#     def __init__(self):
#         # Define malware types
#         self.malware_types = {
#             0: 'Trojan',
#             1: 'Ransomware',
#             2: 'Worm',
#             3: 'Virus',
#             4: 'Spyware',
#             5: 'Adware',
#             6: 'Rootkit'
#         }
        
#         # Load pre-trained model (ensure 'malware_classifier.joblib' exists)
#         try:
#             self.model = joblib.load('malware_classifier.joblib')
#         except:
#             self.model = RandomForestClassifier()  # Placeholder in case the model is missing

#         # Load YARA rules for behavior analysis
#         try:
#             self.rules = yara.compile(filepath='malware_rules.yar')
#         except:
#             self.rules = None  # Fallback if YARA rules are missing

#     def extract_features(self, vt_results, file_content):
#         """
#         Extracts features from VirusTotal results and file content for classification.
#         """
#         features = [
#             vt_results.get('malicious', 0),
#             vt_results.get('suspicious', 0),
#             vt_results.get('harmless', 0),
#             vt_results.get('undetected', 0),
#             len(file_content)  # File size in bytes
#         ]
#         return np.array(features).reshape(1, -1)

#     def analyze_behaviors(self, file_content):
#         """
#         Analyzes file content using YARA rules and returns detected behaviors.
#         """
#         behaviors = []
#         if self.rules:
#             matches = self.rules.match(data=file_content)
#             for match in matches:
#                 behaviors.append({
#                     'type': match.rule,
#                     'description': match.meta.get('description', ''),
#                     'severity': match.meta.get('severity', 'unknown')
#                 })
#         return behaviors

#     def classify(self, features, confidence_threshold=0.6):
#         """
#         Classifies file based on extracted features using the pre-trained model.
#         """
#         try:
#             prediction = self.model.predict(features)[0]
#             probabilities = self.model.predict_proba(features)[0]
#             confidence = max(probabilities)
            
#             if confidence >= confidence_threshold:
#                 return {
#                     'type': self.malware_types[prediction],
#                     'confidence': float(confidence)
#                 }
#             return {'type': 'Unknown', 'confidence': float(confidence)}
#         except Exception:
#             return {'type': 'Unknown', 'confidence': 0.0}

#     def analyze_url(self, url):
#         """
#         Analyze a URL using VirusTotal URL scanning
#         """
#         try:
#             client = vt.Client(VIRUSTOTAL_API_KEY)
            
#             # Scan URL
#             url_analysis = client.scan_url(url)
            
#             # Poll the analysis status
#             while True:
#                 analysis = client.get_object(f"/analyses/{url_analysis.id}")
#                 if analysis.status == "completed":
#                     break
#                 time.sleep(2)
            
#             # Get URL report
#             url_report = client.get_object(f"/urls/{hashlib.sha256(url.encode()).hexdigest()}")
            
#             stats = url_report.last_analysis_stats
            
#             behaviors = []
#             if hasattr(url_report, 'suggested_threat_label'):
#                 behaviors.append({
#                     'type': 'URL Threat',
#                     'description': url_report.suggested_threat_label,
#                     'severity': 'high'
#                 })
            
#             client.close()
            
#             return {
#                 "malicious": stats.get("malicious", 0),
#                 "suspicious": stats.get("suspicious", 0),
#                 "harmless": stats.get("harmless", 0),
#                 "undetected": stats.get("undetected", 0),
#                 "classification": {
#                     'type': 'URL',
#                     'confidence': 0.8  # Fixed confidence for URL scans
#                 },
#                 "behaviors": behaviors,
#                 "sha256": hashlib.sha256(url.encode()).hexdigest()
#             }
        
#         except Exception as e:
#             raise ValueError(f"URL analysis failed: {str(e)}")

# def allowed_file(filename):
#     """
#     Checks if the uploaded file type is allowed.
#     """
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# @app.route('/api/classify', methods=['POST'])
# def classify():
#     """
#     API endpoint to classify an uploaded file as malware or benign.
#     """
#     try:
#         # Check if a file is included in the request
#         if 'file' not in request.files:
#             return jsonify({"error": "No file provided"}), 400

#         file = request.files['file']

#         # Validate file name and type
#         if not file.filename:
#             return jsonify({"error": "No file selected"}), 400
#         if not allowed_file(file.filename):
#             return jsonify({"error": "Invalid file type. Allowed types: EXE, DLL, PDF"}), 400

#         file_content = file.read()

#         # Check file size
#         if len(file_content) > MAX_FILE_SIZE:
#             return jsonify({"error": "File size exceeds 32MB limit"}), 400

#         # Calculate file hash for identification
#         sha256_hash = hashlib.sha256(file_content).hexdigest()

#         # Save the file temporarily for VirusTotal scan
#         with tempfile.NamedTemporaryFile(delete=False) as temp_file:
#             temp_file.write(file_content)
#             temp_path = temp_file.name

#         try:
#             # Initialize VirusTotal client and MalwareAnalyzer
#             client = vt.Client(VIRUSTOTAL_API_KEY)
#             analyzer = MalwareAnalyzer()

#             # Upload the file to VirusTotal for scanning
#             with open(temp_path, 'rb') as f:
#                 analysis = client.scan_file(f)

#             # Poll the analysis status until it's complete
#             while True:
#                 analysis = client.get_object(f"/analyses/{analysis.id}")
#                 if analysis.status == "completed":
#                     break
#                 time.sleep(2)

#             stats = analysis.stats

#             # Extract features and classify the file
#             features = analyzer.extract_features(stats, file_content)
#             classification = analyzer.classify(features)
#             behaviors = analyzer.analyze_behaviors(file_content)

#             return jsonify({
#                 "malicious": stats.get("malicious", 0),
#                 "suspicious": stats.get("suspicious", 0),
#                 "harmless": stats.get("harmless", 0),
#                 "undetected": stats.get("undetected", 0),
#                 "classification": classification,
#                 "behaviors": behaviors,
#                 "sha256": sha256_hash
#             })

#         finally:
#             client.close()
#             os.unlink(temp_path)  # Clean up the temporary file

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# def validate_url(url):
#     try:
#         parsed_url = urlparse(url)
#         return all([parsed_url.scheme, parsed_url.netloc])
#     except Exception:
#         return False

# @app.route('/api/classify-url', methods=['POST'])
# def classify_url():
#     """
#     API endpoint to classify a URL
#     """
#     try:
#         # Get URL from request
#         data = request.get_json()
#         if not data or 'url' not in data:
#             return jsonify({"error": "No URL provided"}), 400
        
#         url = data['url']
        
#         # Add URL validation here
#         if not validate_url(url):
#             return jsonify({"error": "Invalid URL format"}), 400
        
#         # Validate URL connectivity
#         try:
#             response = requests.head(url, timeout=5)
#             if response.status_code >= 400:
#                 return jsonify({"error": "Invalid or unreachable URL"}), 400
#         except requests.RequestException:
#             return jsonify({"error": "Unable to connect to URL"}), 400
                
#         # Initialize MalwareAnalyzer and analyze URL
#         analyzer = MalwareAnalyzer()
#         results = analyzer.analyze_url(url)
        
#         return jsonify(results)
    
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)


import os
import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# VirusTotal API configuration
VIRUSTOTAL_API_KEY = '892866fb19eaf74d4337dc1efb3f58686b8ea466a87842de0f2182b43298665d'  # Replace with your actual API key
VIRUSTOTAL_API_URL = 'https://www.virustotal.com/api/v3'

# File upload configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 32 * 1024 * 1024  # 32 MB
ALLOWED_EXTENSIONS = {'exe', 'dll', 'pdf'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def calculate_sha256(file_path):
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_file(file_path):
    """Analyze file using VirusTotal API."""
    headers = {
        'x-apikey': VIRUSTOTAL_API_KEY
    }
    
    # Upload file for scanning
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f'{VIRUSTOTAL_API_URL}/files', headers=headers, files=files)
    
    # Check upload status
    if response.status_code not in [200, 201]:
        raise Exception(f"File upload failed: {response.text}")
    
    # Get file analysis ID
    analysis_id = response.json().get('data', {}).get('id')
    
    # Wait for analysis and get results
    while True:
        analysis_response = requests.get(f'{VIRUSTOTAL_API_URL}/analyses/{analysis_id}', headers=headers)
        analysis_data = analysis_response.json().get('data', {})
        status = analysis_data.get('attributes', {}).get('status')
        
        if status == 'completed':
            break
        elif status == 'error':
            raise Exception("Analysis failed")
    
    # Get file details
    file_id = response.json().get('data', {}).get('id')
    file_response = requests.get(f'{VIRUSTOTAL_API_URL}/files/{file_id}', headers=headers)
    file_data = file_response.json().get('data', {})
    
    return process_virustotal_results(file_data)

def analyze_url(url):
    """Analyze URL using VirusTotal API."""
    headers = {
        'x-apikey': VIRUSTOTAL_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    # Scan URL
    payload = f'url={url}'
    response = requests.post(f'{VIRUSTOTAL_API_URL}/urls', headers=headers, data=payload)
    
    # Check upload status
    if response.status_code not in [200, 201]:
        raise Exception(f"URL scan failed: {response.text}")
    
    # Get analysis ID
    analysis_id = response.json().get('data', {}).get('id')
    
    # Wait for analysis and get results
    while True:
        analysis_response = requests.get(f'{VIRUSTOTAL_API_URL}/analyses/{analysis_id}', headers=headers)
        analysis_data = analysis_response.json().get('data', {})
        status = analysis_data.get('attributes', {}).get('status')
        
        if status == 'completed':
            break
        elif status == 'error':
            raise Exception("Analysis failed")
    
    # Get URL details
    url_id = response.json().get('data', {}).get('id')
    url_response = requests.get(f'{VIRUSTOTAL_API_URL}/urls/{url_id}', headers=headers)
    url_data = url_response.json().get('data', {})
    
    return process_virustotal_results(url_data)

def process_virustotal_results(data):
    """Process VirusTotal analysis results."""
    attributes = data.get('attributes', {})
    last_analysis_stats = attributes.get('last_analysis_stats', {})
    
    # Extract behavioral analysis if available
    behaviors = []
    if 'sandbox_verdicts' in attributes:
        for key, verdict in attributes.get('sandbox_verdicts', {}).items():
            behaviors.append({
                'type': key,
                'severity': verdict.get('severity', 'unknown').lower(),
                'description': verdict.get('description', 'No description available')
            })
    
    return {
        'sha256': attributes.get('sha256', 'N/A'),
        'malicious': last_analysis_stats.get('malicious', 0),
        'suspicious': last_analysis_stats.get('suspicious', 0),
        'harmless': last_analysis_stats.get('harmless', 0),
        'undetected': last_analysis_stats.get('undetected', 0),
        'classification': {
            'type': attributes.get('type', 'Unknown'),
            'confidence': 0.7  # Default confidence, replace with actual if available
        },
        'behaviors': behaviors
    }

@app.route('/api/classify', methods=['POST'])
def classify_file():
    """Endpoint for file classification."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    # Validate file
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not supported'}), 400
    
    # Save file
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    try:
        # Check file size
        if os.path.getsize(filepath) > MAX_FILE_SIZE:
            os.remove(filepath)
            return jsonify({'error': 'File size exceeds 32MB limit'}), 400
        
        # Analyze file
        results = analyze_file(filepath)
        return jsonify(results)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/classify-url', methods=['POST'])
def classify_url():
    """Endpoint for URL classification."""
    data = request.json
    
    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400
    
    url = data['url']
    
    try:
        results = analyze_url(url)
        return jsonify(results)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)