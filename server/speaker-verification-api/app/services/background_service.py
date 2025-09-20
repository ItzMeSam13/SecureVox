import librosa
import numpy as np
import tempfile

def analyze_background_noise(file1, file2=None):
    """
    Analyze background noise consistency.
    If one file: check internal consistency (different segments of same file).
    If two files: compare mean noise levels between them.
    """

    def get_noise_features(file):
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp:
            file.save(temp.name)
            y, sr = librosa.load(temp.name, sr=None)
        
        # RMS energy
        rms = librosa.feature.rms(y=y)[0]
        noise = rms[rms < np.percentile(rms, 25)]  # low-energy = background

        return {
            "mean_rms": float(np.mean(noise)) if len(noise) > 0 else 0,
            "variation": float(np.std(noise)) if len(noise) > 0 else 0,
            "segments": int(len(noise))
        }

    f1 = get_noise_features(file1)

    if file2:  # Compare two files
        f2 = get_noise_features(file2)
        diff = abs(f1["mean_rms"] - f2["mean_rms"])
        return {
            "background_noise_consistency": "Consistent" if diff < 0.002 else "Inconsistent / Edited",
            "mean_rms_file1": f1["mean_rms"],
            "mean_rms_file2": f2["mean_rms"],
            "difference": diff,
            "segments_file1": f1["segments"],
            "segments_file2": f2["segments"]
        }
    else:  # Single file
        return {
            "background_noise_consistency": "Consistent" if f1["variation"] < 0.002 else "Inconsistent / Edited",
            "mean_rms": f1["mean_rms"],
            "variation": f1["variation"],
            "segments_analyzed": f1["segments"]
        }
