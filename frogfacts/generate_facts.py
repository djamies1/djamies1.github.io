#!/usr/bin/env python3
"""
generate_facts.py — Generate and verify frog facts using Claude AI.

Two-pass approach:
  1. Generate: Claude (Sonnet) produces batches of frog facts
  2. Verify:   Claude (Haiku) fact-checks each one for accuracy
  Only facts that pass verification are saved to facts.json.

Requires:
    pip install anthropic
    set ANTHROPIC_API_KEY=sk-ant-...

Usage:
    python generate_facts.py                # generate 200 new verified facts
    python generate_facts.py --count 400    # larger run
    python generate_facts.py --count 50 --batch-size 10   # smaller batches
    python generate_facts.py --dry-run      # show what would be generated, don't save
"""

import argparse, json, sys, time
from pathlib import Path

try:
    import anthropic
except ImportError:
    sys.exit("pip install anthropic")

_DIR       = Path(__file__).resolve().parent
FACTS_FILE = _DIR / "facts.json"

GENERATE_MODEL = "claude-sonnet-4-6"
VERIFY_MODEL   = "claude-haiku-4-5-20251001"

# ── Prompts ───────────────────────────────────────────────────────────────────

_GENERATE_PROMPT = """\
Generate {n} unique and interesting frog facts.

Rules:
- Every fact must be scientifically accurate and well-documented in herpetology
- Do NOT invent statistics or numbers you are not certain about
- Do NOT use vague phrases like "some frogs" without specifics — be precise
- Each fact must be a single complete sentence, 60–250 characters, ending in a period
- Cover a wide variety of topics: biology, behaviour, species, reproduction,
  diet, habitat, adaptations, conservation, evolution, toxicity, calls
- Do not repeat or closely paraphrase any of these already-existing facts:
  {existing_sample}

Return ONLY a valid JSON array of strings — no explanation, no markdown:
["Fact one here.", "Fact two here."]"""

