#!/usr/bin/env python3
"""generate_statements.py — Generate true/false statements via Claude API."""

import argparse, json, sys
from pathlib import Path

_DIR = Path(__file__).resolve().parent
STATEMENTS_FILE = _DIR / "statements.json"
CATEGORIES = ["science","space","nature","human_body","history","food","geography","language","animals","psychology"]

def load(): return json.load(open(STATEMENTS_FILE,encoding="utf-8")) if STATEMENTS_FILE.exists() else []
def save(d): json.dump(d,open(STATEMENTS_FILE,"w",encoding="utf-8"),indent=2,ensure_ascii=False)
def next_id(d):
    nums=[int(x.get("id","tof_0").split("_")[-1]) for x in d if x.get("id","").startswith("tof_")]
    return f"tof_{max(nums,default=0)+1:04d}"

def generate(category, count, existing_statements):
    try: import anthropic
    except ImportError: sys.exit("pip install anthropic")
    client = anthropic.Anthropic()
    sample = "\n".join(f"- {s}" for s in list(existing_statements)[:20])
    cat_hints = {
        "science":    "common science misconceptions and surprising physics/chemistry facts",
        "space":      "astronomy myths and counterintuitive space facts",
        "nature":     "animal behaviour myths and surprising nature facts",
        "human_body": "body myths (e.g. 'we use 10% of our brain') and surprising physiology",
        "history":    "historical myths and misconceptions (e.g. Napoleon's height)",
        "food":       "food myths and surprising nutrition facts",
        "geography":  "geographical misconceptions (e.g. largest desert)",
        "language":   "language myths and surprising etymology/linguistics facts",
        "animals":    "animal myths (e.g. goldfish memory, bats are blind)",
        "psychology": "psychology myths and counterintuitive behaviour science facts",
    }
    prompt = f"""Generate {count} true-or-false quiz statements for a YouTube Shorts channel.
Category: {category} — {cat_hints.get(category,"surprising facts")}

Rules:
- Each statement should sound plausible but have a surprising answer
- Prefer FALSE statements (myths, misconceptions) — these drive more engagement
- Must be 100% factually accurate and verifiable
- Statement should be a declarative sentence (not a question)
- YouTube-safe content only
- Mix in some TRUE statements too for variety (roughly 25% TRUE)

Avoid these already-existing statements:
{sample}

Return ONLY a JSON array. Each object:
- "statement": the declarative statement (under 100 chars)
- "verdict": "TRUE", "FALSE", or nuanced like "TRUE — mostly" / "FALSE — technically"
- "explanation": one-sentence factual explanation (under 140 chars)
- "category": "{category}"
- "hook": short hook line (under 45 chars, e.g. "True or False?", "Think you know?")

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
    existing=load(); es={q["statement"] for q in existing}
    print(f"Existing: {len(existing)}")
    import random
    cats=[(args.category,args.count)] if args.category else [(c,max(1,args.count//len(CATEGORIES))) for c in random.sample(CATEGORIES,len(CATEGORIES))]
    new=[]
    for cat,cnt in cats:
        if cnt<=0: continue
        print(f"\nGenerating {cnt} × {cat}...")
        for item in generate(cat,cnt,es):
            s=item.get("statement","").strip()
            if not s or s in es: continue
            item["id"]=next_id(existing+new); new.append(item); es.add(s)
            print(f"  + [{item['id']}] [{item.get('verdict','?')}] {s[:65]}")
    print(f"\n{len(new)} new generated.")
    if args.preview: print(json.dumps(new,indent=2,ensure_ascii=False)); return
    if new: save(existing+new); print(f"Total: {len(existing)+len(new)}")

if __name__ == "__main__": main()
