import os
from werkzeug.utils import secure_filename
from speechbrain.inference.speaker import SpeakerRecognition
from .. import config
from ..utils.audio_converter import convert_to_wav

verification = SpeakerRecognition.from_hparams(
    source=config.MODEL_SOURCE,
    savedir=config.MODEL_SAVEDIR
)

def _allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config.ALLOWED_EXTENSIONS

def process_and_verify_files(file1, file2):
    if not (_allowed_file(file1.filename) and _allowed_file(file2.filename)):
        allowed = list(config.ALLOWED_EXTENSIONS)
        raise ValueError(f"Invalid file type. Allowed types are {allowed}")

    original_path1, original_path2 = None, None
    wav_path1, wav_path2 = None, None
    
    try:
        filename1 = secure_filename(file1.filename)
        filename2 = secure_filename(file2.filename)
        
        original_path1 = os.path.join(config.UPLOAD_FOLDER, filename1)
        original_path2 = os.path.join(config.UPLOAD_FOLDER, filename2)
        
        file1.save(original_path1)
        file2.save(original_path2)
        
        wav_path1 = convert_to_wav(original_path1)
        wav_path2 = convert_to_wav(original_path2)
        
        score, prediction = verification.verify_files(wav_path1, wav_path2)
        
        return {
            "score": float(score[0]),
            "same_speaker": bool(prediction[0])
        }
    finally:
        files_to_remove = [original_path1, original_path2, wav_path1, wav_path2]
        for path in files_to_remove:
            if path and os.path.exists(path):
                os.remove(path)
