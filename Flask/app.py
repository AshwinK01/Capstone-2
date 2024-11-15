from flask import Flask, request, jsonify
import logging
import joblib  # Used for loading the trained model (assuming it's in .pkl format)
import traceback

app = Flask(__name__)

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load your trained model (update 'model_path.pkl' with the actual path to your model file)
try:
    model = joblib.load('model_path.pkl')
    logging.info("Model loaded successfully.")
except Exception as e:
    logging.error("Error loading model: %s", str(e))
    model = None  # Keep model as None to handle errors if loading fails


@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Malware Classification API"})


@app.route('/predict', methods=['POST'])
def predict():
    """
    API endpoint for malware prediction.
    Expects JSON input with 'features' key containing a list of feature values.
    """
    if not model:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        # Parse the JSON request
        data = request.get_json()
        if 'features' not in data:
            return jsonify({"error": "Missing 'features' in request data"}), 400
        
        features = data['features']
        # Ensure the features are in the correct format
        if not isinstance(features, list):
            return jsonify({"error": "Features should be a list"}), 400

        # Convert features to the correct input format for the model
        prediction = model.predict([features])[0]  # Assuming model takes a 2D array
        response = {
            "prediction": prediction
        }
        return jsonify(response), 200
    
    except Exception as e:
        logging.error("Prediction error: %s", str(e))
        logging.debug(traceback.format_exc())
        return jsonify({"error": "Error during prediction"}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not Found"}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal Server Error"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
