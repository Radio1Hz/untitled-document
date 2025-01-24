import torch
from TTS.api import TTS
import warnings

# Suppress the specific FutureWarning about torch.load
warnings.filterwarnings('ignore', category=FutureWarning, module='torch.serialization')

# Get device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Init TTS with the model
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", 
          config_path=None,
          progress_bar=True).to(device)

# Reference audio file paths for voice cloning
speaker_wav_english_original = "C:/data-local/vikktør/shorts/1. there is no wisdom without kindness/code/python311/voices/voice-faten-hamama.wav"
speaker_wav_chinese_original = speaker_wav_english_original
speaker_wav_russian_original = speaker_wav_english_original

# Message in different languages with emphasis patterns
texts = {
    "en": {
        "text": "there is no wisdom without kindness.",
        "emphasis": "THERE is NO wisdom WITHOUT kindness."  # Capitals indicate emphasis
    },
    "zh": {
        "text": "没有仁慈，就没有智慧。",
        "emphasis": "没有仁慈，就没有智慧。"  # Using full attention for Chinese
    },
    "ru": {
        "text": "Без доброты нет мудрости.",
        "emphasis": "Без ДОБРОТЫ нет МУДРОСТИ."  # Capitals indicate emphasis
    }
}

def create_attention_mask(text, pattern="uniform"):
    """Create attention mask based on different patterns"""
    # For XTTS v2, we'll use word-based masking instead of character-based
    words = text.split()
    mask_length = len(words)
    
    if pattern == "uniform":
        # Standard uniform attention
        mask = [1.0] * mask_length
    
    elif pattern == "emphasis":
        # Create emphasis based on capitalization
        mask = [1.5 if any(c.isupper() for c in word) else 1.0 for word in words]
    
    elif pattern == "gradual":
        # Gradually increasing attention
        mask = [0.5 + (i / (mask_length - 1)) if mask_length > 1 else 1.0 for i in range(mask_length)]
    
    return torch.tensor(mask, device=device)

def generate_tts(text, language, speaker_wav, output_path, attention_pattern="uniform"):
    """Generate TTS with different attention patterns"""
    try:
        # Only use attention mask for English text
        attention_mask = create_attention_mask(text, attention_pattern) if language == "en" else None
        
        # Generate and save audio
        wav = tts.tts(
            text=text,
            language=language,
            speaker_wav=speaker_wav,
            attention_mask=attention_mask
        )
        
        tts.tts_to_file(
            text=text,
            language=language,
            speaker_wav=speaker_wav,
            file_path=output_path,
            attention_mask=attention_mask
        )
        return wav
    except Exception as e:
        print(f"Error in generate_tts: {str(e)}")
        return None

# Generate TTS with different attention patterns
patterns = ["uniform", "emphasis", "gradual"]

for lang, content in texts.items():
    for pattern in patterns:
        try:
            output_path = f"output/{lang}_{pattern}_wisdom_kindness.wav"
            wav = generate_tts(
                text=content["emphasis"] if pattern == "emphasis" else content["text"],
                language=lang,
                speaker_wav=speaker_wav_english_original,
                output_path=output_path,
                attention_pattern=pattern
            )
            print(f"Successfully generated TTS for language {lang} with {pattern} attention")
        except Exception as e:
            print(f"Error generating TTS for language {lang} with {pattern} attention: {str(e)}")
