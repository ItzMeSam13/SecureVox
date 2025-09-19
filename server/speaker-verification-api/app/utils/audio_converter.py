import ffmpeg

def convert_to_wav(source_path, sample_rate=16000):
    wav_path = source_path.rsplit('.', 1)[0] + "_converted.wav"
    try:
        (
            ffmpeg
            .input(source_path)
            .output(wav_path, ac=1, ar=sample_rate, format="wav")
            .overwrite_output()
            .run(quiet=True)
        )
        return wav_path
    except ffmpeg.Error as e:
        raise IOError(f"FFmpeg conversion failed: {e.stderr.decode()}") from e
