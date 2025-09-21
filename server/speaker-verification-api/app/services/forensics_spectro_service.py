# services/forensics_spectro_service.py
import os
from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt
import librosa
import librosa.display
import soundfile as sf

def load_audio_safe(file_path):
    """
    Load audio safely, convert to mono if needed.
    """
    y, sr = sf.read(file_path)
    # Convert to mono if stereo
    if len(y.shape) > 1:
        y = np.mean(y, axis=1)
    return y, sr

def generate_spectrogram(file_path, save_dir='forensics_spectrograms'):
    """
    Generate spectrogram image and return spectrogram matrix and audio data.
    """
    # Load audio safely
    y, sr = load_audio_safe(file_path)

    # Compute STFT spectrogram
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    S_db = librosa.amplitude_to_db(S, ref=np.max)

    # Ensure save directory exists
    os.makedirs(save_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    img_path = os.path.join(save_dir, f"spectrogram_{timestamp}.png")

    # Plot spectrogram
    plt.figure(figsize=(12, 6))
    librosa.display.specshow(S_db, sr=sr, x_axis='time', y_axis='hz', cmap='magma')
    plt.colorbar(format='%+2.0f dB')
    plt.title('Forensic Spectrogram')
    plt.tight_layout()
    plt.savefig(img_path)
    plt.close()

    return S_db, sr, y, img_path

def analyze_spectrogram(S_db, y, sr):
    """
    Deep forensic spectrogram analysis using frame-wise + band-wise metrics.
    """
    analysis = {}

    # --- Frame-wise energy ---
    frame_energy = np.sum(S_db**2, axis=0)
    analysis['average_energy'] = float(np.mean(frame_energy))
    analysis['energy_std'] = float(np.std(frame_energy))
    
    # --- Silence detection per frame ---
    threshold = np.mean(S_db) - np.std(S_db)
    silent_frames = np.sum(S_db < threshold)
    total_frames = S_db.shape[1]
    analysis['percent_silence'] = round((silent_frames / total_frames) * 100, 2)

    # --- Frequency spikes ---
    mean_freq = np.mean(S_db, axis=1)
    spikes = np.where(mean_freq > np.mean(mean_freq) + 3*np.std(mean_freq))[0]
    analysis['num_frequency_spikes'] = int(len(spikes))

    # --- Low-frequency consistency (background noise) ---
    low_freq = S_db[:int(500 * S_db.shape[0]/sr), :]
    analysis['low_freq_variance'] = float(np.var(low_freq))

    # --- Abrupt temporal changes ---
    frame_diff = np.diff(frame_energy)
    abrupt_changes = np.sum(np.abs(frame_diff) > 2*np.std(frame_diff))
    analysis['num_abrupt_changes'] = int(abrupt_changes)

    # --- Frame-wise spectral flatness ---
    flatness = librosa.feature.spectral_flatness(y=y, n_fft=2048, hop_length=512)
    analysis['spectral_flatness_mean'] = float(np.mean(flatness))
    analysis['spectral_flatness_std'] = float(np.std(flatness))

    # --- Spectral entropy per frame ---
    ps = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))**2
    ps_norm = ps / (np.sum(ps, axis=0, keepdims=True) + 1e-8)
    entropy = -np.sum(ps_norm * np.log2(ps_norm + 1e-8), axis=0)
    analysis['spectral_entropy_mean'] = float(np.mean(entropy))
    analysis['spectral_entropy_std'] = float(np.std(entropy))

    # --- Mel-band variance (low/mid/high) ---
    S_mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=40)
    S_mel_db = librosa.power_to_db(S_mel, ref=np.max)
    analysis['mel_low_var'] = float(np.var(S_mel_db[:10, :]))
    analysis['mel_mid_var'] = float(np.var(S_mel_db[10:30, :]))
    analysis['mel_high_var'] = float(np.var(S_mel_db[30:, :]))

    return analysis

def generate_forensic_report(metrics):
    """
    Generate police-style forensic report from deep metrics.
    """
    report = {}

    # Energy
    if metrics['average_energy'] < 1e5:
        report['energy'] = "Audio signal is very quiet; may indicate filtering or processing."
    elif metrics['energy_std'] > 1e6:
        report['energy'] = "Sudden energy fluctuations detected; potential edits/splices."
    else:
        report['energy'] = "Audio energy is consistent with normal recording."

    # Silence
    if metrics['percent_silence'] > 50:
        report['silence'] = f"High silence content ({metrics['percent_silence']:.2f}%); possible cuts or tampering."
    else:
        report['silence'] = "Background audio has natural pauses."

    # Frequency spikes
    if metrics['num_frequency_spikes'] > 20:
        report['frequency_spikes'] = "Unusual frequency spikes detected; may indicate AI artifacts or audio manipulation."
    else:
        report['frequency_spikes'] = "Frequency content appears normal."

    # Background consistency
    if metrics['low_freq_variance'] < 1:
        report['background_noise'] = "Low-frequency background too uniform; possibly artificial."
    else:
        report['background_noise'] = "Background noise pattern appears authentic."

    # Abrupt changes
    if metrics['num_abrupt_changes'] > 50:
        report['temporal_integrity'] = "Multiple abrupt energy changes detected; potential audio edits or splicing."
    else:
        report['temporal_integrity'] = "Temporal energy distribution appears consistent."

    # Spectral flatness
    if metrics['spectral_flatness_mean'] < 0.02:
        report['spectral_flatness'] = "Spectral flatness is very low; may indicate synthetic / AI-generated voice."
    else:
        report['spectral_flatness'] = "Spectral flatness appears normal."

    # Spectral entropy
    if metrics['spectral_entropy_mean'] < 3:
        report['spectral_entropy'] = "Low spectral entropy detected; audio may be generated or heavily processed."
    else:
        report['spectral_entropy'] = "Spectral entropy consistent with natural recording."

    # Mel-band variance
    report['mel_low_var'] = metrics['mel_low_var']
    report['mel_mid_var'] = metrics['mel_mid_var']
    report['mel_high_var'] = metrics['mel_high_var']

    # Include spectrogram image
    if metrics.get('spectrogram_image'):
        report['spectrogram_image'] = metrics['spectrogram_image']

    return report
