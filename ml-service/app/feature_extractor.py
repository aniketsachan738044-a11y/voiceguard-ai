import numpy as np
import librosa
import scipy.stats as stats

def extract_acoustic_features(waveform: np.ndarray, sr: int = 16000) -> dict:
    """
    Extracts spectro-temporal, pitch, and cepstral features to detect synthetic speech artifacts.
    """
    # 1. Spectral Flatness (Smoothness metric)
    flatness = librosa.feature.spectral_flatness(y=waveform)[0]
    mean_flatness = float(np.mean(flatness))
    std_flatness = float(np.std(flatness))

    # 2. Spectral Flux (Frame-to-frame change)
    stft = np.abs(librosa.stft(waveform, n_fft=512, hop_length=160))
    spectral_flux = float(np.mean(np.diff(stft, axis=1)**2))

    # 3. Spectral Centroid & Rolloff
    centroid = librosa.feature.spectral_centroid(y=waveform, sr=sr)[0]
    rolloff = librosa.feature.spectral_rolloff(y=waveform, sr=sr, roll_percent=0.85)[0]
    mean_centroid = float(np.mean(centroid))
    mean_rolloff = float(np.mean(rolloff))

    # 4. High-frequency energy ratio (> 6 kHz)
    freqs = librosa.fft_frequencies(sr=sr, n_fft=512)
    high_freq_idx = np.where(freqs >= 6000)[0]
    if len(high_freq_idx) > 0 and stft.shape[0] > max(high_freq_idx):
        high_freq_energy = np.sum(stft[high_freq_idx, :]**2)
        total_energy = np.sum(stft**2) + 1e-9
        high_freq_ratio = float(high_freq_energy / total_energy)
    else:
        high_freq_ratio = 0.05

    # 5. Pitch (F0) & Jitter Analysis using pyin / harmonic analysis
    try:
        f0, voiced_flag, _ = librosa.pyin(waveform, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=sr)
        voiced_f0 = f0[voiced_flag & ~np.isnan(f0)]
        if len(voiced_f0) > 5:
            # Jitter: relative average absolute difference between consecutive pitch periods
            pitch_diffs = np.abs(np.diff(voiced_f0))
            jitter = float(np.mean(pitch_diffs) / (np.mean(voiced_f0) + 1e-6))
            f0_std = float(np.std(voiced_f0))
        else:
            jitter = 0.015
            f0_std = 15.0
    except Exception:
        jitter = 0.015
        f0_std = 15.0

    # 6. MFCC & Delta MFCC Variance
    mfcc = librosa.feature.mfcc(y=waveform, sr=sr, n_mfcc=13)
    delta_mfcc = librosa.feature.delta(mfcc)
    mfcc_var = float(np.mean(np.var(mfcc, axis=1)))
    delta_mfcc_var = float(np.mean(np.var(delta_mfcc, axis=1)))

    # Compute individual risk scores (0-100) based on known synthetic voice signatures:
    # - Abnormally low or high spectral flatness variance
    # - Low pitch jitter (overly robotic/uniform pitch track) or excessive sudden pitch jumps
    # - Reduced high-frequency turbulence or unnatural high-frequency cutoff
    # - Low delta-MFCC variance (lack of natural acoustic vocal tract transitions)

    flatness_score = min(100.0, max(0.0, (1.0 - (std_flatness * 50.0)) * 60.0 + (mean_flatness * 400.0)))
    pitch_stability_score = min(100.0, max(0.0, (1.0 - min(1.0, jitter * 20.0)) * 85.0))
    artifact_score = min(100.0, max(0.0, high_freq_ratio * 500.0 + (1.0 - min(1.0, delta_mfcc_var / 30.0)) * 50.0))
    naturalness_score = round(max(5.0, 100.0 - (flatness_score * 0.35 + pitch_stability_score * 0.35 + artifact_score * 0.30)), 1)

    return {
        "spectral_flatness_mean": round(mean_flatness, 4),
        "spectral_flatness_std": round(std_flatness, 4),
        "spectral_flux": round(spectral_flux, 4),
        "spectral_centroid_hz": round(mean_centroid, 1),
        "spectral_rolloff_hz": round(mean_rolloff, 1),
        "high_freq_ratio": round(high_freq_ratio, 4),
        "pitch_jitter": round(jitter, 5),
        "pitch_std": round(f0_std, 2),
        "mfcc_variance": round(mfcc_var, 2),
        "delta_mfcc_variance": round(delta_mfcc_var, 2),
        "computed_scores": {
            "spectral_flatness_score": round(flatness_score, 1),
            "pitch_consistency_score": round(pitch_stability_score, 1),
            "high_freq_artifact_ratio": round(artifact_score, 1),
            "acoustic_naturalness": naturalness_score
        }
    }
