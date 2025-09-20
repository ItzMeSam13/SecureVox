import cv2
import numpy as np

def analyze_spectrogram(spectrogram_path):
    """
    Reads a spectrogram image and extracts forensic metrics.
    Returns a dictionary of values to add to the PDF.
    """
    # Read image in grayscale
    img = cv2.imread(spectrogram_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Spectrogram not found: {spectrogram_path}")

    # Basic metrics
    max_intensity = np.max(img)
    mean_intensity = np.mean(img)
    min_intensity = np.min(img)
    std_intensity = np.std(img)

    # Detect bright spots / anomalies
    _, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY)
    anomaly_count = cv2.countNonZero(thresh)

    # Highlight anomalies and save
    img_color = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        cv2.rectangle(img_color, (x, y), (x + w, y + h), (0, 0, 255), 1)
    highlighted_path = spectrogram_path.replace(".png", "_highlighted.png")
    cv2.imwrite(highlighted_path, img_color)

    # Return forensic info
    return {
        "max_intensity": max_intensity,
        "mean_intensity": mean_intensity,
        "min_intensity": min_intensity,
        "std_intensity": std_intensity,
        "anomaly_count": anomaly_count,
        "highlighted_path": highlighted_path
    }
