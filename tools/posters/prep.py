#!/usr/bin/env python3
"""Подготовка исходников для обложек-«афиш» (tools/posters/src/).

Запуск из любого места:  python3 tools/posters/prep.py [имя-задачи ...]
Без аргументов — все задачи. Нужны только ffmpeg (для кадров из видео),
Pillow и numpy — всё уже есть на машине. Ничего не устанавливает.

Задачи пилота (07.09.2026):
  supercar   — кадр 4K из «Гордей.mp4» (t=12.5 с), вырез 4:5 из активной
               области (леттербокс 2.74:1 срезается по cropdetect).
  kiosk      — карточка учёного (верхнее состояние) из исходников интерфейса
               + вырезанный портрет (альфа) как второстепенный элемент.
  azbuka     — вырезка куличей из рендера: заливка фона от углов (flood fill),
               края смягчены; выход RGBA.
  tanuki     — фрагмент с зонтами из фото входа (без шапки Instagram
               и без подписи @tanuki_kz).
"""
import os, sys, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

HERE = Path(__file__).resolve().parent
SITE = HERE.parent.parent                       # …/Сайт
PROJECT = SITE.parent                            # …/About You UZ
STUDIO = PROJECT.parent                          # …/AI-studio
SRC = HERE / "src"
SRC.mkdir(exist_ok=True)

VIDEO = PROJECT / "03 Фактура/ПОРТФОЛИО локо/Гордей.mp4"
KIOSK_DIR = STUDIO / "Билет/Тендер 24.08.26/Материалы/07 Поговори с учёным"
AZBUKA = SITE / "assets/img/cases/case-azbuka-1.jpg"
TANUKI = SITE / "assets/img/case-tanuki-kz.jpg"


def frame_from_video(video: Path, t: float, out: Path):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(video),
                    "-frames:v", "1", str(out)], check=True)


def active_area(im: Image.Image, thresh=8):
    """Границы леттербокса по средней яркости строк."""
    a = np.asarray(im.convert("L"), dtype=np.float32)
    rows = np.where(a.mean(axis=1) > thresh)[0]
    return int(rows.min()), int(rows.max()) + 1


def crop_45(im: Image.Image, cx: float, top: int, bottom: int) -> Image.Image:
    """Вырез 4:5 по всей высоте активной области, центр по x = cx (0..1)."""
    h = bottom - top
    w = round(h * 4 / 5)
    x0 = int(round(cx * im.width - w / 2))
    x0 = max(0, min(im.width - w, x0))
    return im.crop((x0, top, x0 + w, bottom))


def task_supercar():
    raw = SRC / "supercar-raw.png"
    if not raw.exists():
        frame_from_video(VIDEO, 12.5, raw)
    im = Image.open(raw).convert("RGB")
    top, bottom = active_area(im)
    out = crop_45(im, cx=0.481, top=top, bottom=bottom)   # центр — нос машины
    out = out.resize((1200, 1500), Image.LANCZOS)
    out.save(SRC / "supercar-45.png", optimize=True)
    print("supercar:", im.size, "active", top, bottom, "->", out.size)


def alpha_bbox(im: Image.Image, box=None):
    a = np.asarray(im.split()[-1])
    if box:
        x0, y0, x1, y1 = box
        a = a[y0:y1, x0:x1]
    ys, xs = np.where(a > 8)
    off = (box[0], box[1]) if box else (0, 0)
    return (xs.min() + off[0], ys.min() + off[1], xs.max() + 1 + off[0], ys.max() + 1 + off[1])


def task_kiosk():
    card = Image.open(KIOSK_DIR / "Scientist-card.png").convert("RGBA")
    # верхнее состояние карточки — верхняя половина файла
    bb = alpha_bbox(card, (0, 0, card.width, card.height // 2))
    top = card.crop(bb)
    # мягкая тень уже в файле не нужна — обрезаем 2 px по краям, чтобы не тянуть полутон
    top = top.crop((2, 2, top.width - 2, top.height - 2))
    big = top.resize((top.width * 3, top.height * 3), Image.LANCZOS)
    big.save(SRC / "kiosk-card.png", optimize=True)
    for i in (1, 2, 3, 4, 5):
        p = Image.open(KIOSK_DIR / f"big-foto-{i}.png").convert("RGBA")
        p.resize((p.width * 2, p.height * 2), Image.LANCZOS).save(SRC / f"kiosk-portrait-{i}.png", optimize=True)
        m = Image.open(KIOSK_DIR / f"small-foto-{i}.png").convert("RGBA")   # круглый медальон
        m.resize((m.width * 2, m.height * 2), Image.LANCZOS).save(SRC / f"kiosk-medal-{i}.png", optimize=True)
    print("kiosk card:", top.size, "->", big.size)


def task_azbuka():
    im = Image.open(AZBUKA).convert("RGB")
    w, h = im.size
    # маска: заливаем фон от четырёх углов с допуском; фон однородный (244,243,241)
    work = im.copy()
    key = (255, 0, 255)
    for xy in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3), (w // 2, 2), (w - 3, h // 2)):
        ImageDraw.floodfill(work, xy, key, thresh=7)
    a = np.asarray(work)
    bg = (a[:, :, 0] == 255) & (a[:, :, 1] == 0) & (a[:, :, 2] == 255)
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    # чуть съесть край и смягчить, чтобы не было светлого ореола
    alpha = alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    bb = alpha_bbox(out)
    out = out.crop(bb)
    out.save(SRC / "azbuka-cutout.png", optimize=True)
    print("azbuka cutout:", out.size, "bg px:", int(bg.sum()))


def task_tanuki():
    im = Image.open(TANUKI).convert("RGB")
    # зонты слева-сверху; шапка Instagram — верхние ~70 px, подпись — низ
    crop = im.crop((0, 165, 350, 515))
    crop.save(SRC / "tanuki-umbrellas.png", optimize=True)
    print("tanuki umbrellas:", crop.size)


TASKS = {"supercar": task_supercar, "kiosk": task_kiosk, "azbuka": task_azbuka, "tanuki": task_tanuki}

if __name__ == "__main__":
    names = sys.argv[1:] or list(TASKS)
    for n in names:
        TASKS[n]()
