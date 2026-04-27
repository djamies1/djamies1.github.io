import json
from pathlib import Path

F = Path("C:/Users/prawn/OneDrive/Documents/djamies1.github.io/mathchallenge/problems.json")
existing = json.load(open(F, encoding="utf-8"))
ids = [int(x["id"].split("_")[-1]) for x in existing if x.get("id","").startswith("mc_")]
next_n = max(ids, default=0) + 1

new_items = [
    # ORDER OF OPERATIONS
    {"question": "8 + 4 x 2 - 1 = ?", "answer": "15", "answer_note": "Multiply first: 4x2=8, then 8+8-1=15.", "category": "order_of_operations", "difficulty": "easy", "hook": "Don't add first!"},
    {"question": "20 / 4 + 3 x 2 = ?", "answer": "11", "answer_note": "Division and multiplication first: 20/4=5, 3x2=6, then 5+6=11.", "category": "order_of_operations", "difficulty": "easy", "hook": "Two steps!"},
    {"question": "(7 + 3) x (10 - 6) = ?", "answer": "40", "answer_note": "Brackets first: (10)x(4)=40.", "category": "order_of_operations", "difficulty": "easy", "hook": "Brackets always win!"},
    {"question": "3^2 + 4^2 = ?", "answer": "25", "answer_note": "9 + 16 = 25. Also 3-4-5 Pythagorean triple!", "category": "order_of_operations", "difficulty": "medium", "hook": "Pythagorean surprise!"},
    {"question": "100 / (2 + 3) x 2 = ?", "answer": "40", "answer_note": "Bracket first: 100/5=20, then 20x2=40.", "category": "order_of_operations", "difficulty": "medium", "hook": "Bracket traps!"},
    {"question": "5 + 3^2 x 2 - 4 = ?", "answer": "19", "answer_note": "Exponent first: 3^2=9, then 9x2=18, then 5+18-4=19.", "category": "order_of_operations", "difficulty": "medium", "hook": "Three operations!"},
    {"question": "2^3 x 3 + 5 x 2 = ?", "answer": "34", "answer_note": "Exponent: 2^3=8. Then 8x3=24, 5x2=10. Then 24+10=34.", "category": "order_of_operations", "difficulty": "hard", "hook": "Exponents then multiply!"},
    {"question": "50 - 6 x 4 + 2^3 = ?", "answer": "34", "answer_note": "6x4=24, 2^3=8. Then 50-24+8=34.", "category": "order_of_operations", "difficulty": "hard", "hook": "Multiple steps!"},
    # SEQUENCES
    {"question": "What comes next? 1, 4, 9, 16, ?", "answer": "25", "answer_note": "These are perfect squares: 1², 2², 3², 4², 5²=25.", "category": "sequences", "difficulty": "easy", "hook": "Square numbers!"},
    {"question": "What comes next? 2, 6, 18, 54, ?", "answer": "162", "answer_note": "Multiply by 3 each time: 54x3=162.", "category": "sequences", "difficulty": "easy", "hook": "Triple trouble!"},
    {"question": "What comes next? 1, 1, 2, 3, 5, 8, ?", "answer": "13", "answer_note": "Fibonacci sequence: each number is the sum of the two before it. 5+8=13.", "category": "sequences", "difficulty": "medium", "hook": "Nature's sequence!"},
    {"question": "What comes next? 100, 91, 83, 76, ?", "answer": "70", "answer_note": "Differences are 9, 8, 7, 6... So 76-6=70.", "category": "sequences", "difficulty": "medium", "hook": "Decreasing gaps!"},
    {"question": "What comes next? 3, 6, 12, 24, 48, ?", "answer": "96", "answer_note": "Multiply by 2 each time: 48x2=96.", "category": "sequences", "difficulty": "easy", "hook": "Doubling!"},
    {"question": "What comes next? 1, 8, 27, 64, ?", "answer": "125", "answer_note": "Cube numbers: 1³, 2³, 3³, 4³, 5³=125.", "category": "sequences", "difficulty": "hard", "hook": "Cube it!"},
    {"question": "What comes next? 2, 3, 5, 7, 11, ?", "answer": "13", "answer_note": "Prime numbers in order: 2, 3, 5, 7, 11, 13.", "category": "sequences", "difficulty": "medium", "hook": "Prime time!"},
    {"question": "What comes next? 0.5, 1, 2, 4, 8, ?", "answer": "16", "answer_note": "Multiply by 2 each time: 8x2=16.", "category": "sequences", "difficulty": "easy", "hook": "Doubling from a half!"},
    # WORD / TRICK PROBLEMS
    {"question": "If 5 cats eat 5 mice in 5 minutes, how many cats eat 100 mice in 100 minutes?", "answer": "5", "answer_note": "Each cat eats 1 mouse per 5 minutes. In 100 minutes, each cat eats 20 mice. 5 cats eat 100 mice.", "category": "word", "difficulty": "hard", "hook": "Classic trap!"},
    {"question": "A farmer has 17 sheep. All but 9 die. How many remain?", "answer": "9", "answer_note": "'All but 9' means 9 survive.", "category": "word", "difficulty": "easy", "hook": "Read carefully!"},
    {"question": "You have a 3-litre jug and a 5-litre jug. How do you measure exactly 4 litres?", "answer": "Fill 5L, pour into 3L (leaving 2L). Empty 3L. Pour 2L in. Fill 5L again, pour until 3L full (1L goes in). 5L has 4L left.", "answer_note": "Classic water pouring puzzle.", "category": "word", "difficulty": "hard", "hook": "No measuring scale needed!"},
    {"question": "A brick weighs 1kg plus half a brick. How much does a brick weigh?", "answer": "2kg", "answer_note": "Let B = weight. B = 1 + B/2. B/2 = 1. B = 2kg.", "category": "word", "difficulty": "medium", "hook": "Algebra in disguise!"},
    {"question": "If you're in a race and overtake the person in 2nd place, what position are you in?", "answer": "2nd", "answer_note": "You take their spot — 2nd place. You'd need to pass 1st to lead.", "category": "word", "difficulty": "easy", "hook": "Don't overthink it!"},
    {"question": "How many months have 28 days?", "answer": "12", "answer_note": "All 12 months have at least 28 days!", "category": "word", "difficulty": "easy", "hook": "Classic trick!"},
    {"question": "A snail is at the bottom of a 10m well. Each day it climbs 3m, each night it slides 2m. How many days to escape?", "answer": "8 days", "answer_note": "Net gain = 1m/day. After 7 days it's at 7m. On day 8 it climbs 3m to 10m and escapes.", "category": "word", "difficulty": "hard", "hook": "The snail puzzle!"},
    {"question": "If there are 3 apples and you take away 2, how many apples do you have?", "answer": "2", "answer_note": "You took 2, so you have 2.", "category": "word", "difficulty": "easy", "hook": "You have what you took!"},
    {"question": "A man drives from A to B at 60 km/h, then back at 40 km/h. What is his average speed for the whole trip?", "answer": "48 km/h", "answer_note": "Harmonic mean: 2/(1/60+1/40) = 2/(2/120+3/120) = 2/(5/120) = 48.", "category": "word", "difficulty": "hard", "hook": "Not just the average!"},
    # LOGIC
    {"question": "You have two coins totalling 30 cents. One is not a 10-cent coin. What are they?", "answer": "A 20-cent coin and a 10-cent coin", "answer_note": "One is NOT a 10-cent coin — the other one is!", "category": "logic", "difficulty": "medium", "hook": "Sneaky phrasing!"},
    {"question": "What weighs more: a ton of feathers or a ton of bricks?", "answer": "They weigh the same", "answer_note": "Both are exactly one ton — the material doesn't matter.", "category": "logic", "difficulty": "easy", "hook": "Classic trick!"},
    {"question": "Before Mt. Everest was discovered, what was the tallest mountain on Earth?", "answer": "Mt. Everest", "answer_note": "It was still the tallest — it just hadn't been discovered yet!", "category": "logic", "difficulty": "easy", "hook": "It always existed!"},
    {"question": "A rooster lays an egg on the peak of a roof. Which way does it roll?", "answer": "It doesn't — roosters don't lay eggs.", "answer_note": "Only hens lay eggs!", "category": "logic", "difficulty": "easy", "hook": "Roosters can't lay eggs!"},
    {"question": "If you have a match and enter a room with a candle, an oil lamp, and a fireplace, which do you light first?", "answer": "The match", "answer_note": "You have to light the match before anything else!", "category": "logic", "difficulty": "easy", "hook": "Light the match first!"},
    {"question": "Two fathers and two sons go fishing. They catch exactly 3 fish, one each. How?", "answer": "There are only 3 people: grandfather, father, and son", "answer_note": "The father is both a father and a son.", "category": "logic", "difficulty": "medium", "hook": "Three generations!"},
    {"question": "I have cities but no houses. I have mountains but no trees. I have water but no fish. What am I?", "answer": "A map", "answer_note": "Maps represent places without having the actual things.", "category": "logic", "difficulty": "medium", "hook": "Think representation!"},
    # COMMON KNOWLEDGE MATHS
    {"question": "What is 15% of 200?", "answer": "30", "answer_note": "10% of 200 = 20. 5% = 10. Total = 30.", "category": "common_knowledge", "difficulty": "easy", "hook": "Percentage basics!"},
    {"question": "What is the square root of 144?", "answer": "12", "answer_note": "12 x 12 = 144.", "category": "common_knowledge", "difficulty": "easy", "hook": "Perfect square!"},
    {"question": "What is 1/3 expressed as a decimal?", "answer": "0.333... (recurring)", "answer_note": "One third is a repeating decimal: 0.3333...", "category": "common_knowledge", "difficulty": "easy", "hook": "Recurring decimals!"},
    {"question": "How many degrees are in a right angle?", "answer": "90", "answer_note": "A right angle is exactly 90 degrees, formed by two perpendicular lines.", "category": "common_knowledge", "difficulty": "easy", "hook": "Corner geometry!"},
    {"question": "What is the perimeter of a square with sides of 7cm?", "answer": "28cm", "answer_note": "Perimeter = 4 x side = 4 x 7 = 28cm.", "category": "common_knowledge", "difficulty": "easy", "hook": "All sides equal!"},
    {"question": "What is 2^10?", "answer": "1024", "answer_note": "2^10 = 1024. This is why computer memory comes in multiples of 1024!", "category": "common_knowledge", "difficulty": "medium", "hook": "Computer science!"},
    {"question": "What is the area of a circle with radius 5? (use π ≈ 3.14)", "answer": "78.5", "answer_note": "Area = πr² = 3.14 x 25 = 78.5.", "category": "common_knowledge", "difficulty": "medium", "hook": "Circle area formula!"},
    {"question": "A triangle has angles of 45° and 75°. What is the third angle?", "answer": "60°", "answer_note": "Angles in a triangle sum to 180°. 180 - 45 - 75 = 60°.", "category": "common_knowledge", "difficulty": "easy", "hook": "Triangles sum to 180!"},
    {"question": "What is the next prime number after 17?", "answer": "19", "answer_note": "18 is divisible by 2, 3, 6, 9. 19 is only divisible by 1 and itself.", "category": "common_knowledge", "difficulty": "easy", "hook": "Find the prime!"},
    {"question": "What is 25% of 80?", "answer": "20", "answer_note": "25% = 1/4. A quarter of 80 is 20.", "category": "common_knowledge", "difficulty": "easy", "hook": "Quarter of 80!"},
    {"question": "How many edges does a cube have?", "answer": "12", "answer_note": "A cube has 6 faces, 8 vertices, and 12 edges.", "category": "common_knowledge", "difficulty": "easy", "hook": "Count the edges!"},
    {"question": "If a shirt costs $24 after a 20% discount, what was the original price?", "answer": "$30", "answer_note": "$24 = 80% of original. Original = 24 / 0.8 = $30.", "category": "common_knowledge", "difficulty": "medium", "hook": "Reverse percentage!"},
    {"question": "What is the LCM of 4 and 6?", "answer": "12", "answer_note": "Multiples of 4: 4, 8, 12... Multiples of 6: 6, 12... Lowest common: 12.", "category": "common_knowledge", "difficulty": "medium", "hook": "Lowest common multiple!"},
    {"question": "A car travels 240km in 4 hours. What is its average speed?", "answer": "60 km/h", "answer_note": "Speed = Distance / Time = 240 / 4 = 60 km/h.", "category": "common_knowledge", "difficulty": "easy", "hook": "Speed formula!"},
    {"question": "What is the sum of interior angles in a pentagon?", "answer": "540°", "answer_note": "Formula: (n-2) x 180 = (5-2) x 180 = 540°.", "category": "common_knowledge", "difficulty": "medium", "hook": "Pentagon angles!"},
    {"question": "What is 40% of 75?", "answer": "30", "answer_note": "40% of 75 = 0.4 x 75 = 30.", "category": "common_knowledge", "difficulty": "easy", "hook": "Percentage practice!"},
    {"question": "How many faces does a triangular prism have?", "answer": "5", "answer_note": "A triangular prism has 2 triangular faces and 3 rectangular faces = 5 total.", "category": "common_knowledge", "difficulty": "medium", "hook": "3D shapes!"},
    {"question": "What is -3 x -7?", "answer": "21", "answer_note": "Negative times negative = positive. 3 x 7 = 21.", "category": "common_knowledge", "difficulty": "easy", "hook": "Negative rules!"},
    {"question": "What is the mode of: 3, 5, 3, 7, 9, 3, 5?", "answer": "3", "answer_note": "Mode is the most frequent value. 3 appears 3 times.", "category": "common_knowledge", "difficulty": "easy", "hook": "Most common value!"},
]

for i, item in enumerate(new_items):
    item["id"] = f"mc_{next_n + i:04d}"

result = existing + new_items
json.dump(result, open(F, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"mathchallenge: {len(existing)} -> {len(result)} (+{len(new_items)})")
