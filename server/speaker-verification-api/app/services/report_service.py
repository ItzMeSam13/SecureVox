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
    """Create professional header and footer"""
    canvas.saveState()
    
    # Header
    canvas.setFillColor(HexColor('#2c3e50'))
    canvas.rect(0, doc.height + 40, doc.width + 80, 60, fill=1)
    
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 16)
    canvas.drawString(50, doc.height + 60, "AUDIO FORENSIC ANALYSIS REPORT")
    
    canvas.setFont("Helvetica", 10)
    canvas.drawString(50, doc.height + 45, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Footer
    canvas.setFillColor(HexColor('#34495e'))
    canvas.rect(0, 0, doc.width + 80, 30, fill=1)
    
    canvas.setFillColor(white)
    canvas.setFont("Helvetica", 9)
    # Center the page number
    page_text = f"Page {canvas.getPageNumber()}"
    text_width = canvas.stringWidth(page_text, "Helvetica", 9)
    canvas.drawString((doc.width - text_width)/2 + 40, 15, page_text)
    canvas.drawString(50, 15, "Confidential - Audio Forensic Report")
    
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
        
        file_hash = compute_file_hashes(suspected_path)
        
        # Audio file info
        with wave.open(suspected_path, 'rb') as w:
            duration = round(w.getnframes() / w.getframerate(), 2)
            sample_rate = w.getframerate()
            channels = w.getnchannels()
            file_size = os.path.getsize(suspected_path)
        
        # Create PDF
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=A4,
            rightMargin=50,
            leftMargin=50,
            topMargin=100,
            bottomMargin=80
        )
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#2c3e50'),
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#2c3e50'),
            spaceAfter=15,
            spaceBefore=20,
            borderWidth=0,
            borderColor=HexColor('#bdc3c7'),
            borderPadding=10,
            backColor=HexColor('#ecf0f1')
        )
        
        content_style = ParagraphStyle(
            'Content',
            parent=styles['Normal'],
            fontSize=11,
            textColor=HexColor('#2c3e50'),
            spaceAfter=8
        )
        
        # Build story
        story = []
        
        # Title and Report ID
        story.append(Paragraph(f"Audio Forensic Analysis Report", title_style))
        story.append(Paragraph(f"<b>Report ID:</b> {report_id}", content_style))
        story.append(Paragraph(f"<b>Analysis Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", content_style))
        story.append(Spacer(1, 20))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", heading_style))
        
        # Create summary table
        summary_data = [
            ['Analysis Type', 'Result', 'Status'],
            ['Voice Matching', 
             f"{'Same Speaker' if voice_result.get('same_speaker') else 'Different Speaker'} ({voice_result.get('score', 0):.2f})",
             '✓ MATCH' if voice_result.get('same_speaker') else '✗ NO MATCH'],
            ['AI Detection', 
             f"{ai_result.get('label', 'Unknown')} ({ai_result.get('score', 0):.4f})",
             '⚠ SYNTHETIC' if ai_result.get('label') == 'SYNTHETIC' else '✓ AUTHENTIC'],
            ['Transcript Match', 
             f"{transcript_result.get('similarity_score', 0):.2f}% similarity",
             '✓ HIGH' if transcript_result.get('similarity_score', 0) > 80 else '⚠ LOW']
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2.5*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#bdc3c7')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # File Information
        story.append(Paragraph("File Information", heading_style))
        file_data = [
            ['Property', 'Value'],
            ['Duration', f"{duration} seconds"],
            ['Sample Rate', f"{sample_rate:,} Hz"],
            ['Channels', str(channels)],
            ['File Size', f"{file_size:,} bytes"],
            ['SHA256 Hash', file_hash.get('hash_sha256', 'N/A')[:32] + '...']
        ]
        
        file_table = Table(file_data, colWidths=[2*inch, 4*inch])
        file_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#bdc3c7')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(file_table)
        story.append(PageBreak())
        
        # Detailed Analysis Sections
        
        # 1. Voiceprint Analysis
        story.append(Paragraph("1. Voiceprint Comparison Analysis", heading_style))
        story.append(Paragraph(f"<b>Same Speaker:</b> {voice_result.get('same_speaker', 'Unknown')}", content_style))
        story.append(Paragraph(f"<b>Similarity Score:</b> {voice_result.get('score', 0):.4f}", content_style))
        story.append(Paragraph("<b>Analysis:</b> Voiceprint comparison uses acoustic features to determine speaker identity.", content_style))
        story.append(Spacer(1, 15))
        
        # 2. AI Detection Analysis
        story.append(Paragraph("2. AI Synthetic Detection", heading_style))
        story.append(Paragraph(f"<b>Classification:</b> {ai_result.get('label', 'Unknown')}", content_style))
        story.append(Paragraph(f"<b>Confidence Score:</b> {ai_result.get('score', 0):.4f}", content_style))
        story.append(Paragraph("<b>Analysis:</b> Machine learning model trained to detect artificially generated speech.", content_style))
        story.append(Spacer(1, 15))
        
        # 3. Background Noise Analysis
        story.append(Paragraph("3. Background Noise Analysis", heading_style))
        noise_data = [['Metric', 'Value']]
        for key, value in noise_result.items():
            noise_data.append([key.replace('_', ' ').title(), str(value)])
        
        noise_table = Table(noise_data, colWidths=[2.5*inch, 3.5*inch])
        noise_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#bdc3c7')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(noise_table)
        story.append(Spacer(1, 15))
        
        # 4. Transcript Comparison
        story.append(Paragraph("4. Transcript Comparison", heading_style))
        story.append(Paragraph(f"<b>Similarity Score:</b> {transcript_result.get('similarity_score', 0):.2f}%", content_style))
        story.append(Paragraph(f"<b>Original Length:</b> {len(original_text)} characters", content_style))
        story.append(Paragraph(f"<b>Suspected Length:</b> {len(suspected_text)} characters", content_style))
        
        # Truncate long transcripts for display
        original_display = original_text[:200] + "..." if len(original_text) > 200 else original_text
        suspected_display = suspected_text[:200] + "..." if len(suspected_text) > 200 else suspected_text
        
        story.append(Paragraph(f"<b>Original Transcript:</b><br/>{original_display}", content_style))
        story.append(Paragraph(f"<b>Suspected Transcript:</b><br/>{suspected_display}", content_style))
        story.append(PageBreak())
        
        # 5. Enhanced Spectrogram Analysis with Forensic Metrics
        story.append(Paragraph("5. Enhanced Spectrogram Analysis", heading_style))
        story.append(Paragraph("Professional forensic spectrogram with automated anomaly detection and quantitative analysis:", content_style))
        
        # Add forensic spectrogram metrics table
        if 'spectro_info' in locals():
            spectro_data = [
                ['Forensic Metric', 'Value', 'Interpretation'],
                ['Max Intensity', f"{spectro_info.get('max_intensity', 0)}", 'Peak signal strength'],
                ['Mean Intensity', f"{spectro_info.get('mean_intensity', 0):.2f}", 'Average signal level'],
                ['Min Intensity', f"{spectro_info.get('min_intensity', 0)}", 'Background noise floor'],
                ['Std Intensity', f"{spectro_info.get('std_intensity', 0):.2f}", 'Signal variation'],
                ['Anomaly Count', f"{spectro_info.get('anomaly_count', 0)}", 'Suspicious artifacts detected']
            ]
            
            spectro_table = Table(spectro_data, colWidths=[2.2*inch, 1.8*inch, 2*inch])
            spectro_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e74c3c')),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
                ('GRID', (0, 0), (-1, -1), 1, HexColor('#bdc3c7')),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                # Highlight high anomaly count
                ('BACKGROUND', (0, 5), (-1, 5), HexColor('#fff3cd') if spectro_info.get('anomaly_count', 0) > 100 else HexColor('#f8f9fa')),
                ('TEXTCOLOR', (0, 5), (-1, 5), HexColor('#856404') if spectro_info.get('anomaly_count', 0) > 100 else black),
            ]))
            
            story.append(spectro_table)
            story.append(Spacer(1, 15))
            
            # Add forensic interpretation
            anomaly_count = spectro_info.get('anomaly_count', 0)
            if anomaly_count > 200:
                story.append(Paragraph("<b>⚠ HIGH RISK:</b> Significant anomalies detected. Possible synthetic generation or heavy editing.", 
                                     ParagraphStyle('Warning', parent=content_style, textColor=HexColor('#e74c3c'), backColor=HexColor('#f8d7da'))))
            elif anomaly_count > 100:
                story.append(Paragraph("<b>⚠ MODERATE RISK:</b> Some anomalies detected. Further investigation recommended.", 
                                     ParagraphStyle('Warning', parent=content_style, textColor=HexColor('#856404'), backColor=HexColor('#fff3cd'))))
            else:
                story.append(Paragraph("<b>✓ LOW RISK:</b> Minimal anomalies detected. Audio appears consistent with natural recording.", 
                                     ParagraphStyle('Success', parent=content_style, textColor=HexColor('#155724'), backColor=HexColor('#d4edda'))))
            
            story.append(Spacer(1, 10))
        
        # Add enhanced audio statistics from spectrogram generation
        if 'audio_stats' in locals():
            story.append(Paragraph(f"<b>Advanced Audio Analysis:</b>", content_style))
            story.append(Paragraph(f"• Spectral Centroid: {audio_stats.get('spectral_centroid_mean', 0):.1f} Hz (brightness measure)", content_style))
            story.append(Paragraph(f"• Spectral Rolloff: {audio_stats.get('spectral_rolloff_mean', 0):.1f} Hz (frequency distribution)", content_style))
            story.append(Paragraph(f"• Zero Crossing Rate: {audio_stats.get('zero_crossing_rate_mean', 0):.4f} (noisiness indicator)", content_style))
            story.append(Spacer(1, 10))
        
        # Display highlighted spectrogram with anomaly markers
        highlighted_path = spectro_info.get('highlighted_path') if 'spectro_info' in locals() else spectrogram_file_path
        
        if highlighted_path and os.path.exists(highlighted_path):
            # Use highlighted spectrogram if available
            try:
                pil_img = PILImage.open(highlighted_path)
                img_width = 7 * inch  # Larger width for detailed view
                img_height = (pil_img.height / pil_img.width) * img_width
                
                # Limit height to fit on page
                if img_height > 5 * inch:
                    img_height = 5 * inch
                    img_width = (pil_img.width / pil_img.height) * img_height
                
                story.append(Paragraph("<b>Highlighted Spectrogram (Red boxes = Detected anomalies):</b>", content_style))
                story.append(Spacer(1, 5))
                story.append(Image(highlighted_path, width=img_width, height=img_height))
                
                # Add interpretation guide
                story.append(Spacer(1, 10))
                story.append(Paragraph("<b>Forensic Spectrogram Legend:</b>", content_style))
                story.append(Paragraph("• <b>Red rectangles:</b> Computer-detected anomalies (possible editing artifacts)", content_style))
                story.append(Paragraph("• <b>Bright areas:</b> High-energy frequencies", content_style))
                story.append(Paragraph("• <b>Dark areas:</b> Low-energy or silent regions", content_style))
                story.append(Paragraph("• <b>Anomaly threshold:</b> Intensity > 200 (out of 255 max)", content_style))
                
            except Exception as e:
                story.append(Paragraph(f"Error loading highlighted spectrogram: {str(e)}", content_style))
        elif spectrogram_file_path and os.path.exists(spectrogram_file_path):
            # Fallback to original spectrogram
            try:
                pil_img = PILImage.open(spectrogram_file_path)
                img_width = 7 * inch
                img_height = (pil_img.height / pil_img.width) * img_width
                
                if img_height > 5 * inch:
                    img_height = 5 * inch
                    img_width = (pil_img.width / pil_img.height) * img_height
                
                story.append(Spacer(1, 10))
                story.append(Image(spectrogram_file_path, width=img_width, height=img_height))
                
            except Exception as e:
                story.append(Paragraph(f"Error loading spectrogram: {str(e)}", content_style))
        else:
            story.append(Paragraph("Spectrogram not available for analysis", content_style))
        
        story.append(PageBreak())
        
        # 6. Verification QR Code
        story.append(Paragraph("6. Report Verification", heading_style))
        story.append(Paragraph("Scan the QR code below to verify this report's authenticity:", content_style))
        
        # Generate QR code
        qr_data = f"Report ID: {report_id}\nSHA256: {file_hash.get('hash_sha256', '')}\nGenerated: {datetime.now().isoformat()}"
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        story.append(Spacer(1, 10))
        story.append(Image(qr_buffer, width=2*inch, height=2*inch))
        
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"<b>Complete SHA256:</b><br/>{file_hash.get('hash_sha256', 'N/A')}", content_style))
        
        # Build PDF with header/footer
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
        if 'spectro_info' in locals() and spectro_info.get('highlighted_path'):
            _safe_remove(spectro_info['highlighted_path'])