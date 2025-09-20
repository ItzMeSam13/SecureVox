import os
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import datetime
import tempfile

from .services.verification_service import process_and_verify_files
from .services.background_service import analyze_background_noise
from app.services.ai_detection_service import VoiceDetector
from .services.hash_service import compute_file_hashes
from .services.spectrogram_service import generate_spectrogram
from app.services.transcript_service import transcribe_audio, compare_transcripts
from app.services.report_service import generate_pdf_report, preprocess_audio, _safe_remove

# Define Blueprints
verification_bp = Blueprint('verification_api', __name__)
noise_bp = Blueprint('noise_api', __name__)
detection_bp = Blueprint('detection_bp', __name__)
hash_bp = Blueprint("hash_api", __name__)
spectrogram_bp = Blueprint("spectrogram_api", __name__)
transcript_bp = Blueprint("transcript_bp", __name__)
report_bp = Blueprint("report_api", __name__)


# Create and configure upload directories
UPLOAD_FOLDER = "uploads"
SPECTROGRAM_FOLDER = "reports/spectrograms"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SPECTROGRAM_FOLDER, exist_ok=True)

voice_detector = VoiceDetector()

# ------------------ Verification Endpoint ------------------
@verification_bp.route('/verify', methods=['POST'])
def verify_endpoint():
    if 'audio1' not in request.files or 'audio2' not in request.files:
        return jsonify({"error": "Please provide both 'audio1' and 'audio2' files"}), 400

    file1 = request.files['audio1']
    file2 = request.files['audio2']

    if file1.filename == '' or file2.filename == '':
        return jsonify({"error": "No file selected for one or both parts"}), 400

    path1, path2 = None, None
    try:
        # Preprocess and save files to disk
        path1 = preprocess_audio(file1)
        path2 = preprocess_audio(file2)
        
        result = process_and_verify_files(path1, path2)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup temporary files
        _safe_remove(path1)
        _safe_remove(path2)

# ------------------ Noise Endpoint ------------------
@noise_bp.route('/noise', methods=['POST'])
def noise_consistency_endpoint():
    if 'audio1' not in request.files:
        return jsonify({"error": "Please provide 'audio1' file"}), 400

    file1 = request.files['audio1']
    file2 = request.files.get('audio2', None)

    if file1.filename == '':
        return jsonify({"error": "No file selected for audio1"}), 400

    path1, path2 = None, None
    try:
        # Preprocess and save files to disk
        path1 = preprocess_audio(file1)
        if file2 and file2.filename != '':
            path2 = preprocess_audio(file2)

        # Pass file paths to the service function
        result = analyze_background_noise(path1, path2)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup temporary files
        _safe_remove(path1)
        _safe_remove(path2)


# ------------------ AI Detection Endpoint ------------------
@detection_bp.route('/detect-voice', methods=['POST'])
def detect_voice():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_path = None
    try:
        # Preprocess and save file to disk
        file_path = preprocess_audio(file)
        
        # Pass file path to the service function
        result = voice_detector.is_synthetic(file_path)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred during detection: {e}"}), 500
    finally:
        # Cleanup temporary file
        _safe_remove(file_path)


# ------------------ Hash Endpoint ------------------
@hash_bp.route("/hash", methods=["POST"])
def file_hash_endpoint():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    try:
        hashes = compute_file_hashes(file_path)
        return jsonify({
            "file_name": filename,
            "hash_sha256": hashes["hash_sha256"],
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        _safe_remove(file_path)


# ------------------ Spectrogram Endpoint ------------------
@spectrogram_bp.route("/generate-spectrogram", methods=["POST"])
def generate_spectrogram_image():
    if "file" not in request.files:
        return {"error": "No file uploaded"}, 400

    file = request.files["file"]
    if file.filename == "":
        return {"error": "Empty filename"}, 400

    file_path = None
    spectrogram_file_path = None
    try:
        file_path = preprocess_audio(file)
        spectrogram_file_name = generate_spectrogram(file_path)
        spectrogram_file_path = os.path.abspath(os.path.join(SPECTROGRAM_FOLDER, spectrogram_file_name))

        return send_file(spectrogram_file_path, mimetype="image/png")
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        _safe_remove(file_path)
        # Note: The spectrogram file should be managed by the calling service, not deleted here,
        # or you can add a timer to delete it later. For this example, we'll assume it's kept.


# ------------------ Transcript Endpoint ------------------
@transcript_bp.route("/transcript-compare", methods=["POST"])
def transcript_compare_endpoint():
    if "original_audio" not in request.files or "suspected_audio" not in request.files:
        return jsonify({"error": "Please provide both 'original_audio' and 'suspected_audio' files"}), 400

    original_file = request.files["original_audio"]
    suspected_file = request.files["suspected_audio"]

    if original_file.filename == "" or suspected_file.filename == "":
        return jsonify({"error": "One or both files have empty filename"}), 400

    original_path, suspected_path = None, None
    try:
        # Preprocess and save files to disk
        original_path = preprocess_audio(original_file)
        suspected_path = preprocess_audio(suspected_file)
        
        # Transcribe and compare
        original_text = transcribe_audio(original_path)
        suspected_text = transcribe_audio(suspected_path)
        result = compare_transcripts(original_text, suspected_text)

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup temporary files
        _safe_remove(original_path)
        _safe_remove(suspected_path)


#
@report_bp.route("/generate-report", methods=["POST"])
def generate_report():
    if "original_audio" not in request.files or "suspected_audio" not in request.files:
        return {"error": "Provide both original_audio and suspected_audio"}, 400

    original_file = request.files["original_audio"]
    suspected_file = request.files["suspected_audio"]

    original_path, suspected_path = None, None
    try:
        # Preprocess and save the files to get their paths
        original_path = preprocess_audio(original_file)
        suspected_path = preprocess_audio(suspected_file)

        report_id = f"REP-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Pass the file paths to generate_pdf_report
        # This function should now handle all logic and return the PDF buffer.
        pdf_buffer = generate_pdf_report(original_path, suspected_path, report_id)

        # The pdf_buffer (BytesIO object) is sent directly as the file.
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"{report_id}.pdf",
            mimetype="application/pdf"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup temporary files
        _safe_remove(original_path)
        _safe_remove(suspected_path)