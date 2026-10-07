#!/usr/bin/env python3
"""Libreria para generar diagramas draw.io y previews SVG.

Uso: importar Diagram y los helpers, construir el diagrama y llamar save().
"""
import os
import html


def esc(text):
    return html.escape(str(text))


STYLES = {
    "rect": "rounded=0;whiteSpace=wrap;html=1;",
    "rounded": "rounded=1;whiteSpace=wrap;html=1;arcSize=10;",
    "ellipse": "ellipse;whiteSpace=wrap;html=1;",
    "actor": "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;",
    "note": "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;",
    "classbox": "rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=6;spacingTop=4;fillColor=#ffffff;strokeColor=#374151;",
    "lifeline": "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;",
    "start": "ellipse;whiteSpace=wrap;html=1;fillColor=#111827;strokeColor=#111827;",
    "end": "ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#111827;strokeWidth=2;",
    "diamond": "rhombus;whiteSpace=wrap;html=1;",
    "cylinder": "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;",
    "cloud": "ellipse;shape=cloud;whiteSpace=wrap;html=1;",
    "component": "shape=component;align=center;verticalAlign=middle;html=1;",
    "input": "rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=middle;spacingLeft=8;fillColor=#ffffff;",
    "button": "rounded=1;whiteSpace=wrap;html=1;fillColor=#2563eb;fontColor=#ffffff;",
    "table": "rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=6;spacingTop=4;fillColor=#ffffff;strokeColor=#374151;",
    "package": "rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=left;spacingLeft=8;spacingTop=6;fillColor=none;strokeColor=#6b7280;dashed=0;",
}


class Shape:
    def __init__(self, sid, x, y, w, h, label, kind, fill, stroke, font, color, bold, align):
        self.id = sid
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.label = label
        self.kind = kind
        self.fill = fill
        self.stroke = stroke
        self.font = font
        self.color = color
        self.bold = bold
        self.align = align


class Edge:
    def __init__(self, eid, src, dst, label, dashed, arrow, start_arrow, color, font):
        self.id = eid
        self.src = src
        self.dst = dst
        self.label = label
        self.dashed = dashed
        self.arrow = arrow
        self.start_arrow = start_arrow
        self.color = color
        self.font = font


class Message:
    def __init__(self, mid, x1, y1, x2, y2, label, dashed, arrow, color, font):
        self.id = mid
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.label = label
        self.dashed = dashed
        self.arrow = arrow
        self.color = color
        self.font = font