_VERIFY_PROMPT = """\
You are a herpetology expert and scientific fact-checker.

Review each frog fact below and assign a verdict:
  "pass"      — accurate, well-documented, not misleading
  "fail"      — incorrect, exaggerated, or contains invented/uncertain statistics
  "uncertain" — plausible but cannot be confidently verified

Facts to check (JSON array):
{facts_json}

Return ONLY a valid JSON array in the same order as input — no explanation, no markdown:
[{{"verdict": "pass", "reason": "short reason"}}, ...]"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_existing() -> list:
    if FACTS_FILE.exists():
        with open(FACTS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return []


def _save_facts(facts: list) -> None:
    with open(FACTS_FILE, "w", encoding="utf-8") as f:
        json.dump(facts, f, indent=2, ensure_ascii=False)


def _parse_json_array(text: str) -> list:
    """Extract the first JSON array from a model response."""
    start = text.find("[")
    end   = text.rfind("]") + 1
    if start == -1 or end == 0:
        return []
    try:
        return json.loads(text[start:end])
    except json.JSONDecodeError:
        return []


# ── API calls ─────────────────────────────────────────────────────────────────

def _generate_batch(client, n: int, existing_texts: set) -> list:
    sample = json.dumps(list(existing_texts)[:30])
    prompt = _GENERATE_PROMPT.format(n=n, existing_sample=sample)

    try:
        resp = client.messages.create(
            model=GENERATE_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = _parse_json_array(resp.content[0].text)
        return [f for f in raw if isinstance(f, str) and 40 <= len(f) <= 450]
    except Exception as e:
        print(f"  Generate error: {e}")
        return []


def _verify_batch(client, facts: list) -> list:
    """Returns list of dicts with 'verdict' and 'reason' keys."""
    prompt = _VERIFY_PROMPT.format(facts_json=json.dumps(facts, indent=2))

    try:
        resp = client.messages.create(
            model=VERIFY_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        results = _parse_json_array(resp.content[0].text)
        # Pad with uncertain verdicts if response is short
        while len(results) < len(facts):
            results.append({"verdict": "uncertain", "reason": "no response"})
        return results
    except Exception as e:
        print(f"  Verify error: {e}")
        return [{"verdict": "uncertain", "reason": str(e)}] * len(facts)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count",      type=int, default=200,
                    help="Target number of new verified facts to add (default: 200)")
    ap.add_argument("--batch-size", type=int, default=20,
                    help="Facts generated per API call (default: 20)")
    ap.add_argument("--dry-run",    action="store_true",
                    help="Run generation + verification but don't save to facts.json")
    args = ap.parse_args()

    client   = anthropic.Anthropic()   # reads ANTHROPIC_API_KEY from environment
    existing = _load_existing()
    existing_texts = {f["fact"].lower().strip() for f in existing}
    next_id  = len(existing) + 1

    print(f"Existing facts : {len(existing)}")
    print(f"Target new     : {args.count}")
    print(f"Batch size     : {args.batch_size}")
    if args.dry_run:
        print("DRY RUN — nothing will be saved\n")
    else:
        print()

    verified  = []           # final passing facts
    total_gen = 0
    total_fail = 0
    total_uncertain = 0
    attempt   = 0
    max_attempts = (args.count // args.batch_size + 2) * 4   # safety ceiling

    while len(verified) < args.count and attempt < max_attempts:
        attempt += 1
        need       = args.count - len(verified)
        # Request slightly more than needed to account for fail rate
        batch_n    = min(args.batch_size, need + max(5, need // 2))

        print(f"── Batch {attempt} ──────────────────────────────────────────")
        print(f"  Generating {batch_n} candidates...")
        candidates = _generate_batch(client, batch_n, existing_texts)

        if not candidates:
            print("  No candidates returned — retrying after pause.")
            time.sleep(5)
            continue

        # Deduplicate against all seen facts
        unique = []
        for fact in candidates:
            key = fact.lower().strip()
            if key not in existing_texts:
                existing_texts.add(key)
                unique.append(fact)

        total_gen += len(unique)
        print(f"  {len(unique)} unique after dedup. Verifying...")

        if not unique:
            continue

        results = _verify_batch(client, unique)

        batch_pass = batch_fail = batch_uncertain = 0
        for fact, result in zip(unique, results):
            verdict = result.get("verdict", "uncertain") if isinstance(result, dict) else "uncertain"
            reason  = result.get("reason", "")  if isinstance(result, dict) else ""
            if verdict == "pass":
                verified.append(fact)
                batch_pass += 1
            elif verdict == "fail":
                batch_fail += 1
                total_fail += 1
                print(f"  FAIL: {fact[:70]}... → {reason}")
            else:
                batch_uncertain += 1
                total_uncertain += 1

        print(f"  Pass: {batch_pass}  Fail: {batch_fail}  Uncertain: {batch_uncertain}"
              f"  |  Total verified: {len(verified)}/{args.count}")
        time.sleep(1)

    # ── Results ───────────────────────────────────────────────────────────────
    final = verified[:args.count]
    print(f"\n{'=' * 55}")
    print(f"Generated : {total_gen} unique candidates")
    print(f"Passed    : {len(final)}")
    print(f"Failed    : {total_fail}")
    print(f"Uncertain : {total_uncertain}")
    print(f"{'=' * 55}")

    if args.dry_run:
        print("\nDRY RUN — sample of verified facts:")
        for fact in final[:10]:
            print(f"  • {fact}")
        return

    new_entries = [
        {"id": f"frog_{next_id + i:04d}", "fact": fact}
        for i, fact in enumerate(final)
    ]
    combined = existing + new_entries
    _save_facts(combined)

    print(f"\nSaved {len(new_entries)} new facts.")
    print(f"Total in facts.json: {len(combined)}")
    if new_entries:
        print("\nSample:")
        for e in new_entries[:5]:
            print(f"  [{e['id']}] {e['fact'][:90]}")


if __name__ == "__main__":
    main()
