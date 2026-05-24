from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, ImageClip, concatenate_videoclips


ROOT = Path(__file__).resolve().parents[1]
VIDEO_DIR = ROOT / "docs" / "video"
OUT_DIR = VIDEO_DIR / "rendered"
OUT_DIR.mkdir(parents=True, exist_ok=True)

slides = [
    (
        "01-frontend-backend.png",
        "Frontend instrumentado",
        "O app chama o backend Node.js, executa as estrategias e gera traces, metricas e logs.",
    ),
    (
        "02-frontend-results.png",
        "SearchResult padronizado",
        "Cada algoritmo retorna ocorrencias, comparacoes, tempo, complexidade e traceId.",
    ),
    (
        "03-grafana-dashboard.png",
        "Dashboard Grafana",
        "Prometheus alimenta os graficos de execucoes, tempo, comparacoes e latencia.",
    ),
    (
        "04-grafana-logs.png",
        "Logs no Loki",
        "Os logs estruturados carregam trace_id e span_id para correlacao.",
    ),
    (
        "05-jaeger.png",
        "Traces no Jaeger",
        "Cada busca cria um span principal e spans individuais para os algoritmos.",
    ),
    (
        "06-loki-query.png",
        "Consulta direta no Loki",
        "A query confirma que os logs foram ingeridos com dados estruturados.",
    ),
]


def font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def wrap_text(draw, text, font_obj, max_width):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textbbox((0, 0), trial, font=font_obj)[2] <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def make_slide(image_name, title, caption, index):
    canvas = Image.new("RGB", (1280, 720), "#FAFAF7")
    draw = ImageDraw.Draw(canvas)
    title_font = font(36, True)
    caption_font = font(24)
    footer_font = font(16)

    draw.text((48, 30), title, fill="#111111", font=title_font)

    screenshot = Image.open(VIDEO_DIR / image_name).convert("RGB")
    screenshot.thumbnail((1160, 500), Image.Resampling.LANCZOS)
    x = (1280 - screenshot.width) // 2
    y = 88
    canvas.paste(screenshot, (x, y))
    draw.rectangle((x, y, x + screenshot.width, y + screenshot.height), outline="#111111", width=2)

    draw.rectangle((38, 615, 1242, 695), fill="#FAFAF7", outline="#E5E5E0")
    y_text = 633
    for line in wrap_text(draw, caption, caption_font, 1160):
        draw.text((58, y_text), line, fill="#111111", font=caption_font)
        y_text += 30

    draw.text(
        (58, 698),
        "N2 Evoluir - Comparacao de Algoritmos de Busca em Strings",
        fill="#4A4A4A",
        font=footer_font,
    )

    out = OUT_DIR / f"slide-{index:02d}.png"
    canvas.save(out)
    return out


def main():
    audio_path = VIDEO_DIR / "narracao.wav"
    audio = AudioFileClip(str(audio_path))
    per_slide = audio.duration / len(slides)

    clips = []
    for index, slide in enumerate(slides, start=1):
        slide_path = make_slide(*slide, index)
        clips.append(ImageClip(str(slide_path)).with_duration(per_slide))

    video = concatenate_videoclips(clips, method="compose").with_audio(audio)
    output = VIDEO_DIR / "demo-n2-evoluir-narrado.mp4"
    video.write_videofile(
        str(output),
        fps=24,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        threads=4,
    )
    audio.close()
    video.close()
    for clip in clips:
        clip.close()
    print(output)


if __name__ == "__main__":
    main()
