import io
import os
import tempfile
import numpy as np
import librosa
import soundfile as sf
import torch

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".webm", ".flac", ".m4a", ".aac"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB
TARGET_SR = 16000  # 16 kHz standard for speech anti-spoofing models

def validate_audio_file(filename: str, file_size: int):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported audio format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    if file_size > MAX_FILE_SIZE:
        raise ValueError(f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum limit of 15 MB.")

def load_and_preprocess_audio(file_bytes: bytes, filename: str) -> tuple[np.ndarray, int, float]:
    """
    Loads raw bytes into 16kHz mono float32 numpy array.
    Pads or trims duration to be between 3s and 15s.
    Returns: (audio_waveform, sample_rate, duration_seconds)
    """
    ext = os.path.splitext(filename)[1].lower()
    if not ext:
        ext = ".wav"
        
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        # Load audio with librosa at 16kHz mono
        waveform, sr = librosa.load(tmp_path, sr=TARGET_SR, mono=True)
    except Exception as e:
        # Fallback to soundfile
        try:
            waveform, sr = sf.read(tmp_path)
            if waveform.ndim > 1:
                waveform = np.mean(waveform, axis=1)
            if sr != TARGET_SR:
                waveform = librosa.resample(waveform, orig_sr=sr, target_sr=TARGET_SR)
                sr = TARGET_SR
        except Exception as sf_err:
            # Fallback to torchaudio
            try:
                import torchaudio
                tensor, sr = torchaudio.load(tmp_path)
                waveform = tensor.numpy().mean(axis=0) if tensor.ndim > 1 else tensor.numpy()[0]
                if sr != TARGET_SR:
                    waveform = librosa.resample(waveform, orig_sr=sr, target_sr=TARGET_SR)
                    sr = TARGET_SR
            except Exception as ta_err:
                raise ValueError(f"Could not decode audio file '{filename}'. Please ensure the file is a valid WAV, MP3, OGG, or FLAC clip.")
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    if len(waveform) == 0:
        raise ValueError("Audio clip is empty or unreadable.")

    # Remove silent leads/tails
    trimmed_waveform, _ = librosa.effects.trim(waveform, top_db=30)
    if len(trimmed_waveform) > 0:
        waveform = trimmed_waveform

    duration = len(waveform) / sr

    # Ensure duration is at least 3 seconds (pad if shorter)
    min_samples = 3 * sr
    if len(waveform) < min_samples:
        padding = min_samples - len(waveform)
        waveform = np.pad(waveform, (0, padding), mode='wrap')
        duration = len(waveform) / sr

    # Trim to max 15 seconds for CPU inference speed
    max_samples = 15 * sr
    if len(waveform) > max_samples:
        waveform = waveform[:max_samples]
        duration = 15.0

    # Peak normalization
    max_val = np.max(np.abs(waveform))
    if max_val > 1e-6:
        waveform = waveform / max_val

    return waveform.astype(np.float32), sr, round(duration, 2)
