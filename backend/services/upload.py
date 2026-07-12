import time
from google import genai
from config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def upload_video_to_gemini(filepath: str):
    print(f"Uploading {filepath} to Gemini...")
    video_file = client.files.upload(file=filepath)

    while video_file.state.name == "PROCESSING":
        print(".", end="", flush=True)
        time.sleep(10)
        video_file = client.files.get(name=video_file.name)

    if video_file.state.name == "FAILED":
        raise Exception("Gemini file upload failed")

    print(f"\nGemini upload ready: {video_file.name}")
    return video_file

def delete_video_from_gemini(video_file):
    try:
        client.files.delete(name=video_file.name)
        print(f"Gemini file deleted: {video_file.name}")
    except Exception as e:
        print(f"Failed to delete Gemini file: {e}")