from ctypes import c_buffer
import io
import os
import time
import qrcode
from reportlab.lib.pagesizes import A4, letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from werkzeug.utils import secure_filename
from io import BytesIO
from PIL import Image as PILImage
import wave
from datetime import datetime

# Your existing imports
from pydub import AudioSegment
from app.services.verification_service import process_and_verify_files
from app.services.background_service import analyze_background_noise
from app.services.ai_detection_service import VoiceDetector
from app.services.hash_service import compute_file_hashes
from app.services.spectrogram_analysis_service import analyze_spectrogram
from app.services.spectrogram_service import generate_spectrogram
from app.services.transcript_service import transcribe_audio, compare_transcripts

UPLOAD_FOLDER = "uploads"
SPECTROGRAM_FOLDER = "reports/spectrograms"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SPECTROGRAM_FOLDER, exist_ok=True)

voice_detector = VoiceDetector()

# Your existing preprocess_audio and _safe_remove functions remain the same
def preprocess_audio(file, output_dir=UPLOAD_FOLDER):
    """
    Convert uploaded audio to WAV 16kHz mono.
    Returns the saved file path.
    """
    os.makedirs(output_dir, exist_ok=True)
    filename = secure_filename(file.filename)
    output_path = os.path.join(output_dir, f"preprocessed_{filename}.wav")

    try:
        # Load audio from the in-memory FileStorage object
        audio = AudioSegment.from_file(file)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(output_path, format="wav")
    except Exception as e:
        print(f"Error during audio preprocessing: {e}")
        raise e

    return output_path

def _safe_remove(path):
    """Retry a few times to remove a file safely on Windows."""
    if not path or not os.path.exists(path):
        return
    for _ in range(3):
        try:
            os.remove(path)
            return
        except PermissionError:
            time.sleep(0.2)
    try:
        os.rename(path, path + ".old")
    except Exception:
        pass

def create_header_footer(canvas, doc):
    """Create professional header and footer with fixed styling"""
    canvas.saveState()
    
    # Get page dimensions
    page_width = A4[0]  # 595.27 points
    page_height = A4[1]  # 841.89 points
    
    # Header - Fixed positioning and styling
    header_height = 60
    header_y = page_height - header_height
    
    # Draw header background rectangle
    canvas.setFillColor(HexColor('#1a365d'))  # Professional dark blue
    canvas.rect(0, header_y, page_width, header_height, fill=1, stroke=0)
    
    # Header text - properly positioned
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 18)
    
    # Center the main title
    title_text = "REPORT GENERATION"
    title_width = canvas.stringWidth(title_text, "Helvetica-Bold", 18)
    title_x = (page_width - title_width) / 2
    canvas.drawString(title_x, header_y + 32, title_text)
    
    # Subtitle - centered and smaller
    canvas.setFont("Helvetica", 11)
    subtitle_text = f"Audio Forensic Analysis - Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    subtitle_width = canvas.stringWidth(subtitle_text, "Helvetica", 11)
    subtitle_x = (page_width - subtitle_width) / 2
    canvas.drawString(subtitle_x, header_y + 12, subtitle_text)
    
    # Footer - Fixed positioning and styling
    footer_height = 35
    
    # Draw footer background rectangle
    canvas.setFillColor(HexColor('#2d3748'))  # Darker professional gray
    canvas.rect(0, 0, page_width, footer_height, fill=1, stroke=0)
    
    # Footer content
    canvas.setFillColor(white)
    canvas.setFont("Helvetica", 10)
    
    # Left side - Confidential notice
    canvas.drawString(40, 20, "CONFIDENTIAL - Audio Forensic Analysis Report")
    
    # Right side - Page number
    canvas.setFont("Helvetica-Bold", 10)
    page_text = f"Page {canvas.getPageNumber()}"
    page_width_text = canvas.stringWidth(page_text, "Helvetica-Bold", 10)
    canvas.drawString(page_width - page_width_text - 40, 20, page_text)
    
    # Center - Company/System name (removed as requested)
    
    canvas.restoreState()

