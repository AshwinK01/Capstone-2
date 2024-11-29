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
from urllib.parse import urlparse

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
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = RandomForestClassifier()  # Placeholder in case the model is missing

        # Load YARA rules for behavior analysis
        try:
            self.rules = yara.compile(filepath='malware_rules.yar')
        except Exception as e:
            print(f"Error loading YARA rules: {e}")
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
            try:
                matches = self.rules.match(data=file_content)
                for match in matches:
                    behaviors.append({
                        'type': match.rule,
                        'description': match.meta.get('description', ''),
                        'severity': match.meta.get('severity', 'unknown')
                    })
            except Exception as e:
                print(f"Error analyzing behaviors: {e}")
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
                    'type': self.malware_types.get(prediction, 'Unknown'),
                    'confidence': float(confidence)
                }
            return {'type': 'Unknown', 'confidence': float(confidence)}
        except Exception as e:
            print(f"Error in classification: {e}")
            return {'type': 'Unknown', 'confidence': 0.0}

    def analyze_url(self, url):
        """
        Analyze a URL using VirusTotal URL scanning with more robust error handling
        """
        try:
            client = vt.Client(VIRUSTOTAL_API_KEY)

            # URL encode if necessary
            url = url.strip()

            try:
                # Scan URL
                url_scan = client.scan_url(url)
            except Exception as scan_error:
                print(f"URL Scan Error: {scan_error}")
                raise ValueError(f"Failed to scan URL: {str(scan_error)}")

            # Poll the analysis status with timeout
            max_attempts = 10
            attempts = 0
            while attempts < max_attempts:
                try:
                    analysis = client.get_object(f"/analyses/{url_scan.id}")
                    if analysis.status == "completed":
                        break
                    time.sleep(3)
                    attempts += 1
                except Exception as poll_error:
                    print(f"Analysis Poll Error: {poll_error}")
                    raise ValueError(f"Failed to poll analysis: {str(poll_error)}")

            if attempts == max_attempts:
                raise ValueError("URL analysis timed out")

            # Get URL report
            try:
                url_id = hashlib.sha256(url.encode()).hexdigest()
                url_report = client.get_object(f"/urls/{url_id}")
            except Exception as report_error:
                print(f"URL Report Error: {report_error}")
                raise ValueError(f"Failed to retrieve URL report: {str(report_error)}")

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
            print(f"Comprehensive URL Analysis Error: {e}")
            raise ValueError(f"Comprehensive URL analysis failed: {str(e)}")


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
    API endpoint to classify a URL with comprehensive error handling
    """
    try:
        # Get URL from request
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({"error": "No URL provided"}), 400

        url = data['url'].strip()

        # Validate URL format
        try:
            parsed_url = urlparse(url)
            if not all([parsed_url.scheme, parsed_url.netloc]):
                return jsonify({"error": "Invalid URL format"}), 400
        except Exception:
            return jsonify({"error": "Invalid URL format"}), 400

        # Validate URL connectivity
        try:
            response = requests.head(url, timeout=5, allow_redirects=True)
            if response.status_code >= 400:
                return jsonify({"error": "Invalid or unreachable URL"}), 400
        except requests.RequestException as e:
            print(f"URL Connectivity Error: {e}")
            return jsonify({"error": "Unable to connect to URL"}), 400

        # Analyze URL
        try:
            analyzer = MalwareAnalyzer()
            result = analyzer.analyze_url(url)
            return jsonify(result)
        except ValueError as ve:
            print(f"URL Analysis Error: {ve}")
            return jsonify({"error": str(ve)}), 500

    except Exception as e:
        print(f"Unexpected URL Classification Error: {e}")
        return jsonify({"error": "An unexpected error occurred during URL scanning"}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)