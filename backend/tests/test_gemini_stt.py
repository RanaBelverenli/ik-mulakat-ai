"""
Gemini STT Test Script
Lokal bir audio dosyası ile Gemini STT fonksiyonunu test eder
"""

import asyncio
import os
import sys
from pathlib import Path

# Backend root dizinini path'e ekle
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.gemini_stt import transcribe_with_gemini_chunk, transcribe_with_gemini_chunk_sync


async def test_gemini_stt_async():
    """Async fonksiyonu test et"""
    print("=" * 60)
    print("Gemini STT Test - Async")
    print("=" * 60)
    
    # Test audio dosyası yolu (örnek - kullanıcı kendi dosyasını kullanabilir)
    test_audio_path = backend_dir / "data" / "audio" / "test.webm"
    
    if not test_audio_path.exists():
        print(f"⚠️  Test audio dosyası bulunamadı: {test_audio_path}")
        print("💡 Kendi audio dosyanızı kullanmak için:")
        print(f"   1. {test_audio_path.parent} dizinine .webm veya .wav dosyası koyun")
        print("   2. test_audio_path değişkenini güncelleyin")
        return
    
    print(f"📁 Test dosyası: {test_audio_path}")
    print(f"📊 Dosya boyutu: {test_audio_path.stat().st_size} bytes")
    
    # Dosyayı oku
    with open(test_audio_path, "rb") as f:
        audio_bytes = f.read()
    
    print(f"📦 Audio bytes: {len(audio_bytes)} bytes")
    
    # GEMINI_API_KEY kontrolü
    if not os.environ.get("GEMINI_API_KEY"):
        print("❌ GEMINI_API_KEY environment variable bulunamadı!")
        print("💡 .env dosyasına veya environment'a ekleyin:")
        print("   export GEMINI_API_KEY='your-api-key'")
        return
    
    print("✅ GEMINI_API_KEY bulundu")
    print("\n🔄 Gemini STT işleniyor...")
    
    try:
        # Async fonksiyonu çağır
        suffix = test_audio_path.suffix or ".webm"
        text = await transcribe_with_gemini_chunk(
            audio_bytes=audio_bytes,
            suffix=suffix,
            language="tr",
        )
        
        print("\n" + "=" * 60)
        print("✅ Transkript Sonucu:")
        print("=" * 60)
        if text:
            print(f'"{text}"')
        else:
            print("(Boş - konuşma algılanmadı veya hata oluştu)")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Hata: {e}")
        import traceback
        traceback.print_exc()


def test_gemini_stt_sync():
    """Sync fonksiyonu test et"""
    print("=" * 60)
    print("Gemini STT Test - Sync")
    print("=" * 60)
    
    test_audio_path = backend_dir / "data" / "audio" / "test.webm"
    
    if not test_audio_path.exists():
        print(f"⚠️  Test audio dosyası bulunamadı: {test_audio_path}")
        return
    
    with open(test_audio_path, "rb") as f:
        audio_bytes = f.read()
    
    if not os.environ.get("GEMINI_API_KEY"):
        print("❌ GEMINI_API_KEY bulunamadı!")
        return
    
    print("🔄 Gemini STT işleniyor (sync)...")
    
    try:
        suffix = test_audio_path.suffix or ".webm"
        text = transcribe_with_gemini_chunk_sync(
            audio_bytes=audio_bytes,
            suffix=suffix,
            language="tr",
        )
        
        print("\n✅ Transkript Sonucu:")
        if text:
            print(f'"{text}"')
        else:
            print("(Boş)")
        
    except Exception as e:
        print(f"\n❌ Hata: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n🧪 Gemini STT Test Script")
    print("=" * 60)
    
    # Async test
    print("\n1️⃣  Async Test:")
    asyncio.run(test_gemini_stt_async())
    
    # Sync test (opsiyonel)
    # print("\n2️⃣  Sync Test:")
    # test_gemini_stt_sync()
    
    print("\n✅ Test tamamlandı!")

