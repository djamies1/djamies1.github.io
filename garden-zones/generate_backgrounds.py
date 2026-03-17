"""
Generate 4 seasonal SVG background images for the Plant Zone Finder.
Output: data/winter-bg.svg, data/spring-bg.svg, data/summer-bg.svg, data/autumn-bg.svg
"""

import random
import os

random.seed(42)

W, H = 1920, 1080
COUNT = 500

SEASONS = {
    "winter": {
        "colors": ("#0d1b3e", "#050d1f"),
        "emojis": (
            ["❄️"] * 8 +
            ["🌱"] * 2 +   # indoor seedlings
            ["🧄"] * 2 +   # stored garlic
            ["🥬"] * 2 +   # winter kale
            ["🥕"] * 1     # stored root veg
        ),
    },
    "spring": {
        "colors": ("#0a1f0a", "#04100a"),
        "emojis": (
            ["🌱"] * 6 +   # seedlings
            ["🌷"] * 3 +
            ["🌿"] * 3 +
            ["🫛"] * 2 +   # peas
            ["🥬"] * 2 +   # lettuce
            ["🌸"] * 2
        ),
    },
    "summer": {
        "colors": ("#1a1200", "#080600"),
        "emojis": (
            ["🍅"] * 4 +
            ["🌽"] * 3 +
            ["🥒"] * 2 +
            ["🫑"] * 2 +
            ["🍆"] * 2 +
            ["🌻"] * 3 +
            ["🥦"] * 2
        ),
    },
    "autumn": {
        "colors": ("#1a0800", "#080300"),
        "emojis": (
            ["🎃"] * 5 +
            ["🍂"] * 5 +
            ["🥕"] * 2 +
            ["🧅"] * 1 +
            ["🥔"] * 2 +
            ["🌾"] * 3 +
            ["🍎"] * 1
        ),
    },
}

os.makedirs("data", exist_ok=True)

for season, cfg in SEASONS.items():
    c1, c2 = cfg["colors"]
    emojis = cfg["emojis"]

    items = []
    for _ in range(COUNT):
        emoji = random.choice(emojis)
        size = random.randint(12, 72)
        x = random.uniform(0, W)
        y = random.uniform(0, H)
        rot = random.uniform(-180, 180)
        items.append(
            f'  <text x="{x:.0f}" y="{y:.0f}" font-size="{size}"'
            f' transform="rotate({rot:.0f},{x:.0f},{y:.0f})">{emoji}</text>'
        )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">\n'
        f'  <defs>\n'
        f'    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">\n'
        f'      <stop offset="0%" stop-color="{c1}"/>\n'
        f'      <stop offset="100%" stop-color="{c2}"/>\n'
        f'    </linearGradient>\n'
        f'  </defs>\n'
        f'  <rect width="{W}" height="{H}" fill="url(#g)"/>\n'
        f'  <g font-family="Apple Color Emoji,Segoe UI Emoji,NotoColorEmoji,sans-serif"\n'
        f'     text-anchor="middle" dominant-baseline="middle" opacity="0.25">\n'
        + "\n".join(items) + "\n"
        f'  </g>\n'
        f'</svg>\n'
    )

    path = os.path.join("data", f"{season}-bg.svg")
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"OK {season}-bg.svg  ({COUNT} emojis)")

print(f"\nDone — {len(SEASONS)} seasonal backgrounds written to data/")
