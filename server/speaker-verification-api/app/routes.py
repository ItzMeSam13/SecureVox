import os
from flask import Blueprint, request, jsonify
from .services.verification_service import process_and_verify_files
from .services.background_service import analyze_background_noise
from app.services.ai_detection_service import VoiceDetector
verification_bp = Blueprint('verification_api', __name__)


@verification_bp.route('/verify', methods=['POST'])
def verify_endpoint():
    print("----------- NEW REQUEST -----------")
    print(f"REQUEST HEADERS: {request.headers}")
    print(f"REQUEST FILES: {request.files}")
    print("---------------------------------")
    
    if 'audio1' not in request.files or 'audio2' not in request.files:
        return jsonify({"error": "Please provide both 'audio1' and 'audio2' files"}), 400

    file1 = request.files['audio1']
    file2 = request.files['audio2']
    if 'audio1' not in request.files or 'audio2' not in request.files:
        return jsonify({"error": "Please provide both 'audio1' and 'audio2' files"}), 400

    file1 = request.files['audio1']
    file2 = request.files['audio2']

    if file1.filename == '' or file2.filename == '':
        return jsonify({"error": "No file selected for one or both parts"}), 400
    
    try:
        result = process_and_verify_files(file1, file2)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

noise_bp = Blueprint('noise_api', __name__)

@noise_bp.route('/noise', methods=['POST'])
def noise_consistency_endpoint():
    if 'audio1' not in request.files:
        return jsonify({"error": "Please provide 'audio1' file"}), 400

    file1 = request.files['audio1']
    file2 = request.files.get('audio2', None)

    if file1.filename == '':
        return jsonify({"error": "No file selected for audio1"}), 400

    try:
        result = analyze_background_noise(file1, file2)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

detection_bp = Blueprint('detection_bp', __name__)
voice_detector = VoiceDetector()

@detection_bp.route('/detect-voice', methods=['POST'])
def detect_voice():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        upload_folder = 'uploads'
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, file.filename)
        file.save(file_path)

        try:
            result = voice_detector.is_synthetic(file_path)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": f"An error occurred during detection: {e}"}), 500
        finally:
            os.remove(file_path)