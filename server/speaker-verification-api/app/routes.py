from flask import Blueprint, request, jsonify
from .services.verification_service import process_and_verify_files

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
