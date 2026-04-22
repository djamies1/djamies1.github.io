#!/usr/bin/env python3
"""
generate_problems.py — Generate new math problems via Claude API and append to problems.json.

Keeps the content bank topped up without manual work.

Usage:
    python generate_problems.py              # generate 20 new problems
    python generate_problems.py --count 50   # generate 50 new problems
    python generate_problems.py --category order_of_operations  # specific category
    python generate_problems.py --preview    # print generated problems without saving
"""

import argparse
import json
import random
import sys
from pathlib import Path

_DIR          = Path(__file__).resolve().parent
PROBLEMS_FILE = _DIR / "problems.json"

CATEGORIES = [
    "order_of_operations",
    "trick_question",
    "word_problem",
    "sequence",
    "common_knowledge",
    "logic",
]

CATEGORY_PROMPTS = {
    "order_of_operations": (
        "Create math problems involving order of operations (PEMDAS/BODMAS) where most people "
        "intuitively get the wrong answer. Examples: '8 ÷ 2(2+2)', '1+1+1+1+1×0'. "
        "The answer should be surprising but mathematically correct."
    ),
    "trick_question": (
        "Create trick math/logic questions where the wording is the trap. "
        "Examples: 'A farmer has 17 sheep, all but 9 die — how many left?' "
        "or 'How many months have 28 days?'. The answer exploits an assumption in the question."
    ),
    "word_problem": (
        "Create word problems that have a counterintuitive answer. "
        "Examples: bat-and-ball ($1.10 total, bat $1 more — ball is 5¢ not 10¢), "
        "snail-in-well (climbs 3ft day, slips 2ft night), lily-pad doubling. "
        "These should require careful thought, not just arithmetic."
    ),
    "sequence": (
        "Create number or letter sequence puzzles. "
        "Examples: Fibonacci, perfect squares, cubes, months as letters, "
        "number-letter encoding (O T T F F S S E — One Two Three...). "
        "The pattern should be satisfying to discover."
    ),
    "common_knowledge": (
        "Create questions where the confident/common answer is wrong. "
        "Examples: 'How long was the Hundred Years' War?' (116 years), "
        "Mandela Effect questions, scientific misconceptions. "
        "The revelation should make people want to share it."
    ),
    "logic": (
        "Create pure logic puzzles. Examples: 'I am an odd number, remove one letter and I become even' (seven→even), "
        "clock angle problems, probability paradoxes (birthday paradox). "
        "Should require lateral thinking."
    ),
}


def load_problems() -> list[dict]:
    if not PROBLEMS_FILE.exists():
        return []
    with open(PROBLEMS_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_problems(problems: list[dict]) -> None:
    with open(PROBLEMS_FILE, "w", encoding="utf-8") as f:
        json.dump(problems, f, indent=2, ensure_ascii=False)


def next_id(problems: list[dict]) -> str:
    if not problems:
        return "math_0001"
    existing = [p.get("id", "") for p in problems]
    nums = []
    for eid in existing:
        try:
            nums.append(int(eid.split("_")[-1]))
        except ValueError:
            pass
    next_num = max(nums, default=0) + 1
    return f"math_{next_num:04d}"


def generate_batch(category: str, count: int, existing_questions: set[str]) -> list[dict]:
    """Call Claude API to generate a batch of problems for a given category."""
    try:
        import anthropic
    except ImportError:
        sys.exit("anthropic package not installed. Run: pip install anthropic")

    client = anthropic.Anthropic()

    existing_sample = "\n".join(f"- {q}" for q in list(existing_questions)[:20])

    prompt = f"""You are creating content for a YouTube Shorts channel called "Math Challenge".
Each Short shows a math/logic problem for 13 seconds, then reveals the answer.
The format drives massive engagement — people comment their answers and debate.

Category: {category}
{CATEGORY_PROMPTS[category]}

Generate exactly {count} unique problems for this category.
Avoid these already-existing questions:
{existing_sample}

Return ONLY a valid JSON array. Each element must have exactly these fields:
- "question": the problem text (keep under 120 chars; use \\n for line breaks if needed)
- "answer": the correct answer (short and clear, under 60 chars)
- "answer_note": one-sentence explanation of why (under 150 chars)
- "category": "{category}"
- "difficulty": one of "easy", "medium", "hard"
- "hook": short hook text shown at the top of the video, under 55 chars (e.g. "99% of adults get this wrong", "Can you crack it?")

The questions must:
1. Have a single, clear correct answer
2. Be genuinely surprising or counterintuitive
3. Generate comments (people want to post their answer)
4. Work as text-only on screen

Return only the JSON array, no other text."""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        problems = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}")
        print(f"  Raw response:\n{raw[:500]}")
        return []

    if not isinstance(problems, list):
        print("  Error: expected a JSON array.")
        return []

    return problems


def main():
    parser = argparse.ArgumentParser(
        description="Generate math challenge problems via Claude API.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--count",    type=int,   default=20,
                        help="Total number of problems to generate")
    parser.add_argument("--category", default=None,
                        choices=CATEGORIES,
                        help="Generate only this category (default: mix of all)")
    parser.add_argument("--preview",  action="store_true",
                        help="Print problems without saving to file")
    args = parser.parse_args()

    existing = load_problems()
    existing_questions = {p["question"] for p in existing}
    print(f"Existing bank: {len(existing)} problems")

    # Decide which categories to generate
    if args.category:
        targets = [(args.category, args.count)]
    else:
        # Distribute evenly across all categories
        per_cat = max(1, args.count // len(CATEGORIES))
        remainder = args.count - per_cat * len(CATEGORIES)
        cats = random.sample(CATEGORIES, len(CATEGORIES))
        targets = [(cat, per_cat + (1 if i < remainder else 0))
                   for i, cat in enumerate(cats)]

    all_new = []
    for category, count in targets:
        if count <= 0:
            continue
        print(f"\nGenerating {count} × {category}...")
        batch = generate_batch(category, count, existing_questions)

        # Assign IDs and deduplicate
        for item in batch:
            q = item.get("question", "").strip()
            if not q or q in existing_questions:
                continue
            item["id"] = next_id(existing + all_new)
            item.setdefault("category", category)
            all_new.append(item)
            existing_questions.add(q)
            print(f"  + [{item['id']}] {q[:60]}")

    print(f"\n{len(all_new)} new problem(s) generated.")

    if args.preview:
        print("\n-- PREVIEW (not saved) --")
        print(json.dumps(all_new, indent=2, ensure_ascii=False))
        return

    if all_new:
        updated = existing + all_new
        save_problems(updated)
        print(f"Saved. Bank now has {len(updated)} problems.")
    else:
        print("Nothing new to save.")


if __name__ == "__main__":
    main()
