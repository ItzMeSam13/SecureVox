# services/forensics_full_service.py
import os
import hashlib
import tempfile
from datetime import datetime

import numpy as np
import soundfile as sf
from pydub import AudioSegment
from pydub.utils import mediainfo
import librosa
import librosa.display
import matplotlib.pyplot as plt

from flask import Blueprint, request, jsonify

forensics_full_bp = Blueprint('forensics_full', __name__)

# ---------------------- SPECTROGRAM FUNCTIONS ----------------------
def generate_spectrogram(file_path, save_dir='forensics_spectrograms'):
    y, sr = librosa.load(file_path, sr=None)
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    S_db = librosa.amplitude_to_db(S, ref=np.max)

    os.makedirs(save_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    img_path = os.path.join(save_dir, f"spectrogram_{timestamp}.png")

    plt.figure(figsize=(12, 6))
    librosa.display.specshow(S_db, sr=sr, x_axis='time', y_axis='hz', cmap='magma')
    plt.colorbar(format='%+2.0f dB')
    plt.title('Forensic Spectrogram')
    plt.tight_layout()
    plt.savefig(img_path)
    plt.close()

    return S_db, sr, y, img_path

def analyze_spectrogram(S_db, y, sr):
    frame_energy = np.sum(S_db**2, axis=0)
    avg_energy = float(np.mean(frame_energy))
    energy_std = float(np.std(frame_energy))

    silent_frames = np.sum(S_db < -50)
    total_frames = S_db.shape[1]
    percent_silence = round((silent_frames / total_frames) * 100, 2)

    mean_freq = np.mean(S_db, axis=1)
    spikes = np.where(mean_freq > np.mean(mean_freq) + 3*np.std(mean_freq))[0]
    num_frequency_spikes = len(spikes)

    low_freq_var = np.var(S_db[:int(2000 * S_db.shape[0]/sr), :])
    diff_energy = np.diff(frame_energy)
    num_abrupt_changes = int(np.sum(np.abs(diff_energy) > 5))

    analysis = {
        'average_energy': avg_energy,
        'energy_std': energy_std,
        'percent_silence_spectro': percent_silence,
        'num_frequency_spikes': num_frequency_spikes,
        'low_freq_variance': float(low_freq_var),
        'num_abrupt_changes': num_abrupt_changes
    }

    return analysis

# ---------------------- METADATA FUNCTIONS ----------------------
def extract_audio_metadata(file_path):
    y, sr = sf.read(file_path)
    file_size = os.path.getsize(file_path)
    with open(file_path, 'rb') as f:
        md5_hash = hashlib.md5(f.read()).hexdigest()

    # Bitrate
    info = mediainfo(file_path)
    bitrate = int(info.get('bit_rate', 0)) if info.get('bit_rate') else 0

    # Bitrate stability
    try:
        audio = AudioSegment.from_file(file_path)
        chunk_ms = 1000
        chunks = [audio[i:i+chunk_ms] for i in range(0, len(audio), chunk_ms)]
        bitrate_list = [len(c.raw_data)*8 for c in chunks]
        avg_bitrate = float(np.mean(bitrate_list))
        var_bitrate = float(np.var(bitrate_list))
        rel_var = var_bitrate / (avg_bitrate**2) if avg_bitrate else 0
        bitrate_stable = rel_var < 0.02
    except:
        avg_bitrate = None
        var_bitrate = None
        bitrate_stable = None
        rel_var = None

    # Silence
    threshold = 1e-4
    silent_samples = np.sum(np.abs(y) < threshold)
    percent_silence = round((silent_samples / len(y)) * 100, 2)

    metadata = {
        'duration_sec': float(len(y)/sr),
        'sampling_rate': int(sr),
        'file_size_bytes': int(file_size),
        'md5_hash': str(md5_hash),
        'bitrate': int(bitrate) if bitrate else None,
        'bitrate_avg': float(avg_bitrate) if avg_bitrate else None,
        'bitrate_variance': float(var_bitrate) if var_bitrate else None,
        'bitrate_stable': bool(bitrate_stable) if bitrate_stable is not None else None,
        'bitrate_relative_variance': float(rel_var) if rel_var is not None else None,
        'percent_silence': float(percent_silence)
    }

    return metadata

# ---------------------- COMBINED FORENSIC ANALYSIS ----------------------
def generate_forensic_conclusion(metadata, spectro_analysis):
    anomalies = []

    # Bitrate anomaly
    if metadata['bitrate_relative_variance'] and metadata['bitrate_relative_variance'] > 0.02:
        anomalies.append("Bitrate variation unusually high; potential edits or synthetic audio.")

    # Silence anomaly
    if metadata['percent_silence'] > 50:
        anomalies.append("High silence content; possible tampering or low activity.")

    # Spectrogram anomalies
    if spectro_analysis['num_abrupt_changes'] > 50:
        anomalies.append("Abrupt temporal changes detected; possible audio editing.")
    if spectro_analysis['num_frequency_spikes'] > 30:
        anomalies.append("High-frequency spikes detected; potential synthetic artifacts.")

    if not anomalies:
        anomalies.append("No significant anomalies detected.")

    return anomalies

# ---------------------- ROUTE ----------------------
@forensics_full_bp.route('/analyze_forensic', methods=['POST'])
def analyze_audio_forensic():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        # Metadata
        metadata = extract_metadata(tmp_path)

        # Spectrogram
        S_db, sr, y, img_path = generate_spectrogram(tmp_path)
        spectro_analysis = analyze_spectrogram(S_db, y, sr)
        spectro_analysis['spectrogram_image'] = img_path

        # Forensic conclusion
        forensic_conclusion = generate_forensic_conclusion(metadata, spectro_analysis)

        # Combine all
        result = {
            'metadata': metadata,
            'spectrogram_analysis': spectro_analysis,
            'forensic_conclusion': forensic_conclusion
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

