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
mother_voice_wav = "voices/voice-sofija-r.wav"  # Assuming the voices folder is in the same directory as tts.py
peasant_voice_wav = "voices/voice-viktor-r.wav"  # Assuming the voices folder is in the same directory as tts.py

# Patterns for attention
patterns = ["uniform", "emphasis", "gradual"]

# Language configurations
languages = {
    "en": "English"
#    "zh": "Mandarin",
#    "ru": "Russian",
#    "ar": "Arabic",
#    "it": "Italian"
}

# Input sentences with translations
sentences = {
    1: {
       "it": "O magna mater, lux vitae et spes",
        "en": "O great mother, light of life and hope",
        "zh": "伟大的母亲啊，生命与希望之光",
        "ru": "О великая мать, свет жизни и надежды",
        "ar": "يا أماه العظيمة، يا نور الحياة والأمل،"
    },
    2: {
       "it": "Custos silvarum, maris et montis",
        "en": "Guardian of forests, sea and mountain",
        "zh": "森林、海洋与山岳的守护者",
        "ru": "Хранительница лесов, моря и гор",
        "ar": "يا حارسة الغابات والبحر والجبل،"
    },
    3: {
       "it": "Sub caelo tuo florescimus omnes",
        "en": "Under your sky we all flourish",
        "zh": "在你的天空下我们茁壮成长",
        "ru": "Под твоим небом мы все процветаем",
        "ar": "تحت سمائك نزدهر جميعاً،"
    },
    4: {
       "it": "Gratia tua mundus in pace manet",
        "en": "By your grace the world remains in peace",
        "zh": "因你的恩典世界得以和平",
        "ru": "Твоей милостью мир пребывает в мире",
        "ar": "وبنعمتك يبقى العالم في سلام"
    },
    5: {
       "it": "Flamma ardens, ventus cantans",
        "en": "Burning flame, singing wind",
        "zh": "燃烧的火焰，歌唱的风",
        "ru": "Горящее пламя, поющий ветер",
        "ar": "اللهب المشتعل، والريح المغنية"
    },
    6: {
       "it": "Unda sussurrans, terra fovens",
        "en": "Whispering wave, nurturing earth",
        "zh": "低语的波浪，滋养的大地",
        "ru": "Шепчущая волна, питающая земля",
        "ar": "والموج الهامس، والأرض المغذية"
    },
    7: {
       "it": "In his tua vox, o mater sacra",
        "en": "In these your voice, o sacred mother",
        "zh": "在这些之中有你的声音，神圣的母亲啊",
        "ru": "В них твой голос, о священная мать",
        "ar": "في هذه صوتك، أيتها الأم المقدسة"
    },
    8: {
       "it": "Vitam fundens, aeternum donum",
        "en": "Pouring forth life, eternal gift",
        "zh": "倾注生命，永恒的礼物",
        "ru": "Изливающая жизнь, вечный дар",
        "ar": "تصبين الحياة، هدية أبدية"
    },
    9: {
       "it": "Carissimi nati, me semper videte",
        "en": "Dearest children, always see me",
        "zh": "亲爱的孩子们，永远看见我",
        "ru": "Дорогие дети, всегда видьте меня",
        "ar": "يا أبنائي الأعزاء، شاهدوني دائماً"
    },
    10: {
       "it": "In vento, in sole, in pluviis quietis",
        "en": "In the wind, in the sun, in the quiet rains",
        "zh": "在风中，在阳光中，在静静的雨中",
        "ru": "В ветре, в солнце, в тихих дождях",
        "ar": "في الريح، في الشمس، في الأمطار الهادئة"
    },
    11: {
       "it": "Sum vita, sum amor, ubique manebo",
        "en": "I am life, I am love, I will remain everywhere",
        "zh": "我是生命，我是爱，我将无处不在",
        "ru": "Я есть жизнь, я есть любовь, я останусь повсюду",
        "ar": "أنا الحياة، أنا الحب، سأبقى في كل مكان"
    },
    12: {
       "it": "Vos in aeternum amplector!",
        "en": "I embrace you forever!",
        "zh": "永远拥抱着你们！",
        "ru": "Я обнимаю вас навеки!",
        "ar": "أحتضنكم إلى الأبد!"
    },
    13: {
       "it": "Laeta et superba sum",
        "en": "I am joyful and proud",
        "zh": "我感到喜悦与自豪",
        "ru": "Я радостна и горда",
        "ar": "أنا سعيدة وفخورة"
    }
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
        # Remove attention mask logic
        output_path_mother = output_path.replace('.wav', '_mother.wav')
        tts.tts_to_file(
            text=text,
            language=language,
            speaker_wav=mother_voice_wav,
            file_path=output_path_mother
        )
        print(f"Generated: {output_path_mother}")

        output_path_peasant = output_path.replace('.wav', '_peasant.wav')
        tts.tts_to_file(
            text=text,
            language=language,
            speaker_wav=peasant_voice_wav,
            file_path=output_path_peasant
        )
        print(f"Generated: {output_path_peasant}")

    except Exception as e:
        print(f"Error in generate_tts: {str(e)}")




# Modify the generation loop
for sentence_num in sentences:
    for lang in languages.keys():
        for pattern in patterns:
            try:
                output_path = f"output/{lang}/sentence{sentence_num}_{pattern}.wav"
                
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
