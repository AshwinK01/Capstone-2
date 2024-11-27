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
#         # Return features reshaped as required by the classifier
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

# if __name__ == '__main__':
#     app.run(debug=True)


from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import vt
from dotenv import load_dotenv
import tempfile
import hashlib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import yara
import time
import requests

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS)

# Load environment variables
load_dotenv()

# Constants
VIRUSTOTAL_API_KEY = os.getenv('VIRUSTOTAL_API_KEY')
MAX_FILE_SIZE = 32 * 1024 * 1024  # 32MB
ALLOWED_EXTENSIONS = {'exe', 'dll', 'pdf'}

class MalwareAnalyzer:
    def __init__(self):
        # Define malware types
        self.malware_types = {
            0: 'Trojan',
            1: 'Ransomware',
            2: 'Worm',
            3: 'Virus',
            4: 'Spyware',
            5: 'Adware',
            6: 'Rootkit'
        }
        
        # Load pre-trained model (ensure 'malware_classifier.joblib' exists)
        try:
            self.model = joblib.load('malware_classifier.joblib')
        except:
            self.model = RandomForestClassifier()  # Placeholder in case the model is missing

        # Load YARA rules for behavior analysis
        try:
            self.rules = yara.compile(filepath='malware_rules.yar')
        except:
            self.rules = None  # Fallback if YARA rules are missing

    def extract_features(self, vt_results, file_content):
        """
        Extracts features from VirusTotal results and file content for classification.
        """
        features = [
            vt_results.get('malicious', 0),
            vt_results.get('suspicious', 0),
            vt_results.get('harmless', 0),
            vt_results.get('undetected', 0),
            len(file_content)  # File size in bytes
        ]
        return np.array(features).reshape(1, -1)

    def analyze_behaviors(self, file_content):
        """
        Analyzes file content using YARA rules and returns detected behaviors.
        """
        behaviors = []
        if self.rules:
            matches = self.rules.match(data=file_content)
            for match in matches:
                behaviors.append({
                    'type': match.rule,
                    'description': match.meta.get('description', ''),
                    'severity': match.meta.get('severity', 'unknown')
                })
        return behaviors

    def classify(self, features, confidence_threshold=0.6):
        """
        Classifies file based on extracted features using the pre-trained model.
        """
        try:
            prediction = self.model.predict(features)[0]
            probabilities = self.model.predict_proba(features)[0]
            confidence = max(probabilities)
            
            if confidence >= confidence_threshold:
                return {
                    'type': self.malware_types[prediction],
                    'confidence': float(confidence)
                }
            return {'type': 'Unknown', 'confidence': float(confidence)}
        except Exception:
            return {'type': 'Unknown', 'confidence': 0.0}

    def analyze_url(self, url):
        """
        Analyze a URL using VirusTotal URL scanning
        """
        try:
            client = vt.Client(VIRUSTOTAL_API_KEY)
            
            # Scan URL
            url_analysis = client.scan_url(url)
            
            # Poll the analysis status
            while True:
                analysis = client.get_object(f"/analyses/{url_analysis.id}")
                if analysis.status == "completed":
                    break
                time.sleep(2)
            
            # Get URL report
            url_report = client.get_object(f"/urls/{hashlib.sha256(url.encode()).hexdigest()}")
            
            stats = url_report.last_analysis_stats
            
            behaviors = []
            if hasattr(url_report, 'suggested_threat_label'):
                behaviors.append({
                    'type': 'URL Threat',
                    'description': url_report.suggested_threat_label,
                    'severity': 'high'
                })
            
            client.close()
            
            return {
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "undetected": stats.get("undetected", 0),
                "classification": {
                    'type': 'URL',
                    'confidence': 0.8  # Fixed confidence for URL scans
                },
                "behaviors": behaviors,
                "sha256": hashlib.sha256(url.encode()).hexdigest()
            }
        
        except Exception as e:
            raise ValueError(f"URL analysis failed: {str(e)}")

def allowed_file(filename):
    """
    Checks if the uploaded file type is allowed.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/classify', methods=['POST'])
def classify():
    """
    API endpoint to classify an uploaded file as malware or benign.
    """
    try:
        # Check if a file is included in the request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']

        # Validate file name and type
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed types: EXE, DLL, PDF"}), 400

        file_content = file.read()

        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            return jsonify({"error": "File size exceeds 32MB limit"}), 400

        # Calculate file hash for identification
        sha256_hash = hashlib.sha256(file_content).hexdigest()

        # Save the file temporarily for VirusTotal scan
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name

        try:
            # Initialize VirusTotal client and MalwareAnalyzer
            client = vt.Client(VIRUSTOTAL_API_KEY)
            analyzer = MalwareAnalyzer()

            # Upload the file to VirusTotal for scanning
            with open(temp_path, 'rb') as f:
                analysis = client.scan_file(f)

            # Poll the analysis status until it's complete
            while True:
                analysis = client.get_object(f"/analyses/{analysis.id}")
                if analysis.status == "completed":
                    break
                time.sleep(2)

            stats = analysis.stats

            # Extract features and classify the file
            features = analyzer.extract_features(stats, file_content)
            classification = analyzer.classify(features)
            behaviors = analyzer.analyze_behaviors(file_content)

            return jsonify({
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "undetected": stats.get("undetected", 0),
                "classification": classification,
                "behaviors": behaviors,
                "sha256": sha256_hash
            })

        finally:
            client.close()
            os.unlink(temp_path)  # Clean up the temporary file

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/classify-url', methods=['POST'])
def classify_url():
    """
    API endpoint to classify a URL
    """
    try:
        # Get URL from request
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({"error": "No URL provided"}), 400
        
        url = data['url']
        
        # Validate URL
        try:
            response = requests.head(url, timeout=5)
            if response.status_code >= 400:
                return jsonify({"error": "Invalid or unreachable URL"}), 400
        except requests.RequestException:
            return jsonify({"error": "Unable to connect to URL"}), 400
        
        # Initialize MalwareAnalyzer and analyze URL
        analyzer = MalwareAnalyzer()
        results = analyzer.analyze_url(url)
        
        return jsonify(results)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)