#!/usr/bin/env python3
"""generate_facts.py — Generate fun facts via Claude API."""

import argparse, json, sys
from pathlib import Path

_DIR = Path(__file__).resolve().parent
FACTS_FILE = _DIR / "facts.json"
CATEGORIES = ["animals","human_body","space","science","maths","history","language","food","geography","psychology"]

def load(): return json.load(open(FACTS_FILE,encoding="utf-8")) if FACTS_FILE.exists() else []
def save(d): json.dump(d,open(FACTS_FILE,"w",encoding="utf-8"),indent=2,ensure_ascii=False)
def next_id(d):
    nums=[int(x.get("id","ff_0").split("_")[-1]) for x in d if x.get("id","").startswith("ff_")]
    return f"ff_{max(nums,default=0)+1:04d}"

def generate(category, count, existing_answers):
    try: import anthropic
    except ImportError: sys.exit("pip install anthropic")
    client = anthropic.Anthropic()
    sample = "\n".join(f"- {a}" for a in list(existing_answers)[:20])
    cat_hints = {
        "animals":    "surprising animal behaviours, abilities, or biology facts",
        "human_body": "counterintuitive facts about the human body and physiology",
        "space":      "mind-blowing space and astronomy facts",
        "science":    "surprising physics, chemistry, or general science facts",
        "maths":      "counterintuitive or surprising mathematical facts",
        "history":    "little-known or surprising historical facts",
        "language":   "surprising facts about words, languages, or linguistics",
        "food":       "surprising facts about food, nutrition, or cooking",
        "geography":  "surprising geographical or geological facts",
        "psychology": "counterintuitive psychological or behavioural science facts",
    }
    prompt = f"""Generate {count} fun facts for a YouTube Shorts channel.
Category: {category} — {cat_hints.get(category,"surprising facts")}

Rules:
- Frame as a question: "How long can a human hold their breath?" (not "Did you know...")
- The answer must be surprising, counterintuitive, or mind-blowing
- Must be 100% factually accurate and verifiable
- YouTube-safe content only
- Keep question under 80 characters if possible

Avoid these already-existing answers:
{sample}

Return ONLY a JSON array. Each object:
- "question": the question string (intriguing, under 100 chars)
- "answer": the surprising answer (under 60 chars)
- "answer_note": one sentence of fascinating elaboration (under 120 chars)
- "category": "{category}"
- "hook": short hook line (under 45 chars, e.g. "Mind-blowing fact!", "You won't believe this!")

Return only the JSON array, no other text."""
    msg = client.messages.create(model="claude-opus-4-6",max_tokens=2048,
                                  messages=[{"role":"user","content":prompt}])
    raw = msg.content[0].text.strip()
    if raw.startswith("```"): raw=raw.split("\n",1)[1].rsplit("```",1)[0].strip()
    try: result=json.loads(raw)
    except: return []
    return result if isinstance(result,list) else []

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count",type=int,default=20)
    ap.add_argument("--category",default=None,choices=CATEGORIES)
    ap.add_argument("--preview",action="store_true")
    args = ap.parse_args()
    existing=load(); ea={q["answer"] for q in existing}
    print(f"Existing: {len(existing)}")
    import random
    cats=[(args.category,args.count)] if args.category else [(c,max(1,args.count//len(CATEGORIES))) for c in random.sample(CATEGORIES,len(CATEGORIES))]
    new=[]
    for cat,cnt in cats:
        if cnt<=0: continue
        print(f"\nGenerating {cnt} × {cat}...")
        for item in generate(cat,cnt,ea):
            a=item.get("answer","").strip()
            if not a or a in ea: continue
            item["id"]=next_id(existing+new); new.append(item); ea.add(a)
            print(f"  + [{item['id']}] {item.get('question','')[:60]}")
    print(f"\n{len(new)} new generated.")
    if args.preview: print(json.dumps(new,indent=2,ensure_ascii=False)); return
    if new: save(existing+new); print(f"Total: {len(existing)+len(new)}")

if __name__ == "__main__": main()
