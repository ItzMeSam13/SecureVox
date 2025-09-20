import os
import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np

SPECTROGRAM_FOLDER = "reports/spectrograms"
os.makedirs(SPECTROGRAM_FOLDER, exist_ok=True)

def generate_spectrogram(file_path):
    y, sr = librosa.load(file_path, sr=None)
    plt.figure(figsize=(10, 4))
    D = librosa.amplitude_to_db(abs(librosa.stft(y)), ref=np.max)
    librosa.display.specshow(D, sr=sr, x_axis="time", y_axis="log")
    plt.colorbar(format="%+2.0f dB")
    plt.title("Spectrogram")
    plt.tight_layout()

    base_name = os.path.splitext(os.path.basename(file_path))[0]
    filename = f"{base_name}_spectrogram.png"
    plt.savefig(os.path.join(SPECTROGRAM_FOLDER, filename))
    plt.close()

    return filename  # return only the filename
