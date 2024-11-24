# app.py

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

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Constants
VIRUSTOTAL_API_KEY = os.getenv('VIRUSTOTAL_API_KEY')
MAX_FILE_SIZE = 32 * 1024 * 1024  # 32MB
ALLOWED_EXTENSIONS = {'exe', 'dll', 'pdf'}

class MalwareAnalyzer:
    def __init__(self):
        self.malware_types = {
            0: 'Trojan',
            1: 'Ransomware',
            2: 'Worm',
            3: 'Virus',
            4: 'Spyware',
            5: 'Adware',
            6: 'Rootkit'
        }
        # Load pre-trained model (you'll need to train this separately)
        try:
            self.model = joblib.load('malware_classifier.joblib')
        except:
            self.model = RandomForestClassifier()
        
        # Load YARA rules
        try:
            self.rules = yara.compile(filepath='malware_rules.yar')
        except:
            self.rules = None

    def extract_features(self, vt_results, file_content):
        features = []
        
        # Basic statistics
        features.extend([
            vt_results.get('malicious', 0),
            vt_results.get('suspicious', 0),
            vt_results.get('harmless', 0),
            vt_results.get('undetected', 0)
        ])
        
        # File characteristics
        features.append(len(file_content))
        
        # Additional features can be added here
        
        return np.array(features).reshape(1, -1)

    def analyze_behaviors(self, file_content):
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
        except:
            return {'type': 'Unknown', 'confidence': 0.0}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/classify', methods=['POST'])
def classify():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed types: EXE, DLL, PDF"}), 400
        
        file_content = file.read()
        if len(file_content) > MAX_FILE_SIZE:
            return jsonify({"error": "File size exceeds 32MB limit"}), 400
        
        # Calculate file hash
        sha256_hash = hashlib.sha256(file_content).hexdigest()
        
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name
        
        try:
            client = vt.Client(VIRUSTOTAL_API_KEY)
            analyzer = MalwareAnalyzer()
            
            try:
                with open(temp_path, 'rb') as f:
                    analysis = client.scan_file(f)
                
                while True:
                    analysis = client.get_object("/analyses/{}", analysis.id)
                    if analysis.status == "completed":
                        break
                    time.sleep(2)
                
                stats = analysis.stats
                
                # Extract features and classify
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
        
        finally:
            try:
                os.unlink(temp_path)
            except:
                pass
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)