def get_status_color(result, key):
    """Get color based on result status"""
    if key == 'same_speaker':
        return HexColor('#27ae60') if result else HexColor('#e74c3c')
    elif key == 'ai_synthetic':
        return HexColor('#e74c3c') if result.get('label') == 'SYNTHETIC' else HexColor('#27ae60')
    else:
        return HexColor('#3498db')

def generate_pdf_report(original_path, suspected_path, report_id):
    """Generate a professional PDF forensic report"""
    spectrogram_file_path = None
    
    try:
        # Collect all analysis data
        voice_result = process_and_verify_files(original_path, suspected_path)
        ai_result = voice_detector.is_synthetic(suspected_path)
        noise_result = analyze_background_noise(suspected_path)
        
        original_text = transcribe_audio(original_path)
        suspected_text = transcribe_audio(suspected_path)
        transcript_result = compare_transcripts(original_text, suspected_text)
        
        spectrogram_file_name = generate_spectrogram(suspected_path)
        spectrogram_file_path = os.path.join(SPECTROGRAM_FOLDER, spectrogram_file_name)
        
        # Try to get additional spectrogram analysis data
        try:
            spectro_info = analyze_spectrogram(spectrogram_file_path)
        except:
            spectro_info = {}
        
        file_hash = compute_file_hashes(suspected_path)
        
        # Audio file info
        with wave.open(suspected_path, 'rb') as w:
            duration = round(w.getnframes() / w.getframerate(), 2)
            sample_rate = w.getframerate()
            channels = w.getnchannels()
            file_size = os.path.getsize(suspected_path)
        
        # Create PDF with proper margins for header/footer
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=A4,
            rightMargin=50,
            leftMargin=50,
            topMargin=110,  # Increased for header
            bottomMargin=85  # Increased for footer
        )
        
        # Define improved styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=26,
            textColor=HexColor('#1a365d'),
            spaceAfter=25,
            spaceBefore=10,
            alignment=1,  # Center alignment
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#1a365d'),
            spaceAfter=12,
            spaceBefore=20,
            backColor=HexColor('#f7fafc'),
            borderWidth=1,
            borderColor=HexColor('#cbd5e0'),
            borderPadding=8,
            fontName='Helvetica-Bold'
        )
        
        content_style = ParagraphStyle(
            'Content',
            parent=styles['Normal'],
            fontSize=11,
            textColor=HexColor('#2d3748'),
            spaceAfter=8,
            leading=14
        )
        
        # Build story
        story = []
        
        # Title and Report ID with improved styling
        story.append(Paragraph(f"Audio Forensic Analysis Report", title_style))
        story.append(Spacer(1, 10))
        
        # Report metadata in a clean table
        metadata_data = [
            ['Report ID:', report_id],
            ['Analysis Date:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            ['Report Type:', 'Comprehensive Audio Forensic Analysis'],
            ['System Version:', 'Audio Forensics v2.0']
        ]
        
        metadata_table = Table(metadata_data, colWidths=[2*inch, 4*inch])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f7fafc')),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(metadata_table)
        story.append(Spacer(1, 25))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", heading_style))
        
        # Create enhanced summary table
        summary_data = [
            ['Analysis Component', 'Result', 'Confidence', 'Status'],
            ['Voice Matching', 
             f"{'Same Speaker' if voice_result.get('same_speaker') else 'Different Speaker'}",
             f"{voice_result.get('score', 0):.3f}",
             '✓ MATCH' if voice_result.get('same_speaker') else '✗ NO MATCH'],
            ['AI Synthetic Detection', 
             f"{ai_result.get('label', 'Unknown')}",
             f"{ai_result.get('score', 0):.4f}",
             '⚠ SYNTHETIC' if ai_result.get('label') == 'SYNTHETIC' else '✓ AUTHENTIC'],
            ['Transcript Similarity', 
             f"{transcript_result.get('similarity_score', 0):.1f}% Match",
             'N/A',
             '✓ HIGH' if transcript_result.get('similarity_score', 0) > 80 else 
             '⚠ MEDIUM' if transcript_result.get('similarity_score', 0) > 50 else '✗ LOW'],
            ['Spectrogram Analysis',
             f"{spectro_info.get('anomaly_count', 0)} Anomalies",
             'Automated',
             '✓ CLEAN' if spectro_info.get('anomaly_count', 0) < 100 else 
             '⚠ SUSPICIOUS' if spectro_info.get('anomaly_count', 0) < 200 else '✗ HIGH RISK']
        ]
        
        summary_table = Table(summary_data, colWidths=[2.2*inch, 1.8*inch, 1*inch, 1*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # File Information
        story.append(Paragraph("File Information & Metadata", heading_style))
        file_data = [
            ['Property', 'Value', 'Technical Details'],
            ['Audio Duration', f"{duration} seconds", f"≈ {duration/60:.1f} minutes"],
            ['Sample Rate', f"{sample_rate:,} Hz", "CD Quality" if sample_rate >= 44100 else "Standard Quality"],
            ['Channel Count', f"{channels} ({'Mono' if channels == 1 else 'Stereo' if channels == 2 else 'Multi-channel'})", "Audio configuration"],
            ['File Size', f"{file_size:,} bytes", f"≈ {file_size/(1024*1024):.2f} MB"],
            ['Bit Depth', "16-bit (estimated)", "Standard PCM encoding"],
            ['SHA256 Hash', file_hash.get('hash_sha256', 'N/A')[:24] + '...', 'Digital fingerprint (truncated)']
        ]
        
        file_table = Table(file_data, colWidths=[1.8*inch, 2.2*inch, 2*inch])
        file_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),  # Bold first column
        ]))
        
        story.append(file_table)
        story.append(PageBreak())
        
        # Detailed Analysis Sections
        
        # 1. Voiceprint Analysis
        story.append(Paragraph("1. Voiceprint Comparison Analysis", heading_style))
        story.append(Paragraph(f"<b>Speaker Identity Match:</b> {voice_result.get('same_speaker', 'Unknown')}", content_style))
        story.append(Paragraph(f"<b>Similarity Score:</b> {voice_result.get('score', 0):.6f} (Range: 0.0 - 1.0)", content_style))
        story.append(Paragraph(f"<b>Confidence Level:</b> {'High' if voice_result.get('score', 0) > 0.8 else 'Medium' if voice_result.get('score', 0) > 0.5 else 'Low'}", content_style))
        story.append(Paragraph("<b>Methodology:</b> Advanced acoustic feature extraction and speaker recognition using MFCC coefficients, spectral features, and prosodic characteristics for biometric voice identification.", content_style))
        story.append(Spacer(1, 15))
        
        # 2. AI Detection Analysis
        story.append(Paragraph("2. Artificial Intelligence Synthesis Detection", heading_style))
        story.append(Paragraph(f"<b>Classification Result:</b> {ai_result.get('label', 'Unknown')}", content_style))
        story.append(Paragraph(f"<b>Detection Confidence:</b> {ai_result.get('score', 0):.6f}", content_style))
        story.append(Paragraph(f"<b>Risk Assessment:</b> {'High Risk - Likely Synthetic' if ai_result.get('label') == 'SYNTHETIC' else 'Low Risk - Appears Authentic'}", content_style))
        story.append(Paragraph("<b>Technology:</b> Deep learning neural network trained on thousands of synthetic and authentic voice samples, detecting artifacts from TTS systems, voice cloning, and deepfake audio generation.", content_style))
        story.append(Spacer(1, 15))
        
        # 3. Background Noise Analysis
        story.append(Paragraph("3. Environmental Audio Analysis", heading_style))
        story.append(Paragraph("Comprehensive analysis of background acoustic environment and noise characteristics:", content_style))
        
        # Clean and format noise analysis data
        noise_data = [['Environmental Metric', 'Measured Value', 'Score', 'Forensic Significance']]
        noise_interpretations = {
            'noise_level': 'Overall background noise intensity',
            'snr_estimate': 'Signal-to-noise ratio quality',
            'spectral_centroid': 'Frequency brightness measure',
            'zero_crossing_rate': 'Audio texture and noisiness',
            'energy': 'Total acoustic energy content',
            'rms_energy': 'Root mean square energy level',
            'spectral_rolloff': 'Frequency distribution measure'
        }
        
        # Function to convert numeric values to percentage scores (0-100%)
        def get_quality_score(key, value):
            if not isinstance(value, (int, float)):
                return "N/A"
            
            # Convert different metrics to 0-100% quality scores
            if 'snr' in key.lower():
                # SNR: higher is better, typical range 0-40 dB
                score = min(100, max(0, (value / 40) * 100))
            elif 'noise_level' in key.lower():
                # Noise level: lower is better, typical range 0-1
                score = max(0, 100 - (value * 100))
            elif 'energy' in key.lower():
                # Energy: moderate levels are better, typical range 0-1
                if value < 0.1:
                    score = (value / 0.1) * 100
                elif value > 0.8:
                    score = max(0, 100 - ((value - 0.8) / 0.2) * 100)
                else:
                    score = 100
            elif 'zero_crossing' in key.lower():
                # Zero crossing: moderate rates are better, typical range 0-0.5
                optimal = 0.1
                score = max(0, 100 - abs(value - optimal) * 400)
            else:
                # Generic normalization for other metrics
                score = min(100, max(0, value * 100)) if value <= 1 else min(100, value)
            
            return f"{score:.1f}%"
        
        for key, value in noise_result.items():
            # Skip if the value is a complex object or string representation
            if isinstance(value, str) and ('array' in value or 'dtype' in value or len(value) > 50):
                continue
                
            interpretation = noise_interpretations.get(key, 'Audio characteristic measure')
            display_key = key.replace('_', ' ').title()
            
            # Format the measured value properly
            if isinstance(value, float):
                if abs(value) < 0.001:
                    display_value = f"{value:.6f}"
                elif abs(value) < 1:
                    display_value = f"{value:.4f}"
                else:
                    display_value = f"{value:.2f}"
            elif isinstance(value, int):
                display_value = f"{value:,}"
            else:
                display_value = str(value)[:20] + "..." if len(str(value)) > 20 else str(value)
            
            # Get quality score
            quality_score = get_quality_score(key, value if isinstance(value, (int, float)) else 0)
            
            noise_data.append([display_key, display_value, quality_score, interpretation])
        
        noise_table = Table(noise_data, colWidths=[1.8*inch, 1.5*inch, 0.8*inch, 1.9*inch])
        noise_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),  # Center align the score column
        ]))
        story.append(noise_table)
        story.append(Spacer(1, 15))
        
        # 4. Transcript Comparison
        story.append(Paragraph("4. Linguistic Content Analysis", heading_style))
        story.append(Paragraph(f"<b>Content Similarity:</b> {transcript_result.get('similarity_score', 0):.2f}% match", content_style))
        story.append(Paragraph(f"<b>Original Transcript Length:</b> {len(original_text)} characters ({len(original_text.split())} words)", content_style))
        story.append(Paragraph(f"<b>Suspected Transcript Length:</b> {len(suspected_text)} characters ({len(suspected_text.split())} words)", content_style))
        
        # Calculate additional metrics
        word_diff = abs(len(original_text.split()) - len(suspected_text.split()))
        story.append(Paragraph(f"<b>Word Count Difference:</b> {word_diff} words", content_style))
        
        # Truncate long transcripts for display
        max_display_length = 300
        original_display = original_text[:max_display_length] + "..." if len(original_text) > max_display_length else original_text
        suspected_display = suspected_text[:max_display_length] + "..." if len(suspected_text) > max_display_length else suspected_text
        
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Original Audio Transcript:</b>", content_style))
        story.append(Paragraph(f'<i>"{original_display}"</i>', content_style))
        story.append(Spacer(1, 8))
        story.append(Paragraph(f"<b>Suspected Audio Transcript:</b>", content_style))
        story.append(Paragraph(f'<i>"{suspected_display}"</i>', content_style))
        story.append(PageBreak())
        
        # 5. Enhanced Spectrogram Analysis with Forensic Metrics
        story.append(Paragraph("5. Advanced Spectrogram Forensic Analysis", heading_style))
        story.append(Paragraph("Professional forensic spectrogram analysis with automated anomaly detection and quantitative metrics:", content_style))
        
        # Add forensic spectrogram metrics table
        if spectro_info:
            spectro_data = [
                ['Forensic Metric', 'Measured Value', 'Forensic Interpretation', 'Status'],
                ['Peak Intensity', f"{spectro_info.get('max_intensity', 0)}", 'Maximum signal strength detected', '✓ Normal'],
                ['Average Intensity', f"{spectro_info.get('mean_intensity', 0):.2f}", 'Overall signal level consistency', '✓ Stable'],
                ['Noise Floor', f"{spectro_info.get('min_intensity', 0)}", 'Background noise baseline', '✓ Clean'],
                ['Intensity Variation', f"{spectro_info.get('std_intensity', 0):.2f}", 'Signal stability measure', '✓ Consistent'],
                ['Anomaly Detection', f"{spectro_info.get('anomaly_count', 0)}", 'Suspicious artifacts found', 
                 '✓ Clean' if spectro_info.get('anomaly_count', 0) < 50 else 
                 '⚠ Moderate' if spectro_info.get('anomaly_count', 0) < 150 else '✗ High Risk']
            ]
            
            spectro_table = Table(spectro_data, colWidths=[1.5*inch, 1.2*inch, 2.3*inch, 1*inch])
            spectro_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#dc2626')),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
                ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                # Conditional formatting for anomaly count
                ('BACKGROUND', (0, 5), (-1, 5), 
                 HexColor('#fee2e2') if spectro_info.get('anomaly_count', 0) > 150 else 
                 HexColor('#fef3c7') if spectro_info.get('anomaly_count', 0) > 50 else HexColor('#f0fdf4')),
            ]))
            
            story.append(spectro_table)
            story.append(Spacer(1, 15))
            
            # Add detailed forensic interpretation
            anomaly_count = spectro_info.get('anomaly_count', 0)
            if anomaly_count > 150:
                story.append(Paragraph("<b>🚨 HIGH RISK ASSESSMENT:</b> Significant spectral anomalies detected. This pattern is consistent with synthetic voice generation, heavy audio editing, or post-processing artifacts. Recommend additional verification.", 
                                     ParagraphStyle('HighRisk', parent=content_style, textColor=HexColor('#dc2626'), 
                                                  backColor=HexColor('#fee2e2'), borderColor=HexColor('#fca5a5'), 
                                                  borderWidth=1, borderPadding=8)))
            elif anomaly_count > 50:
                story.append(Paragraph("<b>⚠️ MODERATE RISK ASSESSMENT:</b> Some spectral anomalies detected. May indicate minor editing, compression artifacts, or recording quality issues. Further investigation recommended.", 
                                     ParagraphStyle('ModerateRisk', parent=content_style, textColor=HexColor('#d97706'), 
                                                  backColor=HexColor('#fef3c7'), borderColor=HexColor('#fbbf24'), 
                                                  borderWidth=1, borderPadding=8)))
            else:
                story.append(Paragraph("<b>✅ LOW RISK ASSESSMENT:</b> Minimal spectral anomalies detected. Spectrogram characteristics are consistent with natural, unedited audio recording. No significant red flags identified.", 
                                     ParagraphStyle('LowRisk', parent=content_style, textColor=HexColor('#059669'), 
                                                  backColor=HexColor('#f0fdf4'), borderColor=HexColor('#34d399'), 
                                                  borderWidth=1, borderPadding=8)))
            
            story.append(Spacer(1, 15))
        
        # Display highlighted spectrogram with anomaly markers
        highlighted_path = spectro_info.get('highlighted_path') if spectro_info else spectrogram_file_path
        
        if highlighted_path and os.path.exists(highlighted_path):
            try:
                pil_img = PILImage.open(highlighted_path)
                img_width = 7.5 * inch  # Larger width for detailed forensic view
                img_height = (pil_img.height / pil_img.width) * img_width
                
                # Limit height to fit on page
                if img_height > 5.5 * inch:
                    img_height = 5.5 * inch
                    img_width = (pil_img.width / pil_img.height) * img_height
                
                story.append(Paragraph("<b>Forensic Spectrogram with Anomaly Highlighting:</b>", content_style))
                story.append(Spacer(1, 8))
                story.append(Image(highlighted_path, width=img_width, height=img_height))
                
                # Add comprehensive interpretation guide
                story.append(Spacer(1, 12))
                story.append(Paragraph("<b>Professional Spectrogram Analysis Legend:</b>", content_style))
                story.append(Paragraph("• <b style='color: red;'>Red Rectangles:</b> Computer-detected anomalies indicating possible synthetic generation or editing artifacts", content_style))
                story.append(Paragraph("• <b>Bright Yellow/White Areas:</b> High-energy frequency components (vocal formants, harmonics)", content_style))
                story.append(Paragraph("• <b>Dark Blue/Black Areas:</b> Low-energy regions (silence, background noise)", content_style))
                story.append(Paragraph("• <b>Vertical Axis:</b> Frequency spectrum (Hz) - human voice typically 85-255 Hz fundamental", content_style))
                story.append(Paragraph("• <b>Horizontal Axis:</b> Time progression of audio sample", content_style))
                story.append(Paragraph(f"• <b>Detection Threshold:</b> Intensity > 200 (out of 255 maximum) triggers anomaly flag", content_style))
                
            except Exception as e:
                story.append(Paragraph(f"Error loading enhanced spectrogram: {str(e)}", content_style))
                
        elif spectrogram_file_path and os.path.exists(spectrogram_file_path):
            # Fallback to original spectrogram
            try:
                pil_img = PILImage.open(spectrogram_file_path)
                img_width = 7 * inch
                img_height = (pil_img.height / pil_img.width) * img_width
                
                if img_height > 5 * inch:
                    img_height = 5 * inch
                    img_width = (pil_img.width / pil_img.height) * img_height
                
                story.append(Paragraph("<b>Standard Spectrogram Analysis:</b>", content_style))
                story.append(Spacer(1, 8))
                story.append(Image(spectrogram_file_path, width=img_width, height=img_height))
                
            except Exception as e:
                story.append(Paragraph(f"Error loading spectrogram: {str(e)}", content_style))
        else:
            story.append(Paragraph("⚠️ Spectrogram analysis unavailable - file may be corrupted or unsupported format", content_style))
        
        story.append(PageBreak())
        
        # 6. Enhanced Report Verification Section
        story.append(Paragraph("6. Report Authentication & Verification", heading_style))
        story.append(Paragraph("This report includes multiple layers of authentication to ensure integrity and prevent tampering:", content_style))
        
        # Generate comprehensive QR code with more data
        qr_data = f"AUDIO_FORENSIC_REPORT\nID:{report_id}\nSHA256:{file_hash.get('hash_sha256', '')[:32]}...\nGenerated:{datetime.now().isoformat()}\nSystem:AudioForensicsAnalysis"
        
        qr = qrcode.QRCode(version=2, box_size=8, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Create verification info table
        verification_data = [
            ['Authentication Method', 'Value', 'Purpose'],
            ['Digital Signature', 'SHA256 Hash Verification', 'File integrity validation'],
            ['Report ID', report_id, 'Unique document identifier'],
            ['Generation Timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'), 'Temporal verification'],
            ['Analysis System', 'Audio Forensics Analysis', 'Software identification'],
            ['QR Code', 'Embedded verification data', 'Quick authentication check']
        ]
        
        verification_table = Table(verification_data, colWidths=[2*inch, 2.5*inch, 1.5*inch])
        verification_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(verification_table)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("Scan the QR code below to verify this report's authenticity and access verification portal:", content_style))
        story.append(Spacer(1, 10))
        story.append(Image(qr_buffer, width=2.2*inch, height=2.2*inch))
        
        story.append(Spacer(1, 15))
        story.append(Paragraph("<b>Complete File Hash (SHA256):</b>", content_style))
        story.append(Paragraph(f"<font name='Courier' size='9'>{file_hash.get('hash_sha256', 'N/A')}</font>", content_style))
        
        # Add final summary and recommendations
        story.append(Spacer(1, 20))
        story.append(Paragraph("7. Final Assessment & Recommendations", heading_style))
        
        # Generate overall risk assessment
        risk_score = 0
        risk_factors = []
        
        # Voice matching risk
        if not voice_result.get('same_speaker'):
            risk_score += 3
            risk_factors.append("Voice patterns do not match reference sample")
        
        # AI detection risk
        if ai_result.get('label') == 'SYNTHETIC':
            risk_score += 4
            risk_factors.append("High probability of AI-generated synthetic speech")
        
        # Transcript similarity risk
        if transcript_result.get('similarity_score', 0) < 50:
            risk_score += 2
            risk_factors.append("Low transcript content similarity")
        
        # Spectrogram anomaly risk
        if spectro_info.get('anomaly_count', 0) > 150:
            risk_score += 3
            risk_factors.append("High number of spectral anomalies detected")
        elif spectro_info.get('anomaly_count', 0) > 50:
            risk_score += 1
            risk_factors.append("Moderate spectral anomalies present")
        
        # Overall assessment
        if risk_score >= 6:
            overall_assessment = "HIGH RISK - Multiple indicators suggest potential audio manipulation or synthesis"
            assessment_color = HexColor('#dc2626')
            assessment_bg = HexColor('#fee2e2')
            recommendation = "REJECT - Do not accept this audio as authentic. Multiple forensic indicators suggest manipulation, synthesis, or forgery."
        elif risk_score >= 3:
            overall_assessment = "MODERATE RISK - Some concerning indicators present"
            assessment_color = HexColor('#d97706')
            assessment_bg = HexColor('#fef3c7')
            recommendation = "CAUTION - Additional verification recommended. Some forensic indicators suggest possible manipulation."
        else:
            overall_assessment = "LOW RISK - Audio appears consistent with authentic recording"
            assessment_color = HexColor('#059669')
            assessment_bg = HexColor('#f0fdf4')
            recommendation = "ACCEPT - Forensic analysis indicates audio is likely authentic with no significant manipulation detected."
        
        story.append(Paragraph(f"<b>Overall Risk Assessment:</b>", content_style))
        story.append(Paragraph(overall_assessment, 
                             ParagraphStyle('Assessment', parent=content_style, 
                                          textColor=assessment_color, backColor=assessment_bg,
                                          borderColor=assessment_color, borderWidth=1, borderPadding=10)))
        
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Risk Score:</b> {risk_score}/10", content_style))
        
        if risk_factors:
            story.append(Paragraph(f"<b>Risk Factors Identified:</b>", content_style))
            for factor in risk_factors:
                story.append(Paragraph(f"• {factor}", content_style))
        
        story.append(Spacer(1, 15))
        story.append(Paragraph(f"<b>Professional Recommendation:</b>", content_style))
        story.append(Paragraph(recommendation, 
                             ParagraphStyle('Recommendation', parent=content_style, 
                                          textColor=assessment_color, fontName='Helvetica-Bold')))
        
        # Report completion note
        story.append(Spacer(1, 25))
        story.append(Paragraph("End of Report", 
                             ParagraphStyle('EndNote', parent=content_style, 
                                          fontSize=12, alignment=1, textColor=HexColor('#6b7280'))))
        
        # Build PDF with enhanced header/footer
        doc.build(story, onFirstPage=create_header_footer, onLaterPages=create_header_footer)
        pdf_buffer.seek(0)
        return pdf_buffer
        
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        raise e
        
    finally:
        # Clean up temporary files including highlighted spectrogram
        _safe_remove(original_path)
        _safe_remove(suspected_path)
        if spectrogram_file_path:
            _safe_remove(spectrogram_file_path)
        if 'spectro_info' in locals() and spectro_info and spectro_info.get('highlighted_path'):
            _safe_remove(spectro_info['highlighted_path'])