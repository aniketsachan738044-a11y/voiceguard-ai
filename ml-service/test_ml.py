import numpy as np
from app.model import detector_instance
from app.utils import load_and_preprocess_audio
import io
import soundfile as sf

def test_inference():
    print("--- Testing VoiceGuard ML Engine ---")
    sr = 16000
    duration = 5.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    
    # Generate 440 Hz audio wave
    audio_signal = 0.5 * np.sin(2 * np.pi * 440 * t)
    
    buf = io.BytesIO()
    sf.write(buf, audio_signal, sr, format='WAV')
    file_bytes = buf.getvalue()
    
    waveform, sr_out, dur_out = load_and_preprocess_audio(file_bytes, "test_audio.wav")
    print(f"Loaded waveform: shape={waveform.shape}, sr={sr_out}, duration={dur_out}s")
    
    result = detector_instance.predict(waveform, sr_out)
    print("\nInference Result:")
    print(f"  Risk Score : {result['risk_score']}/100")
    print(f"  Verdict    : {result['verdict']}")
    print(f"  Risk Label : {result['risk_label']}")
    print(f"  Confidence : {result['confidence']}")
    print(f"  Model Info : {result['model_info']}")
    print("  Features   :", result['features_summary'])
    
    assert 0 <= result['risk_score'] <= 100
    assert result['verdict'] in ['genuine', 'spoofed']
    assert result['risk_label'] in ['Low', 'Medium', 'High']
    print("\n[OK] ML Service Test Passed Successfully!")

if __name__ == "__main__":
    test_inference()
