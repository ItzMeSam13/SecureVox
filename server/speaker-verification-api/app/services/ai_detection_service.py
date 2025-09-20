import torch
import torchaudio
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

class VoiceDetector:
    def __init__(self):
        model_name = "mo-thecreator/Deepfake-audio-detection"  # example model
        
        # Use AutoFeatureExtractor instead of AutoProcessor
        self.feature_extractor = AutoFeatureExtractor.from_pretrained(model_name)
        self.model = AutoModelForAudioClassification.from_pretrained(model_name)

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)

    def is_synthetic(self, audio_file_path):
        try:
            # Load and resample audio
            speech, rate = torchaudio.load(audio_file_path)
            speech = torchaudio.functional.resample(speech, rate, 16000)
            speech = speech.squeeze().numpy()

            # Prepare input
            inputs = self.feature_extractor(
                speech,
                sampling_rate=16000,
                return_tensors="pt"
            ).input_values.to(self.device)

            # Forward pass
            with torch.no_grad():
                logits = self.model(inputs).logits

            predicted_class_id = logits.argmax(-1).item()
            labels = ["synthetic", "real"]
            predicted_label = labels[predicted_class_id]
            score = torch.softmax(logits, dim=-1)[0][predicted_class_id].item()

            return {"label": predicted_label, "score": score}

        except Exception as e:
            return {"error": str(e)}
