#!/usr/bin/env python3
"""generate_questions.py — Generate Mandela Effect questions via Claude API."""

import argparse, json, sys
from pathlib import Path

_DIR = Path(__file__).resolve().parent
QUESTIONS_FILE = _DIR / "questions.json"

def load(): return json.load(open(QUESTIONS_FILE,encoding="utf-8")) if QUESTIONS_FILE.exists() else []
def save(d): json.dump(d, open(QUESTIONS_FILE,"w",encoding="utf-8"), indent=2, ensure_ascii=False)
def next_id(d):
    nums=[int(x.get("id","me_0").split("_")[-1]) for x in d if x.get("id","").startswith("me_")]
    return f"me_{max(nums,default=0)+1:04d}"

def generate(count, existing_qs):
    try: import anthropic
    except ImportError: sys.exit("pip install anthropic")
    client = anthropic.Anthropic()
    sample = "\n".join(f"- {q}" for q in list(existing_qs)[:25])
    prompt = f"""Generate {count} Mandela Effect questions for a YouTube Shorts channel.
Each question presents something people commonly misremember, then reveals the truth.
Format: pose it as a True/False statement, or "Is it X or Y?" question.

Rules:
- Must be a documented or widely-reported Mandela Effect
- The answer must be factually correct and verifiable
- Both the false memory AND the correct fact must be interesting
- YouTube-safe (no politics, religion, or sensitive social topics)

Avoid these already-existing questions:
{sample}

Return ONLY a JSON array. Each object:
- "question": the question/statement (under 120 chars, use \\n for line breaks)
- "answer": the correct answer (under 80 chars)
- "answer_note": one explanatory sentence (under 150 chars)
- "hook": video hook text shown at top (under 55 chars, e.g. "Everyone gets this wrong")

Return only the JSON array."""
    msg = client.messages.create(model="claude-opus-4-6", max_tokens=4096,
                                  messages=[{"role":"user","content":prompt}])
    raw = msg.content[0].text.strip()
    if raw.startswith("```"): raw = raw.split("\n",1)[1].rsplit("```",1)[0].strip()
    try: return json.loads(raw) if isinstance(json.loads(raw),list) else []
    except: return []

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=20)
    ap.add_argument("--preview", action="store_true")
    args = ap.parse_args()
    existing = load(); eq = {q["question"] for q in existing}
    print(f"Existing: {len(existing)}")
    batch = generate(args.count, eq)
    new = []
    for item in batch:
        q = item.get("question","").strip()
        if not q or q in eq: continue
        item["id"] = next_id(existing+new)
        new.append(item); eq.add(q)
        print(f"  + [{item['id']}] {q[:60]}")
    print(f"\n{len(new)} new generated.")
    if args.preview: print(json.dumps(new,indent=2,ensure_ascii=False)); return
    if new: save(existing+new); print(f"Saved. Total: {len(existing)+len(new)}")

if __name__ == "__main__": main()
