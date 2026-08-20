#!/usr/bin/env python3
"""Regenerate land/initiation/smartesad-v1.2.html from the mdBook build.

Extracts the <main> content of docs/smartesad-v1.2-protocol.html and wraps
it in the KIWI ARC page template. Run after `mdbook build`, before copying
land/ into docs/land/ (wired into the Makefile build target).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "smartesad-v1.2-protocol.html"
DST = ROOT / "land" / "initiation" / "smartesad-v1.2.html"

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>smartESAD v1.2 — Serial Control Protocol | KIWI ARC</title>
    <meta name="description" content="Vendor-neutral specification of the smartESAD v1.2 serial control interface between a flight controller / host integrator and a smartESAD-compatible Electronic Safe-Arm Device.">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="spec.css">
</head>
<body>

<header class="site-header">
    <div class="container header-inner">
        <a href="./" class="brand">
            <span class="brand-mark"></span>
            <span class="brand-name">KIWI ARC</span>
            <span class="brand-sub">Initiation Systems</span>
        </a>
        <nav class="site-nav">
            <a href="./#capabilities">Capabilities</a>
            <a href="./#safety">Safety</a>
            <a href="./#contact">Contact</a>
        </nav>
        <div class="header-actions">
            <a href="./#contact" class="btn btn-primary btn-sm">Contact us</a>
        </div>
    </div>
</header>

<section class="spec-page">
    <p class="spec-breadcrumb"><a href="./">KIWI ARC</a> <span>/ smartESAD v1.2 — Serial Control Protocol</span></p>
    <article class="spec">
CONTENT_HERE
    </article>
</section>

<footer class="footer">
    <div class="container footer-inner">
        <span>© 2026 KIWI ARC</span>
        <span class="footer-note">Initiation &amp; fuzing systems · Ukraine</span>
    </div>
</footer>

</body>
</html>
"""


def main():
    html = SRC.read_text()
    m = re.search(r"<main>(.*?)</main>", html, re.S)
    if not m:
        sys.exit(f"no <main> block found in {SRC}")
    DST.write_text(TEMPLATE.replace("CONTENT_HERE", m.group(1).strip()))
    print(f"regenerated {DST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
