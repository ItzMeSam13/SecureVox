import os
from werkzeug.utils import secure_filename
from speechbrain.inference.speaker import SpeakerRecognition
from .. import config
from ..utils.audio_converter import convert_to_wav

verification = SpeakerRecognition.from_hparams(
    source=config.MODEL_SOURCE,
    savedir=config.MODEL_SAVEDIR
)

ALLOWED_EXTENSIONS = {"wav", "mp3", "flac", "ogg", "m4a"}


def _allowed_file(file_or_path):
    """
    Works with both FileStorage objects and string paths.
    """
    if hasattr(file_or_path, "filename"):  # Flask upload
        filename = file_or_path.filename
    else:  # already a path
        filename = os.path.basename(file_or_path)
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def process_and_verify_files(file1, file2):
    """
    Accepts either Flask FileStorage objects OR string file paths.
    Converts both to wav and verifies speakers.
    """

    # 🔹 Handle FileStorage objects
    if hasattr(file1, "save") and hasattr(file2, "save"):
        filename1 = secure_filename(file1.filename)
        filename2 = secure_filename(file2.filename)

        original_path1 = os.path.join(config.UPLOAD_FOLDER, filename1)
        original_path2 = os.path.join(config.UPLOAD_FOLDER, filename2)

        file1.save(original_path1)
        file2.save(original_path2)

    # 🔹 Handle string paths (already saved)
    else:
        original_path1 = file1
        original_path2 = file2

    if not (_allowed_file(original_path1) and _allowed_file(original_path2)):
        allowed = list(ALLOWED_EXTENSIONS)
        raise ValueError(f"Invalid file type. Allowed types are {allowed}")

    wav_path1, wav_path2 = None, None
    try:
        # Convert both to wav for consistency
        wav_path1 = convert_to_wav(original_path1)
        wav_path2 = convert_to_wav(original_path2)

        # Run speaker verification
        score, prediction = verification.verify_files(wav_path1, wav_path2)

        return {
            "score": float(score[0]),
            "same_speaker": bool(prediction[0]),
        }

    finally:
        # Clean up temporary wavs only
        for path in [wav_path1, wav_path2]:
            if path and os.path.exists(path):
                os.remove(path)
