import os
from flask import Flask
from . import config
from .routes import verification_bp,noise_bp, detection_bp,hash_bp,spectrogram_bp,transcript_bp,report_bp


def create_app():
    app = Flask(__name__)
    
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    
    app.register_blueprint(verification_bp)
    
    app.register_blueprint(noise_bp)
    app.register_blueprint(detection_bp)
    app.register_blueprint(hash_bp)
    app.register_blueprint(spectrogram_bp)
    app.register_blueprint(transcript_bp)
    app.register_blueprint(report_bp)
    
    # Serve spectrogram images
    from flask import send_from_directory
    @app.route("/spectrograms/<path:filename>")
    def serve_spectrogram(filename):
        return send_from_directory("reports/spectrograms", filename)

    return app
    return app