class Diagram:
    def __init__(self, name, width, height, bg="#ffffff"):
        self.name = name
        self.width = width
        self.height = height
        self.bg = bg
        self.shapes = []
        self.edges = []
        self.messages = []
        self._counter = 0

    def _nid(self, prefix):
        self._counter += 1
        return f"{prefix}{self._counter}"

    def box(self, x, y, w, h, label, kind="rounded", fill="#dae8fc", stroke="#6c8ebf",
            font=12, color="#111827", bold=False, align="center"):
        sid = self._nid("n")
        self.shapes.append(Shape(sid, x, y, w, h, label, kind, fill, stroke, font, color, bold, align))
        return sid

    def link(self, src, dst, label="", dashed=False, arrow="block", start_arrow=None,
             color="#374151", font=11):
        eid = self._nid("e")
        self.edges.append(Edge(eid, src, dst, label, dashed, arrow, start_arrow, color, font))
        return eid

    def msg(self, x1, y1, x2, y2, label="", dashed=False, arrow="block",
            color="#374151", font=11):
        mid = self._nid("m")
        self.messages.append(Message(mid, x1, y1, x2, y2, label, dashed, arrow, color, font))
        return mid

    def shape_by_id(self, sid):
        for s in self.shapes:
            if s.id == sid:
                return s
        raise KeyError(sid)

    # ------------------------- draw.io -------------------------
    def _cell(self, s):
        style = STYLES.get(s.kind, STYLES["rounded"])
        style += f"fillColor={s.fill};strokeColor={s.stroke};fontSize={s.font};fontColor={s.color};"
        if s.bold:
            style += "fontStyle=1;"
        if s.align == "left":
            style += "align=left;spacingLeft=8;"
        label = s.label
        return (
            f'        <mxCell id="{s.id}" value="{esc(label)}" style="{style}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{s.x}" y="{s.y}" width="{s.w}" height="{s.h}" as="geometry"/>\n'
            f'        </mxCell>\n'
        )

    def _edge_cell(self, e):
        style = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;"
        style += f"endArrow={e.arrow};"
        if e.start_arrow:
            style += f"startArrow={e.start_arrow};"
        if e.dashed:
            style += "dashed=1;"
        style += f"strokeColor={e.color};fontSize={e.font};fontColor=#374151;"
        return (
            f'        <mxCell id="{e.id}" value="{esc(e.label)}" style="{style}" edge="1" parent="1" '
            f'source="{e.src}" target="{e.dst}">\n'
            f'          <mxGeometry relative="1" as="geometry"/>\n'
            f'        </mxCell>\n'
        )

    def _msg_cell(self, m):
        style = "html=1;rounded=0;"
        style += f"endArrow={m.arrow};"
        if m.dashed:
            style += "dashed=1;"
        style += f"strokeColor={m.color};fontSize={m.font};fontColor=#374151;"
        return (
            f'        <mxCell id="{m.id}" value="{esc(m.label)}" style="{style}" edge="1" parent="1">\n'
            f'          <mxGeometry relative="1" as="geometry">\n'
            f'            <mxPoint x="{m.x1}" y="{m.y1}" as="sourcePoint"/>\n'
            f'            <mxPoint x="{m.x2}" y="{m.y2}" as="targetPoint"/>\n'
            f'          </mxGeometry>\n'
            f'        </mxCell>\n'
        )

    def drawio(self):
        cells = "".join(self._cell(s) for s in self.shapes) + "".join(self._edge_cell(e) for e in self.edges) \
            + "".join(self._msg_cell(m) for m in self.messages)
        return (
            '<mxfile host="app.diagrams.net" agent="generador-parqueadero" version="24.0.0">\n'
            f'  <diagram name="{esc(self.name)}" id="{esc(self.name)}">\n'
            f'    <mxGraphModel dx="1422" dy="798" grid="1" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" '
            f'pageWidth="{self.width}" pageHeight="{self.height}" math="0" shadow="0">\n'
            '      <root>\n'
            '        <mxCell id="0"/>\n'
            '        <mxCell id="1" parent="0"/>\n'
            f'{cells}'
            '      </root>\n'
            '    </mxGraphModel>\n'
            '  </diagram>\n'
            '</mxfile>\n'
        )

    # ------------------------- SVG -------------------------
    def _wrap(self, text, width, font):
        maxchars = max(4, int(width / (font * 0.58)))
        out = []
        for raw in str(text).split("\n"):
            if not raw:
                out.append("")
                continue
            words = raw.split(" ")
            line = ""
            for word in words:
                cand = (line + " " + word).strip()
                if len(cand) <= maxchars:
                    line = cand
                else:
                    if line:
                        out.append(line)
                    line = word
            out.append(line)
        return out

    def _svg_text(self, lines, cx, cy, font, color, bold, anchor="middle"):
        if not lines:
            return ""
        lh = font + 3
        total = len(lines) * lh
        y0 = cy - total / 2 + lh * 0.8
        weight = "bold" if bold else "normal"
        parts = []
        for i, line in enumerate(lines):
            parts.append(
                f'<text x="{cx}" y="{y0 + i * lh:.1f}" font-family="Segoe UI,Arial,sans-serif" '
                f'font-size="{font}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{esc(line)}</text>'
            )
        return "".join(parts)

    def _svg_shape(self, s):
        out = []
        common = f'fill="{s.fill}" stroke="{s.stroke}" stroke-width="1.5"'
        if s.kind == "ellipse":
            out.append(f'<ellipse cx="{s.x + s.w / 2}" cy="{s.y + s.h / 2}" rx="{s.w / 2}" ry="{s.h / 2}" {common}/>')
        elif s.kind == "actor":
            cx = s.x + s.w / 2
            out.append(f'<circle cx="{cx}" cy="{s.y + 12}" r="10" {common}/>')
            out.append(f'<line x1="{cx}" y1="{s.y + 22}" x2="{cx}" y2="{s.y + 52}" stroke="{s.stroke}" stroke-width="1.5"/>')
            out.append(f'<line x1="{cx - 14}" y1="{s.y + 32}" x2="{cx + 14}" y2="{s.y + 32}" stroke="{s.stroke}" stroke-width="1.5"/>')
            out.append(f'<line x1="{cx}" y1="{s.y + 52}" x2="{cx - 12}" y2="{s.y + 70}" stroke="{s.stroke}" stroke-width="1.5"/>')
            out.append(f'<line x1="{cx}" y1="{s.y + 52}" x2="{cx + 12}" y2="{s.y + 70}" stroke="{s.stroke}" stroke-width="1.5"/>')
        elif s.kind == "diamond":
            pts = f"{s.x + s.w / 2},{s.y} {s.x + s.w},{s.y + s.h / 2} {s.x + s.w / 2},{s.y + s.h} {s.x},{s.y + s.h / 2}"
            out.append(f'<polygon points="{pts}" {common}/>')
        elif s.kind == "start":
            out.append(f'<circle cx="{s.x + s.w / 2}" cy="{s.y + s.h / 2}" r="{min(s.w, s.h) / 2}" fill="#111827" stroke="#111827"/>')
        elif s.kind == "end":
            r = min(s.w, s.h) / 2
            out.append(f'<circle cx="{s.x + s.w / 2}" cy="{s.y + s.h / 2}" r="{r}" fill="#ffffff" stroke="#111827" stroke-width="2"/>')
            out.append(f'<circle cx="{s.x + s.w / 2}" cy="{s.y + s.h / 2}" r="{r - 3}" fill="#111827"/>')
        elif s.kind == "cylinder":
            out.append(f'<rect x="{s.x}" y="{s.y + 8}" width="{s.w}" height="{s.h - 8}" {common}/>')
            out.append(f'<ellipse cx="{s.x + s.w / 2}" cy="{s.y + 8}" rx="{s.w / 2}" ry="8" {common}/>')
        elif s.kind == "lifeline":
            out.append(f'<rect x="{s.x}" y="{s.y}" width="{s.w}" height="30" rx="4" {common}/>')
            out.append(f'<line x1="{s.x + s.w / 2}" y1="{s.y + 30}" x2="{s.x + s.w / 2}" y2="{s.y + s.h}" '
                       f'stroke="{s.stroke}" stroke-width="1.5" stroke-dasharray="5,5"/>')
        elif s.kind == "classbox":
            out.append(f'<rect x="{s.x}" y="{s.y}" width="{s.w}" height="{s.h}" rx="2" {common}/>')
            out.append(f'<line x1="{s.x}" y1="{s.y + 26}" x2="{s.x + s.w}" y2="{s.y + 26}" stroke="{s.stroke}" stroke-width="1.2"/>')
        elif s.kind == "table":
            out.append(f'<rect x="{s.x}" y="{s.y}" width="{s.w}" height="{s.h}" rx="2" {common}/>')
            out.append(f'<line x1="{s.x}" y1="{s.y + 26}" x2="{s.x + s.w}" y2="{s.y + 26}" stroke="{s.stroke}" stroke-width="1.2"/>')
        elif s.kind == "note":
            out.append(f'<path d="M {s.x} {s.y} L {s.x + s.w - 14} {s.y} L {s.x + s.w} {s.y + 14} L {s.x + s.w} {s.y + s.h} L {s.x} {s.y + s.h} Z" {common}/>')
            out.append(f'<path d="M {s.x + s.w - 14} {s.y} L {s.x + s.w - 14} {s.y + 14} L {s.x + s.w} {s.y + 14}" fill="none" stroke="{s.stroke}"/>')
        elif s.kind == "package":
            out.append(f'<rect x="{s.x}" y="{s.y}" width="{s.w}" height="{s.h}" rx="0" {common}/>')
            out.append(
                f'<text x="{s.x + 10}" y="{s.y + 20}" font-family="Segoe UI,Arial,sans-serif" '
                f'font-size="{s.font}" fill="{s.color}" font-weight="bold">{esc(s.label)}</text>'
            )
            return "".join(out)
        else:
            rx = 8 if s.kind in ("rounded", "input", "button") else 0
            out.append(f'<rect x="{s.x}" y="{s.y}" width="{s.w}" height="{s.h}" rx="{rx}" {common}/>')

        # texto
        lines = self._wrap(s.label, s.w - 10, s.font)
        if s.kind in ("classbox", "table") and "\n" in s.label:
            title, rest = s.label.split("\n", 1)
            out.append(self._svg_text(self._wrap(title, s.w - 12, s.font + 1), s.x + s.w / 2, s.y + 13, s.font + 1, s.color, True))
            out.append(self._svg_text(self._wrap(rest, s.w - 14, s.font - 1), s.x + 7, s.y + 26 + (s.h - 26) / 2, s.font - 1, s.color, False, anchor="start"))
        elif s.kind == "actor":
            out.append(self._svg_text(lines, s.x + s.w / 2, s.y + s.h + s.font, s.font, s.color, s.bold))
        elif s.kind == "lifeline":
            out.append(self._svg_text(self._wrap(s.label, s.w - 8, s.font), s.x + s.w / 2, s.y + 15, s.font, s.color, True))
        else:
            cx = s.x + s.w / 2
            anchor = "middle"
            if s.align == "left":
                cx = s.x + 8
                anchor = "start"
            out.append(self._svg_text(lines, cx, s.y + s.h / 2, s.font, s.color, s.bold, anchor=anchor))
        return "".join(out)

    def _clip(self, src, dst):
        x1, y1 = src.x + src.w / 2, src.y + src.h / 2
        x2, y2 = dst.x + dst.w / 2, dst.y + dst.h / 2
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0:
            return x1, y1, x2, y2

        def boundary(s, from_x, from_y, to_x, to_y):
            t = 1.0
            if to_x > from_x and to_x - from_x != 0:
                t = min(t, (s.x + s.w - from_x) / (to_x - from_x)) if to_x > from_x else t
            if to_x < from_x:
                t = min(t, (s.x - from_x) / (to_x - from_x))
            if to_y > from_y:
                t = min(t, (s.y + s.h - from_y) / (to_y - from_y)) if to_y != from_y else t
            if to_y < from_y:
                t = min(t, (s.y - from_y) / (to_y - from_y))
            return t

        t1 = boundary(src, x1, y1, x2, y2)
        t2 = boundary(dst, x2, y2, x1, y1)
        ax, ay = x1 + dx * t1, y1 + dy * t1
        bx, by = x2 - dx * t2, y2 - dy * t2
        return ax, ay, bx, by

    def _svg_edge(self, e):
        src = self.shape_by_id(e.src)
        dst = self.shape_by_id(e.dst)
        x1, y1, x2, y2 = self._clip(src, dst)
        dash = ' stroke-dasharray="6,4"' if e.dashed else ""
        marker = ""
        if e.arrow == "block":
            marker = ' marker-end="url(#arrow)"'
        elif e.arrow == "open":
            marker = ' marker-end="url(#arrowOpen)"'
        elif e.arrow == "none":
            marker = ""
        start = ' marker-start="url(#arrowOpen)"' if e.start_arrow == "open" else ""
        out = [f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{e.color}" stroke-width="1.4"{dash}{marker}{start}/>']
        if e.label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            lines = self._wrap(e.label, 140, e.font)
            lh = e.font + 2
            for i, line in enumerate(lines):
                out.append(
                    f'<text x="{mx:.1f}" y="{my - (len(lines) - 1) * lh / 2 + i * lh:.1f}" '
                    f'font-family="Segoe UI,Arial,sans-serif" font-size="{e.font}" fill="#374151" '
                    f'text-anchor="middle" paint-order="stroke" stroke="#ffffff" stroke-width="3">{esc(line)}</text>'
                )
        return "".join(out)

    def _svg_msg(self, m):
        dash = ' stroke-dasharray="6,4"' if m.dashed else ""
        marker = ' marker-end="url(#arrow)"' if m.arrow == "block" else ""
        out = [f'<line x1="{m.x1:.1f}" y1="{m.y1:.1f}" x2="{m.x2:.1f}" y2="{m.y2:.1f}" '
               f'stroke="{m.color}" stroke-width="1.4"{dash}{marker}/>']
        if m.label:
            mx = (m.x1 + m.x2) / 2
            my = m.y1 - 6
            out.append(
                f'<text x="{mx:.1f}" y="{my:.1f}" font-family="Segoe UI,Arial,sans-serif" '
                f'font-size="{m.font}" fill="#374151" text-anchor="middle" '
                f'paint-order="stroke" stroke="#ffffff" stroke-width="3">{esc(m.label)}</text>'
            )
        return "".join(out)

    def svg(self):
        defs = (
            '<defs>'
            '<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            '<path d="M 0 0 L 10 5 L 0 10 z" fill="#374151"/></marker>'
            '<marker id="arrowOpen" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
            '<path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#374151" stroke-width="1.5"/></marker>'
            '</defs>'
        )
        body = "".join(self._svg_shape(s) for s in self.shapes)
        edges = "".join(self._svg_edge(e) for e in self.edges)
        messages = "".join(self._svg_msg(m) for m in self.messages)
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.width}" height="{self.height}" '
            f'viewBox="0 0 {self.width} {self.height}">\n'
            f'{defs}\n<rect width="100%" height="100%" fill="{self.bg}"/>\n{edges}\n{messages}\n{body}\n</svg>\n'
        )

    def save(self, directory, filename):
        os.makedirs(directory, exist_ok=True)
        base = os.path.splitext(filename)[0]
        with open(os.path.join(directory, base + ".drawio"), "w", encoding="utf-8") as fh:
            fh.write(self.drawio())
        with open(os.path.join(directory, base + ".svg"), "w", encoding="utf-8") as fh:
            fh.write(self.svg())
        return os.path.join(directory, base)
