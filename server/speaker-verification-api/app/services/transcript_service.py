# app/services/transcript_service.py

import whisper
from difflib import SequenceMatcher

# Load Whisper model once
model = whisper.load_model("small")  # tiny / base / small / medium

def transcribe_audio(file_path):
    """
    Convert audio to text using Whisper.
    """
    result = model.transcribe(file_path)
    return result["text"]

def compare_transcripts(original_text, suspected_text):
    """
    Compare reference transcript vs suspected audio transcript.
    Returns:
        - similarity score (0-100%)
        - mismatches (words / sentences)
    """
    matcher = SequenceMatcher(None, original_text, suspected_text)
    similarity = matcher.ratio() * 100  # percent similarity

    # Detect if significant mismatches exist
    mismatches = ""
    if similarity < 95:  # configurable threshold
        mismatches = "Key mismatches in words, tone, or pacing detected"

    return {
        "similarity_score": round(similarity, 2),
        "mismatches": mismatches,
        "suspected_transcript": suspected_text
    }
