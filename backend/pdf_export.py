"""
Chat → PDF export. Renders an Ember conversation into a clean, readable PDF
(headings, bullets, bold, fenced code blocks, and generated images), using the
system DejaVu fonts for full Unicode coverage.
"""

import io
import re
import base64
from datetime import datetime

from fpdf import FPDF
from PIL import Image

FONT_DIR = "/usr/share/fonts/truetype/dejavu"

_IMG_RE = re.compile(r"!\[[^\]]*\]\(data:image/[^;]+;base64,([^)]+)\)")
_CODE_RE = re.compile(r"```[^\n]*\n(.*?)```", re.DOTALL)
_LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")


def _add_fonts(pdf: FPDF) -> None:
    pdf.add_font("DejaVu", "", f"{FONT_DIR}/DejaVuSans.ttf")
    pdf.add_font("DejaVu", "B", f"{FONT_DIR}/DejaVuSans-Bold.ttf")
    # No oblique file for Sans — reuse regular/bold so markdown italics don't crash.
    pdf.add_font("DejaVu", "I", f"{FONT_DIR}/DejaVuSans.ttf")
    pdf.add_font("DejaVu", "BI", f"{FONT_DIR}/DejaVuSans-Bold.ttf")
    pdf.add_font("DejaVuMono", "", f"{FONT_DIR}/DejaVuSansMono.ttf")


def _clean(s: str) -> str:
    s = _LINK_RE.sub(r"\1 (\2)", s)   # [text](url) -> text (url)
    s = s.replace("`", "")            # drop inline-code backticks
    return s


def _render_image(pdf: FPDF, b64: str, width: float) -> None:
    try:
        raw = base64.b64decode(b64)
        iw, ih = Image.open(io.BytesIO(raw)).size
        disp_w = min(width, 120.0)
        disp_h = disp_w * ih / iw
        if pdf.get_y() + disp_h > pdf.h - pdf.b_margin:
            pdf.add_page()
        pdf.image(io.BytesIO(raw), w=disp_w)
        pdf.ln(3)
    except Exception:
        pdf.set_font("DejaVu", "I", 10)
        pdf.set_text_color(150, 150, 150)
        pdf.multi_cell(width, 6, "[image could not be embedded]")
        pdf.set_text_color(30, 30, 30)


def _render_paragraphs(pdf: FPDF, text: str, width: float) -> None:
    for raw in text.split("\n"):
        line = raw.rstrip()
        if not line.strip():
            pdf.ln(2)
            continue
        heading = re.match(r"^(#{1,3})\s+(.*)", line)
        if heading:
            size = {1: 15, 2: 13, 3: 12}[len(heading.group(1))]
            pdf.set_font("DejaVu", "B", size)
            pdf.multi_cell(width, 7, _clean(heading.group(2)), markdown=True)
            pdf.set_font("DejaVu", "", 11)
            continue
        bullet = re.match(r"^\s*[-*]\s+(.*)", line)
        if bullet:
            pdf.set_font("DejaVu", "", 11)
            pdf.multi_cell(width, 6, "•  " + _clean(bullet.group(1)), markdown=True)
            continue
        pdf.set_font("DejaVu", "", 11)
        pdf.multi_cell(width, 6, _clean(line), markdown=True)


def _render_code(pdf: FPDF, code: str, width: float) -> None:
    pdf.ln(1)
    pdf.set_font("DejaVuMono", "", 9)
    pdf.set_fill_color(244, 244, 246)
    pdf.set_text_color(25, 25, 30)
    for line in code.rstrip("\n").split("\n"):
        pdf.multi_cell(width, 5, line if line.strip() else " ", fill=True)
    pdf.set_text_color(30, 30, 30)
    pdf.ln(2)


def _render_text(pdf: FPDF, text: str, width: float) -> None:
    if not text.strip():
        return
    pos = 0
    for m in _IMG_RE.finditer(text):
        _render_paragraphs(pdf, text[pos:m.start()], width)
        _render_image(pdf, m.group(1), width)
        pos = m.end()
    _render_paragraphs(pdf, text[pos:], width)


def _render_content(pdf: FPDF, content: str, width: float) -> None:
    idx = 0
    for m in _CODE_RE.finditer(content):
        _render_text(pdf, content[idx:m.start()], width)
        _render_code(pdf, m.group(1), width)
        idx = m.end()
    _render_text(pdf, content[idx:], width)


def build_chat_pdf(title: str, messages: list) -> bytes:
    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    _add_fonts(pdf)
    pdf.add_page()
    width = pdf.w - pdf.l_margin - pdf.r_margin

    pdf.set_font("DejaVu", "B", 20)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(width, 9, (title or "Ember conversation")[:120])
    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 6, f"Exported from Ember · {datetime.now().strftime('%B %d, %Y · %H:%M')}")
    pdf.ln(12)

    for msg in messages:
        role = msg.get("role", "assistant")
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        pdf.set_font("DejaVu", "B", 11)
        if role == "user":
            pdf.set_text_color(20, 20, 20)
            label = "You"
        else:
            pdf.set_text_color(200, 110, 40)
            label = "Ember"
        pdf.cell(0, 7, label)
        pdf.ln(8)
        pdf.set_text_color(30, 30, 30)
        _render_content(pdf, content, width)
        pdf.ln(5)

    return bytes(pdf.output())
