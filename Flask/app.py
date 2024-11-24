from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import logging
import joblib
import traceback
import os

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configure upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'exe', 'dll', 'pdf', 'doc', 'docx', 'zip', 'rar'}  # Add more as needed
MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32MB limit

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load the model
try:
    model = joblib.load('model_path.pkl')
    logging.info("Model loaded successfully.")
except Exception as e:
    logging.error("Error loading model: %s", str(e))
    model = None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/classify', methods=['POST'])
def classify_file():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']  # This should be a FileStorage object
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)  # Save the file securely

        # Proceed with analysis
        analysis_result = analyze_file(file_path)
        os.remove(file_path)  # Clean up after processing

        return jsonify(analysis_result), 200
    except Exception as e:
        logging.error(f"Classification error: {str(e)}")
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)  # Ensure cleanup
        return jsonify({"error": "File analysis failed"}), 500


def analyze_file(file_path):
    """
    Analyze the file and return detection results.
    This is where you would implement your actual file analysis logic.
    """
    try:
        # Implement your actual file analysis here
        # This is a placeholder implementation
        
        # Example: You might extract features here
        # features = extract_features(file_path)
        # prediction = model.predict([features])[0]
        
        # For now, returning mock results matching your frontend expectations
        return {
            "malicious": 2,      # Number of malicious detections
            "harmless": 60,      # Number of harmless detections
            "suspicious": 3,      # Number of suspicious detections
            "undetected": 5      # Number of undetected/unknown cases
        }
        
    except Exception as e:
        logging.error(f"Analysis error: {str(e)}")
        raise

@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File is too large. Maximum size is 32MB"}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not Found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal Server Error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)