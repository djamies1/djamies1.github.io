#!/usr/bin/env python3
"""
generate_questions.py — Generate new WYR questions via Claude API.

Usage:
    python generate_questions.py              # generate 20 new questions
    python generate_questions.py --count 50
    python generate_questions.py --category superpowers
    python generate_questions.py --preview    # print without saving
"""

import argparse
import json
import random
import sys
from pathlib import Path

_DIR           = Path(__file__).resolve().parent
QUESTIONS_FILE = _DIR / "questions.json"

CATEGORIES = [
    "superpowers",
    "lifestyle",
    "moral",
    "absurd",
    "food",
    "social",
    "skills",
    "physical",
    "mental",
]

CATEGORY_PROMPTS = {
    "superpowers":  "Superpower dilemmas — two useful/fun powers where neither is obviously better. e.g. fly vs invisible, teleport vs time stop.",
    "lifestyle":    "Daily life trade-offs — money, time, location, sleep, habits. Real decisions people relate to.",
    "moral":        "Ethical dilemmas — trade-offs between values like wealth/connection, fame/love, honesty/kindness.",
    "absurd":       "Funny/absurd scenarios — both options are weird or uncomfortable. e.g. fight 100 duck-sized horses vs 1 horse-sized duck.",
    "food":         "Food and eating dilemmas — losing favourite foods, only eating one thing, etc.",
    "social":       "Social dilemmas — relationships, reputation, how others perceive you.",
    "skills":       "Ability and talent trade-offs — learning, expertise, mental performance.",
    "physical":     "Body-based dilemmas — temperature, senses, physical traits.",
    "mental":       "Mind-based dilemmas — memory, knowledge, perception, intelligence.",
}


def load_questions() -> list[dict]:
    if not QUESTIONS_FILE.exists():
        return []
    with open(QUESTIONS_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_questions(questions: list[dict]) -> None:
    with open(QUESTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)


def next_id(questions: list[dict]) -> str:
    nums = []
    for q in questions:
        try:
            nums.append(int(q.get("id", "").split("_")[-1]))
        except ValueError:
            pass
    return f"wyr_{max(nums, default=0) + 1:04d}"


def generate_batch(category: str, count: int, existing_a: set[str]) -> list[dict]:
    try:
        import anthropic
    except ImportError:
        sys.exit("anthropic package not installed. Run: pip install anthropic")

    client = anthropic.Anthropic()

    existing_sample = "\n".join(f"- {a}" for a in list(existing_a)[:20])

    prompt = f"""You are creating content for a YouTube Shorts channel called "Would You Rather".
Each Short shows a dilemma where viewers comment A or B. No correct answer — the debate IS the content.
The format drives massive comment engagement because people defend their choice and argue with others.

Category: {category}
{CATEGORY_PROMPTS[category]}

Generate exactly {count} unique Would You Rather dilemmas for this category.
Avoid these already-existing Option A choices:
{existing_sample}

Rules:
- Both options must have real trade-offs — no obvious "correct" answer
- Both options must be YouTube-safe (no violence, politics, or explicit content)
- Should generate genuine debate — people should feel strongly about their choice
- Keep each option under 80 characters

Return ONLY a valid JSON array. Each element must have exactly these fields:
- "option_a": first choice (under 80 chars)
- "option_b": second choice (under 80 chars)
- "category": "{category}"
- "hook": short teaser shown at top of video, under 55 chars (e.g. "No right answer — just pick!", "This one will divide the room")
- "debate_note": one sentence explaining the core trade-off, under 130 chars

Return only the JSON array, no other text."""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        questions = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}\n  Raw:\n{raw[:500]}")
        return []

    return questions if isinstance(questions, list) else []


def main():
    parser = argparse.ArgumentParser(
        description="Generate WYR questions via Claude API.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--count",    type=int,   default=20)
    parser.add_argument("--category", default=None, choices=CATEGORIES)
    parser.add_argument("--preview",  action="store_true")
    args = parser.parse_args()

    existing    = load_questions()
    existing_a  = {q["option_a"] for q in existing}
    print(f"Existing bank: {len(existing)} questions")

    if args.category:
        targets = [(args.category, args.count)]
    else:
        per_cat   = max(1, args.count // len(CATEGORIES))
        remainder = args.count - per_cat * len(CATEGORIES)
        cats      = random.sample(CATEGORIES, len(CATEGORIES))
        targets   = [(cat, per_cat + (1 if i < remainder else 0))
                     for i, cat in enumerate(cats)]

    all_new = []
    for category, count in targets:
        if count <= 0:
            continue
        print(f"\nGenerating {count} × {category}...")
        batch = generate_batch(category, count, existing_a)
        for item in batch:
            a = item.get("option_a", "").strip()
            if not a or a in existing_a:
                continue
            item["id"] = next_id(existing + all_new)
            item.setdefault("category", category)
            all_new.append(item)
            existing_a.add(a)
            print(f"  + [{item['id']}] A: {a[:55]}")

    print(f"\n{len(all_new)} new question(s) generated.")

    if args.preview:
        print(json.dumps(all_new, indent=2, ensure_ascii=False))
        return

    if all_new:
        updated = existing + all_new
        save_questions(updated)
        print(f"Saved. Bank now has {len(updated)} questions.")
    else:
        print("Nothing new to save.")


if __name__ == "__main__":
    main()
