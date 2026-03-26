"""
Renders a legal document template (markdown with CommonPaper span-link placeholders)
into an HTML preview with field values substituted.
"""
import os
import re

TEMPLATES_DIR = os.getenv(
    "TEMPLATES_DIR",
    os.path.join(os.path.dirname(__file__), "..", "templates"),
)

_UNFILLED = (
    '<span style="color:#b45309;background:#fef3c7;padding:0 3px;'
    'border-radius:2px;font-style:italic">{name}</span>'
)
_FILLED = '<strong style="color:#032147">{value}</strong>'

_SPAN_LINK_RE = re.compile(r'<span class="[^"]*_link">([^<]+)</span>')
_HEADER_RE = re.compile(r'^(#{1,4})\s+(.+)$', re.MULTILINE)
_BOLD_RE = re.compile(r'\*\*(.+?)\*\*')
_BOLD_RE2 = re.compile(r'__(.+?)__')
_OL_RE = re.compile(r'^(\s*)(\d+)\.\s+', re.MULTILINE)
_HEADER_SPAN_RE = re.compile(r'<span class="header_\d+"[^>]*>([^<]+)</span>')


def _md_to_html(text: str) -> str:
    """Minimal markdown → HTML conversion for the CommonPaper templates."""
    # Strip header/section span wrappers (they're presentational, not content)
    text = _HEADER_SPAN_RE.sub(r'\1', text)
    # Headings
    text = _HEADER_RE.sub(lambda m: f'<h{len(m.group(1))}>{m.group(2)}</h{len(m.group(1))}>', text)
    # Bold
    text = _BOLD_RE.sub(r'<strong>\1</strong>', text)
    text = _BOLD_RE2.sub(r'<strong>\1</strong>', text)
    # Ordered list items (simple: strip leading number)
    text = _OL_RE.sub(lambda m: f'{m.group(1)}<li>', text)
    # Paragraphs: blank-line separated blocks
    paragraphs = re.split(r'\n{2,}', text.strip())
    parts = []
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if p.startswith('<h') or p.startswith('<li'):
            parts.append(p)
        else:
            parts.append(f'<p>{p}</p>')
    return '\n'.join(parts)


def render_html(doc_type: str, fields: dict, template_field_map: dict) -> str:
    """Load template, substitute placeholders, return standalone HTML."""
    from chat import DOCUMENT_CATALOG
    info = DOCUMENT_CATALOG.get(doc_type, {})
    template_file = info.get("template_file", "")
    path = os.path.join(TEMPLATES_DIR, template_file)

    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        content = f"# {doc_type}\n\nTemplate file not found: {template_file}"

    # Substitute span-link placeholders
    def replace(match: re.Match) -> str:
        name = match.group(1)
        field_key = template_field_map.get(name)
        value = fields.get(field_key) if field_key else None
        if value:
            return _FILLED.format(value=value)
        return _UNFILLED.format(name=name)

    content = _SPAN_LINK_RE.sub(replace, content)
    body = _md_to_html(content)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{doc_type}</title>
<style>
  body {{ font-family: Georgia, serif; font-size: 14px; line-height: 1.7;
         max-width: 780px; margin: 48px auto; padding: 0 48px; color: #1a1a1a; }}
  h1 {{ font-size: 22px; text-align: center; margin-bottom: 4px; }}
  h2 {{ font-size: 13px; font-family: Arial, sans-serif; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.8px; color: #444;
        border-bottom: 2px solid #1a1a1a; padding-bottom: 6px;
        margin-top: 36px; margin-bottom: 16px; }}
  h3 {{ font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 4px; }}
  h4 {{ font-size: 13px; font-weight: 600; margin-top: 14px; margin-bottom: 2px; }}
  p, li {{ margin-bottom: 10px; text-align: justify; }}
  li {{ margin-left: 20px; }}
  .footer {{ margin-top: 40px; font-size: 11px; color: #888;
             border-top: 1px solid #ddd; padding-top: 10px; }}
</style>
</head>
<body>
{body}
<div class="footer">Common Paper — free to use under CC BY 4.0.</div>
</body>
</html>"""
