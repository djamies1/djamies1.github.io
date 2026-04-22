#!/usr/bin/env python3
"""
generate_questions.py — Generate new trick questions via Claude API.

Usage:
    python generate_questions.py              # generate 20 new questions
    python generate_questions.py --count 50
    python generate_questions.py --category mandela_effect
    python generate_questions.py --preview
"""

import argparse
import json
import random
import sys
from pathlib import Path

_DIR           = Path(__file__).resolve().parent
QUESTIONS_FILE = _DIR / "questions.json"

CATEGORIES = [
    "history",
    "science",
    "geography",
    "language",
    "mandela_effect",
    "nature",
    "food",
    "law",
]

CATEGORY_PROMPTS = {
    "history":       "Historical facts where the common belief is wrong. e.g. Einstein didn't fail maths, Napoleon wasn't short, Vikings didn't have horned helmets. Surprising but verifiable.",
    "science":       "Scientific misconceptions. e.g. black boxes are orange, bats aren't blind, we don't use 10% of our brains, lightning does strike the same place twice. Must be factually correct.",
    "geography":     "Geographic surprises. e.g. French fries are Belgian, Panama hats are from Ecuador, Australia is both a country and a continent. Counterintuitive location or naming facts.",
    "language":      "Word origins, misquotes, or phrases used backwards. e.g. 'Elementary my dear Watson' was never said, 'blood is thicker than water' means the opposite, word etymologies that shock.",
    "mandela_effect": "Famous things millions of people remember incorrectly. e.g. Monopoly man has no monocle, Pikachu's tail has no black tip, 'Magic mirror' not 'Mirror mirror'. Must be a real, documented Mandela Effect.",
    "nature":        "Surprising animal or plant facts. e.g. goldfish remember for months, sharks have no bones, koalas aren't bears, octopuses have 3 hearts. Common misconceptions about the natural world.",
    "food":          "Food facts that surprise people. e.g. peanuts are legumes not nuts, almonds are drupes not nuts, white chocolate isn't chocolate, the Caesar salad was invented in Mexico.",
    "law":           "Laws or legal facts that shock people. e.g. the Queen owns all unmarked swans, it's illegal to chew gum in Singapore, in some US states you can't buy a car on Sunday.",
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
    return f"tq_{max(nums, default=0) + 1:04d}"


def generate_batch(category: str, count: int, existing_qs: set[str]) -> list[dict]:
    try:
        import anthropic
    except ImportError:
        sys.exit("anthropic package not installed. Run: pip install anthropic")

    client = anthropic.Anthropic()
    existing_sample = "\n".join(f"- {q}" for q in list(existing_qs)[:20])

    prompt = f"""You are creating content for a YouTube Shorts channel called "Trick Questions".
Each Short shows a question for 13 seconds then reveals a surprising correct answer.
The format drives massive engagement because people are confident they know — and are wrong.

Category: {category}
{CATEGORY_PROMPTS[category]}

Generate exactly {count} unique questions for this category.
Avoid these already-existing questions:
{existing_sample}

CRITICAL RULES:
1. Every answer must be factually accurate and verifiable
2. The question must make people confident of an INCORRECT answer before the reveal
3. The answer reveal must feel surprising or counterintuitive
4. No politics, religion, or controversial social topics
5. Keep questions under 100 characters, answers under 80 characters

Return ONLY a valid JSON array. Each element must have exactly these fields:
- "question": the question text (under 100 chars; \\n for line breaks if needed)
- "answer": the correct, surprising answer (under 80 chars)
- "answer_note": one clear explanatory sentence (under 150 chars)
- "category": "{category}"
- "difficulty": one of "easy", "medium", "hard"
- "hook": short hook shown at top of video, under 55 chars (e.g. "Everyone gets this wrong", "The name is a total lie")

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
        batch = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}\n  Raw:\n{raw[:500]}")
        return []

    return batch if isinstance(batch, list) else []


def main():
    parser = argparse.ArgumentParser(
        description="Generate trick questions via Claude API.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--count",    type=int,   default=20)
    parser.add_argument("--category", default=None, choices=CATEGORIES)
    parser.add_argument("--preview",  action="store_true")
    args = parser.parse_args()

    existing    = load_questions()
    existing_qs = {q["question"] for q in existing}
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
        batch = generate_batch(category, count, existing_qs)
        for item in batch:
            q = item.get("question", "").strip()
            if not q or q in existing_qs:
                continue
            item["id"] = next_id(existing + all_new)
            item.setdefault("category", category)
            all_new.append(item)
            existing_qs.add(q)
            print(f"  + [{item['id']}] {q[:60]}")

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
