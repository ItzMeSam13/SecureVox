import librosa
import numpy as np
import tempfile

def analyze_background_noise(file1, file2=None):
    """
    Analyze background noise consistency.
    If one file: check internal consistency (different segments of same file).
    If two files: compare mean noise levels between them.
    """

def get_noise_features(file_path):
    """
    Extract background noise features from an audio file.
    Accepts a file path string.
    """
    try:
        y, sr = librosa.load(file_path, sr=None)

        # RMS energy
        rms = librosa.feature.rms(y=y)[0]
        # low-energy = background
        noise = rms[rms < np.percentile(rms, 25)]

        return {
            "mean_rms": float(np.mean(noise)) if len(noise) > 0 else 0,
            "variation": float(np.std(noise)) if len(noise) > 0 else 0,
            "segments": int(len(noise)),
        }
    except Exception as e:
        print(f"Error processing audio file {file_path}: {e}")
        return {"mean_rms": 0, "variation": 0, "segments": 0}


def analyze_background_noise(file1, file2=None):
    """
    Analyze background noise features for one or two files.
    Accepts file paths.
    """
    f1 = get_noise_features(file1)

    if file2:  # Compare two files
        f2 = get_noise_features(file2)
        diff = abs(f1["mean_rms"] - f2["mean_rms"])
        return {
            "file1": f1,
            "file2": f2,
            "mean_rms_diff": diff,
            "is_significant_diff": diff > 0.05,  # Example threshold
        }

    return {"file1_features": f1}