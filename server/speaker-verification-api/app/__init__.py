import os
from flask import Flask
from . import config
from .routes import verification_bp

def create_app():
    app = Flask(__name__)
    
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    
    app.register_blueprint(verification_bp)
    
    return app
