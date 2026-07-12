import subprocess
import json
import imageio_ffmpeg
import os

FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()

# ffprobe sits in the same directory as ffmpeg
FFPROBE_PATH = os.path.join(
    os.path.dirname(FFMPEG_PATH),
    "ffprobe-win-x86_64-v7.1.exe"
)

print(f"FFmpeg: {FFMPEG_PATH}")
print(f"FFprobe: {FFPROBE_PATH}")

def get_video_duration(filepath: str) -> float:
    # use ffmpeg directly since ffprobe may not be bundled
    cmd = [
        FFMPEG_PATH,
        "-i", filepath,
        "-f", "null", "-"
    ]
    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    output = result.stderr.decode()
    for line in output.split("\n"):
        if "Duration" in line:
            time_str = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = time_str.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    raise Exception("Could not detect video duration")

def burn_timecodes(input_path: str, output_path: str):
    cmd = [
        FFMPEG_PATH,
        "-y", "-i", input_path,
        "-vf", "scale=-2:480,drawtext=text='%{pts\\:hms}':x=10:y=10:fontsize=24:fontcolor=white:box=1:boxcolor=0x00000000@1",
        "-preset", "ultrafast",
        "-c:a", "copy",
        output_path
    ]
    subprocess.run(cmd, check=True)

def extract_json(text: str) -> dict:
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    start = text.find("{")
    end = text.rfind("}") + 1
    return json.loads(text[start:end])