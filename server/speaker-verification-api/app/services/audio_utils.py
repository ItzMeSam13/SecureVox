# app/services/audio_utils.py
import os
from io import BytesIO
from pydub import AudioSegment

def preprocess_audio(file, output_dir="uploads"):
    """
    Normalize uploaded audio to WAV 16kHz mono.
    Returns the file path for downstream processing.
    """
    os.makedirs(output_dir, exist_ok=True)
    filename = file.filename
    safe_filename = filename.replace(" ", "_")
    output_path = os.path.join(output_dir, safe_filename)

    # Reset file pointer in case it was read before
    file.seek(0)
    
    # Convert to standard WAV using Pydub
    audio = AudioSegment.from_file(BytesIO(file.read()), format="wav")
    audio = audio.set_frame_rate(16000).set_channels(1)
    audio.export(output_path, format="wav")
    
    return output_path
