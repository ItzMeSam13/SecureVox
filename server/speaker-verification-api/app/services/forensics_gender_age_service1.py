# services/forensics_speaker_traits_service.py

import os
import torch
import librosa
import numpy as np
from transformers import AutoProcessor, AutoModelForAudioClassification

# --- SSL Fix (if needed) ---
os.environ["HF_HUB_DISABLE_SSL_VERIFICATION"] = "1"

# --- Load pretrained models ---
# Gender-only model
gender_processor = AutoProcessor.from_pretrained(
    "prithivMLmods/Common-Voice-Gender-Detection",
    trust_remote_code=True
)
gender_model = AutoModelForAudioClassification.from_pretrained(
    "prithivMLmods/Common-Voice-Gender-Detection",
    trust_remote_code=True
)

# Age + Gender model
age_gender_processor = AutoProcessor.from_pretrained(
    "audeering/wav2vec2-large-robust-24-ft-age-gender",
    trust_remote_code=True
)
age_gender_model = AutoModelForAudioClassification.from_pretrained(
    "audeering/wav2vec2-large-robust-24-ft-age-gender",
    trust_remote_code=True
)


def predict_speaker_traits(file_path: str):
    """
    Predict gender and age group from an audio file.
    Returns a dict with results.
    """

    # Load audio
    speech, sr = librosa.load(file_path, sr=16000)

    # ---- Gender Detection ----
    gender_inputs = gender_processor(speech, sampling_rate=16000, return_tensors="pt", padding=True)
    with torch.no_grad():
        gender_logits = gender_model(**gender_inputs).logits
    gender_pred_id = torch.argmax(gender_logits, dim=-1).item()
    gender_label = gender_model.config.id2label[gender_pred_id]

    # ---- Age + Gender Detection ----
    age_inputs = age_gender_processor(speech, sampling_rate=16000, return_tensors="pt", padding=True)
    with torch.no_grad():
        age_logits = age_gender_model(**age_inputs).logits
    age_pred_id = torch.argmax(age_logits, dim=-1).item()
    age_label = age_gender_model.config.id2label[age_pred_id]

    return {
        "gender_estimation": gender_label,
        "age_group_estimation": age_label,
        "forensic_conclusion": f"Voice characteristics suggest {gender_label}, likely {age_label}."
    }


# --- Example run ---
if __name__ == "__main__":
    test_file = "test_audio.wav"  # replace with your audio path
    if os.path.exists(test_file):
        result = predict_speaker_traits(test_file)
        print(result)
    else:
        print("⚠️ Test audio file not found. Please provide a .wav file.")


def predict_speaker_traits(file_path: str):
    """
    Predict gender and age group from an audio file.
    Returns a dict with results.
    """

    # Load audio
    speech, sr = librosa.load(file_path, sr=16000)

    # ---- Gender Detection ----
    gender_inputs = gender_processor(speech, sampling_rate=16000, return_tensors="pt", padding=True)
    with torch.no_grad():
        gender_logits = gender_model(**gender_inputs).logits
    gender_pred_id = torch.argmax(gender_logits, dim=-1).item()
    gender_label = gender_model.config.id2label[gender_pred_id]

    # ---- Age + Gender Detection ----
    age_inputs = age_gender_processor(speech, sampling_rate=16000, return_tensors="pt", padding=True)
    with torch.no_grad():
        age_logits = age_gender_model(**age_inputs).logits
    age_pred_id = torch.argmax(age_logits, dim=-1).item()
    age_label = age_gender_model.config.id2label[age_pred_id]

    return {
        "gender_estimation": gender_label,
        "age_group_estimation": age_label,
        "forensic_conclusion": f"Voice characteristics suggest {gender_label}, likely {age_label}."
    }


# --- Example run ---
if __name__ == "__main__":
    test_file = "test_audio.wav"  # replace with your audio path
    if os.path.exists(test_file):
        result = predict_speaker_traits(test_file)
        print(result)
    else:
        print("⚠️ Test audio file not found. Please provide a .wav file.")
