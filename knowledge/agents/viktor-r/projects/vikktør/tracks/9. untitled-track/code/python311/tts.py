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

# Reference audio file path for voice cloning
speaker_wav = "voices/voice-viktor-r.wav"  # Assuming the voices folder is in the same directory as tts.py

# Input sentences with translations
sentences = {
    1: {
        "en": "There is no wisdom without kindness.",
        "zh": "没有仁慈就没有智慧。",
        "ru": "Без доброты нет мудрости.",
        "ar": "لا حكمة بدون طيبة."
    },
    2: {
        "en": "The sun rises in the east and sets in the west.",
        "zh": "太阳从东方升起，从西方落下。",
        "ru": "Солнце встает на востоке и садится на западе.",
        "ar": "تشرق الشمس من الشرق وتغرب في الغرب."
    },
    3: {
        "en": "Life is what happens while you're busy making other plans.",
        "zh": "生活就是当你忙着制定计划时所发生的事。",
        "ru": "Жизнь — это то, что происходит, пока вы строите другие планы.",
        "ar": "الحياة هي ما يحدث بينما أنت مشغول في وضع خطط أخرى."
    }
}

# Language configurations
languages = {
    "en": "English",
    "zh": "Mandarin",
    "ru": "Russian",
    "ar": "Arabic"
}

def create_attention_mask(text, pattern="uniform"):
    """Create attention mask based on different patterns"""
    words = text.split()
    mask_length = len(words)
    
    if pattern == "uniform":
        mask = [1.0] * mask_length
    elif pattern == "emphasis":
        mask = [1.5 if any(c.isupper() for c in word) else 1.0 for word in words]
    elif pattern == "gradual":
        mask = [0.5 + (i / (mask_length - 1)) if mask_length > 1 else 1.0 for i in range(mask_length)]
    
    return torch.tensor(mask, device=device)

def generate_tts(text, language, output_path, attention_pattern="uniform"):
    """Generate TTS with different attention patterns"""
    try:
        # Only use attention mask for English text
        attention_mask = create_attention_mask(text, attention_pattern) if language == "en" else None
        
        # Generate and save audio
        tts.tts_to_file(
            text=text,
            language=language,
            speaker_wav=speaker_wav,
            file_path=output_path,
            attention_mask=attention_mask
        )
        print(f"Generated: {output_path}")
    except Exception as e:
        print(f"Error in generate_tts: {str(e)}")

# Patterns for attention
patterns = ["uniform", "emphasis", "gradual"]

# Modify the generation loop
for sentence_num in sentences:
    for lang in languages.keys():
        for pattern in patterns:
            try:
                output_path = f"output/sentence{sentence_num}_{lang}_{pattern}.wav"
                
                # Get the correct translation for the language
                text = sentences[sentence_num][lang]
                
                # Apply emphasis for English only
                if pattern == "emphasis" and lang == "en":
                    words = text.split()
                    emphasized_text = " ".join(word.upper() if i % 2 == 0 else word 
                                            for i, word in enumerate(words))
                else:
                    emphasized_text = text
                
                generate_tts(
                    text=emphasized_text,
                    language=lang,
                    output_path=output_path,
                    attention_pattern=pattern
                )
                
            except Exception as e:
                print(f"Error processing sentence {sentence_num} in {languages[lang]} with {pattern} pattern: {str(e)}")

print("Processing complete!")
