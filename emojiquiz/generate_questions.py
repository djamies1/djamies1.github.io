#!/usr/bin/env python3
"""generate_questions.py — Generate emoji quiz questions via Claude API."""

import argparse, json, sys
from pathlib import Path

_DIR = Path(__file__).resolve().parent
QUESTIONS_FILE = _DIR / "questions.json"
CATEGORIES = ["movies","phrases","songs","geography","books","sports","animals","food"]

def load(): return json.load(open(QUESTIONS_FILE,encoding="utf-8")) if QUESTIONS_FILE.exists() else []
def save(d): json.dump(d,open(QUESTIONS_FILE,"w",encoding="utf-8"),indent=2,ensure_ascii=False)
def next_id(d):
    nums=[int(x.get("id","eq_0").split("_")[-1]) for x in d if x.get("id","").startswith("eq_")]
    return f"eq_{max(nums,default=0)+1:04d}"

def generate(category, count, existing_answers):
    try: import anthropic
    except ImportError: sys.exit("pip install anthropic")
    client = anthropic.Anthropic()
    sample = "\n".join(f"- {a}" for a in list(existing_answers)[:20])
    cat_hints = {
        "movies": "well-known films using 2-4 emojis that represent the plot or title",
        "phrases": "common English idioms or expressions represented as emoji sequences",
        "songs": "famous songs where emojis hint at the title or theme",
        "geography": "countries or cities using their iconic symbols/flags/landmarks",
        "books": "famous books using emojis to hint at the title or plot",
        "sports": "sports or famous athletes using emojis",
        "animals": "animals described by their traits in emoji form",
        "food": "famous dishes or foods using ingredient emojis",
    }
    prompt = f"""Generate {count} emoji quiz questions for a YouTube Shorts channel.
Category: {category} — {cat_hints.get(category,"things represented as emojis")}

Rules:
- Use 2-5 emojis that clearly hint at the answer
- The answer must be famous/well-known
- The emoji combination must be clever and satisfying when revealed
- People should be able to guess it with thought but not immediately
- YouTube-safe content only

Avoid these already-existing answers:
{sample}

Return ONLY a JSON array. Each object:
- "emojis": the emoji string (2-5 emojis, space-separated)
- "answer": the correct answer (under 50 chars)
- "category": "{category}"
- "hook": short hook (under 45 chars, e.g. "Name this movie!", "What's this phrase?")

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
            print(f"  + [{item['id']}] {item.get('emojis','')} → {a}")
    print(f"\n{len(new)} new generated.")
    if args.preview: print(json.dumps(new,indent=2,ensure_ascii=False)); return
    if new: save(existing+new); print(f"Total: {len(existing)+len(new)}")

if __name__ == "__main__": main()
