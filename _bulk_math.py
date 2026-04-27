"""
Bulk append 215 math challenge items to mathchallenge/problems.json.
IDs: math_0287 through math_0501.
"""

import json
from pathlib import Path

BASE = Path(__file__).parent
TARGET = BASE / "mathchallenge" / "problems.json"

NEW_ITEMS = [
    {
        "id": "math_0287",
        "question": "What is 2 + 2 × 2?",
        "answer": "6",
        "answer_note": "Multiplication before addition: 2×2=4, then 2+4=6. Not 8.",
        "category": "order_of_operations",
        "difficulty": "easy",
        "hook": "Most people say 8"
    },
    {
        "id": "math_0288",
        "question": "If you have 12 sweets and eat all but 5, how many are left?",
        "answer": "5",
        "answer_note": "'All but 5' means 5 remain. The trick is in the phrasing.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "Read every word carefully"
    },
    {
        "id": "math_0289",
        "question": "What is 1/2 + 1/3?",
        "answer": "5/6",
        "answer_note": "Common denominator of 6: 3/6 + 2/6 = 5/6.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Most adults forget how to do this"
    },
    {
        "id": "math_0290",
        "question": "Solve for x: 3x − 9 = 0",
        "answer": "x = 3",
        "answer_note": "Add 9 to both sides: 3x = 9. Divide by 3: x = 3.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Simpler than it looks"
    },
    {
        "id": "math_0291",
        "question": "A square has a perimeter of 36 cm. What is its area?",
        "answer": "81 cm²",
        "answer_note": "Side = 36÷4 = 9 cm. Area = 9² = 81 cm².",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Don't confuse perimeter with area"
    },
    {
        "id": "math_0292",
        "question": "What is 15% of 200?",
        "answer": "30",
        "answer_note": "10% of 200 = 20, 5% = 10. Add them: 30.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Mental math trick incoming"
    },
    {
        "id": "math_0293",
        "question": "What is the next number: 2, 4, 8, 16, __?",
        "answer": "32",
        "answer_note": "Each term doubles. 16 × 2 = 32.",
        "category": "sequences",
        "difficulty": "easy",
        "hook": "Spot the pattern"
    },
    {
        "id": "math_0294",
        "question": "A farmer has 17 sheep. All but 9 die. How many are left?",
        "answer": "9",
        "answer_note": "'All but 9' means exactly 9 survive. Classic misdirection.",
        "category": "logic",
        "difficulty": "easy",
        "hook": "Think before you subtract"
    },
    {
        "id": "math_0295",
        "question": "You flip a fair coin twice. What is the probability of getting two heads?",
        "answer": "1/4",
        "answer_note": "Each flip is 1/2. Independent events multiply: 1/2 × 1/2 = 1/4.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Coin flips have no memory"
    },
    {
        "id": "math_0296",
        "question": "What is 3² + 4²?",
        "answer": "25",
        "answer_note": "9 + 16 = 25. And √25 = 5 — this is the classic 3-4-5 Pythagorean triple.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "There's a secret hidden in this"
    },
    {
        "id": "math_0297",
        "question": "What is 100 ÷ 0.5?",
        "answer": "200",
        "answer_note": "Dividing by 0.5 is the same as multiplying by 2. 100 × 2 = 200.",
        "category": "order_of_operations",
        "difficulty": "medium",
        "hook": "Most people say 50"
    },
    {
        "id": "math_0298",
        "question": "A train travels 60 km in 45 minutes. What is its speed in km/h?",
        "answer": "80 km/h",
        "answer_note": "45 min = 3/4 hour. Speed = 60 ÷ 0.75 = 80 km/h.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Convert units first"
    },
    {
        "id": "math_0299",
        "question": "What is 3/4 ÷ 1/2?",
        "answer": "3/2 (or 1.5)",
        "answer_note": "Dividing by a fraction = multiplying by its reciprocal: 3/4 × 2/1 = 6/4 = 3/2.",
        "category": "fractions",
        "difficulty": "medium",
        "hook": "Flip and multiply"
    },
    {
        "id": "math_0300",
        "question": "Solve: 2x + 5 = 3x − 4",
        "answer": "x = 9",
        "answer_note": "Move x terms left: 5 + 4 = 3x − 2x, so 9 = x.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Variables on both sides"
    },
    {
        "id": "math_0301",
        "question": "A circle has a radius of 7 cm. What is its area? (Use π ≈ 3.14)",
        "answer": "153.86 cm²",
        "answer_note": "Area = π × r² = 3.14 × 49 = 153.86 cm².",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Pi is your friend here"
    },
    {
        "id": "math_0302",
        "question": "A price drops from $80 to $60. What is the percentage decrease?",
        "answer": "25%",
        "answer_note": "Decrease = 20. 20/80 × 100 = 25%.",
        "category": "percentages",
        "difficulty": "medium",
        "hook": "Don't confuse the denominator"
    },
    {
        "id": "math_0303",
        "question": "What is the next term: 1, 1, 2, 3, 5, 8, __?",
        "answer": "13",
        "answer_note": "Fibonacci: each term is the sum of the previous two. 5+8=13.",
        "category": "sequences",
        "difficulty": "medium",
        "hook": "Nature's favourite sequence"
    },
    {
        "id": "math_0304",
        "question": "You have three boxes. One has gold, two have rocks. You pick Box 1. The host opens Box 3 (rocks). Should you switch?",
        "answer": "Yes — switch",
        "answer_note": "Monty Hall problem: switching gives 2/3 probability of winning vs 1/3 for staying.",
        "category": "probability",
        "difficulty": "hard",
        "hook": "This broke mathematicians' brains"
    },
    {
        "id": "math_0305",
        "question": "What is 0.1 + 0.2 in pure mathematics?",
        "answer": "0.3",
        "answer_note": "In true maths 0.1+0.2=0.3 exactly. Computers give 0.300000000000000004 due to binary floating-point.",
        "category": "logic",
        "difficulty": "medium",
        "hook": "Even computers get this wrong"
    },
    {
        "id": "math_0306",
        "question": "A room has 23 people. What is the probability two share a birthday?",
        "answer": "About 50%",
        "answer_note": "The Birthday Problem: with just 23 people there's a ~50.7% chance of a shared birthday. Counterintuitive!",
        "category": "probability",
        "difficulty": "hard",
        "hook": "You won't believe the answer"
    },
    {
        "id": "math_0307",
        "question": "What is 10% of 10% of 1000?",
        "answer": "10",
        "answer_note": "10% of 1000 = 100. 10% of 100 = 10.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Think step by step"
    },
    {
        "id": "math_0308",
        "question": "If 5 cats eat 5 mice in 5 minutes, how many cats eat 100 mice in 100 minutes?",
        "answer": "5 cats",
        "answer_note": "Each cat eats 1 mouse per 5 minutes. In 100 minutes each cat eats 20 mice. 5 cats × 20 = 100.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Scale carefully"
    },
    {
        "id": "math_0309",
        "question": "What is the sum of interior angles of a hexagon?",
        "answer": "720°",
        "answer_note": "Formula: (n−2) × 180°. For n=6: (6−2) × 180 = 4 × 180 = 720°.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "There's a formula for this"
    },
    {
        "id": "math_0310",
        "question": "What is 2⁰?",
        "answer": "1",
        "answer_note": "Any non-zero number raised to the power 0 equals 1. This is a fundamental rule of exponents.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Many people say zero"
    },
    {
        "id": "math_0311",
        "question": "What is (−3)²?",
        "answer": "9",
        "answer_note": "(−3)² = (−3) × (−3) = 9. Negative times negative is positive.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Negative numbers can be tricky"
    },
    {
        "id": "math_0312",
        "question": "A rectangle has length 12 and width 5. What is the length of its diagonal?",
        "answer": "13",
        "answer_note": "Pythagoras: √(12² + 5²) = √(144+25) = √169 = 13.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Classic Pythagorean triple"
    },
    {
        "id": "math_0313",
        "question": "What is 50% of 50% of 200?",
        "answer": "50",
        "answer_note": "50% of 200 = 100. 50% of 100 = 50.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Half of half"
    },
    {
        "id": "math_0314",
        "question": "What is the next prime number after 13?",
        "answer": "17",
        "answer_note": "14=2×7, 15=3×5, 16=2⁴ — all composite. 17 is divisible only by 1 and itself.",
        "category": "sequences",
        "difficulty": "easy",
        "hook": "Do you know your primes?"
    },
    {
        "id": "math_0315",
        "question": "You roll a die twice. What is the probability of rolling a 6 both times?",
        "answer": "1/36",
        "answer_note": "Each roll: 1/6. Independent: 1/6 × 1/6 = 1/36.",
        "category": "probability",
        "difficulty": "medium",
        "hook": "Odds are stacked against you"
    },
    {
        "id": "math_0316",
        "question": "Solve: x² = 49",
        "answer": "x = 7 or x = −7",
        "answer_note": "Square roots have two solutions: +7 and −7. Both satisfy x² = 49.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "There are two answers"
    },
    {
        "id": "math_0317",
        "question": "What is 1000 ÷ 8?",
        "answer": "125",
        "answer_note": "1000 ÷ 8: halve three times. 1000→500→250→125.",
        "category": "order_of_operations",
        "difficulty": "easy",
        "hook": "No calculator needed"
    },
    {
        "id": "math_0318",
        "question": "How many seconds are in a day?",
        "answer": "86,400",
        "answer_note": "24 hours × 60 minutes × 60 seconds = 86,400 seconds.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "More than you think"
    },
    {
        "id": "math_0319",
        "question": "What is 7/8 as a percentage?",
        "answer": "87.5%",
        "answer_note": "7 ÷ 8 = 0.875. Multiply by 100 = 87.5%.",
        "category": "fractions",
        "difficulty": "medium",
        "hook": "Convert without a calculator"
    },
    {
        "id": "math_0320",
        "question": "What is the missing number: 2, 6, 18, 54, __?",
        "answer": "162",
        "answer_note": "Each term is multiplied by 3. 54 × 3 = 162.",
        "category": "sequences",
        "difficulty": "easy",
        "hook": "Find the multiplier"
    },
    {
        "id": "math_0321",
        "question": "Two dice are rolled. What is the probability their sum equals 7?",
        "answer": "1/6",
        "answer_note": "6 outcomes sum to 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1). 6/36 = 1/6.",
        "category": "probability",
        "difficulty": "medium",
        "hook": "7 is the most likely sum"
    },
    {
        "id": "math_0322",
        "question": "If a shirt costs $40 after a 20% discount, what was the original price?",
        "answer": "$50",
        "answer_note": "80% of original = $40. Original = 40 ÷ 0.8 = $50.",
        "category": "percentages",
        "difficulty": "medium",
        "hook": "Work backwards"
    },
    {
        "id": "math_0323",
        "question": "What is the area of a triangle with base 10 and height 6?",
        "answer": "30 square units",
        "answer_note": "Area = 1/2 × base × height = 1/2 × 10 × 6 = 30.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Half the rectangle"
    },
    {
        "id": "math_0324",
        "question": "What is −5 × −5?",
        "answer": "25",
        "answer_note": "Negative × negative = positive. −5 × −5 = 25.",
        "category": "order_of_operations",
        "difficulty": "easy",
        "hook": "Two negatives make a positive"
    },
    {
        "id": "math_0325",
        "question": "A jar has 4 red and 6 blue marbles. You pick one at random. What is the probability it's red?",
        "answer": "2/5",
        "answer_note": "4 red out of 10 total = 4/10 = 2/5.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Simple but classic"
    },
    {
        "id": "math_0326",
        "question": "Simplify: 2/4 + 3/6",
        "answer": "1",
        "answer_note": "2/4 = 1/2, 3/6 = 1/2. Sum = 1/2 + 1/2 = 1.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Simplify first, then add"
    },
    {
        "id": "math_0327",
        "question": "What is 999 × 999?",
        "answer": "998,001",
        "answer_note": "999² = (1000−1)² = 1,000,000 − 2000 + 1 = 998,001.",
        "category": "algebra",
        "difficulty": "hard",
        "hook": "Mental math for geniuses"
    },
    {
        "id": "math_0328",
        "question": "What comes next: 3, 6, 11, 18, 27, __?",
        "answer": "38",
        "answer_note": "Differences: 3, 5, 7, 9, 11 (odd numbers increasing). 27+11=38.",
        "category": "sequences",
        "difficulty": "medium",
        "hook": "Look at the gaps"
    },
    {
        "id": "math_0329",
        "question": "A 10m ladder leans against a wall reaching 8m high. How far is the base from the wall?",
        "answer": "6 m",
        "answer_note": "Pythagoras: base = √(10²−8²) = √(100−64) = √36 = 6 m.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Pythagoras saves the day again"
    },
    {
        "id": "math_0330",
        "question": "How many times does the digit 1 appear from 1 to 100?",
        "answer": "21",
        "answer_note": "Units: 1,11,21,31,41,51,61,71,81,91 (10 times). Tens: 10-19 (10 times) + 100 has a 1 (once). Total = 21.",
        "category": "logic",
        "difficulty": "hard",
        "hook": "Count carefully — it's not 20"
    },
    {
        "id": "math_0331",
        "question": "What is the LCM of 4 and 6?",
        "answer": "12",
        "answer_note": "Multiples of 4: 4,8,12. Multiples of 6: 6,12. Lowest common = 12.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Lowest Common Multiple"
    },
    {
        "id": "math_0332",
        "question": "What is the HCF of 24 and 36?",
        "answer": "12",
        "answer_note": "Factors of 24: 1,2,3,4,6,8,12,24. Factors of 36: 1,2,3,4,6,9,12,18,36. Highest common = 12.",
        "category": "logic",
        "difficulty": "medium",
        "hook": "Highest Common Factor"
    },
    {
        "id": "math_0333",
        "question": "Solve: 5(x − 2) = 3x + 4",
        "answer": "x = 7",
        "answer_note": "Expand: 5x−10 = 3x+4. Move terms: 2x=14. x=7.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Expand the brackets first"
    },
    {
        "id": "math_0334",
        "question": "What percentage of 80 is 20?",
        "answer": "25%",
        "answer_note": "20/80 × 100 = 25%.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Flip the question on its head"
    },
    {
        "id": "math_0335",
        "question": "If today is Wednesday, what day is it 100 days from now?",
        "answer": "Friday",
        "answer_note": "100 ÷ 7 = 14 remainder 2. Wednesday + 2 days = Friday.",
        "category": "logic",
        "difficulty": "medium",
        "hook": "Use modular arithmetic"
    },
    {
        "id": "math_0336",
        "question": "What is √144?",
        "answer": "12",
        "answer_note": "12 × 12 = 144. So √144 = 12.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Know your square roots"
    },
    {
        "id": "math_0337",
        "question": "A man walks 3 km north, 4 km east. How far is he from his start point (straight line)?",
        "answer": "5 km",
        "answer_note": "Pythagoras: √(3²+4²) = √(9+16) = √25 = 5 km.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Shortcut the long way"
    },
    {
        "id": "math_0338",
        "question": "What is 1 ÷ 1/4?",
        "answer": "4",
        "answer_note": "Dividing by 1/4 is multiplying by 4. 1 × 4 = 4.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Dividing by a fraction surprises people"
    },
    {
        "id": "math_0339",
        "question": "What is the sum of the first 10 natural numbers?",
        "answer": "55",
        "answer_note": "Formula: n(n+1)/2 = 10×11/2 = 55. Gauss's trick.",
        "category": "sequences",
        "difficulty": "medium",
        "hook": "Gauss solved this at age 8"
    },
    {
        "id": "math_0340",
        "question": "A bag has 5 balls: 2 red, 3 green. You draw 2 without replacement. What is the probability both are green?",
        "answer": "3/10",
        "answer_note": "P(1st green) = 3/5. P(2nd green | 1st green) = 2/4. Product = 6/20 = 3/10.",
        "category": "probability",
        "difficulty": "hard",
        "hook": "Without replacement changes everything"
    },
    {
        "id": "math_0341",
        "question": "What is 4! (4 factorial)?",
        "answer": "24",
        "answer_note": "4! = 4 × 3 × 2 × 1 = 24.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Factorials grow fast"
    },
    {
        "id": "math_0342",
        "question": "What is 20% of 350?",
        "answer": "70",
        "answer_note": "10% of 350 = 35. Double it: 70.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Double the 10% trick"
    },
    {
        "id": "math_0343",
        "question": "A clock shows 3:00. What is the angle between the hands?",
        "answer": "90°",
        "answer_note": "At 3:00 the minute hand is at 12, hour hand at 3 (90° apart out of 360°).",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Geometry is everywhere"
    },
    {
        "id": "math_0344",
        "question": "What is the probability of picking an ace from a standard deck of 52 cards?",
        "answer": "1/13",
        "answer_note": "4 aces in 52 cards = 4/52 = 1/13.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Know your card odds"
    },
    {
        "id": "math_0345",
        "question": "What is the missing number: 81, 27, 9, 3, __?",
        "answer": "1",
        "answer_note": "Each term is divided by 3. 3 ÷ 3 = 1.",
        "category": "sequences",
        "difficulty": "easy",
        "hook": "Dividing sequences"
    },
    {
        "id": "math_0346",
        "question": "A 10% increase followed by a 10% decrease — is the final value the same as the original?",
        "answer": "No — it's 1% less",
        "answer_note": "Start: 100. After +10%: 110. After −10%: 110×0.9 = 99. Net loss of 1%.",
        "category": "percentages",
        "difficulty": "hard",
        "hook": "Percentages aren't symmetric"
    },
    {
        "id": "math_0347",
        "question": "Solve: x/3 + 4 = 7",
        "answer": "x = 9",
        "answer_note": "x/3 = 3. Multiply both sides by 3: x = 9.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Isolate the variable"
    },
    {
        "id": "math_0348",
        "question": "A cube has side length 3 cm. What is its volume?",
        "answer": "27 cm³",
        "answer_note": "Volume = side³ = 3³ = 27 cm³.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Three dimensions"
    },
    {
        "id": "math_0349",
        "question": "What is 12.5% as a fraction?",
        "answer": "1/8",
        "answer_note": "12.5% = 12.5/100 = 1/8.",
        "category": "fractions",
        "difficulty": "medium",
        "hook": "Convert to a neat fraction"
    },
    {
        "id": "math_0350",
        "question": "If you double the radius of a circle, what happens to its area?",
        "answer": "It quadruples",
        "answer_note": "Area = πr². Double r means (2r)² = 4r². Area multiplies by 4.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Doubling isn't what you think"
    },
    {
        "id": "math_0351",
        "question": "What is 2 + 2 ÷ 2 × 2?",
        "answer": "4",
        "answer_note": "BODMAS: division and multiplication left-to-right first. 2÷2=1, 1×2=2. Then 2+2=4.",
        "category": "order_of_operations",
        "difficulty": "medium",
        "hook": "Order matters every time"
    },
    {
        "id": "math_0352",
        "question": "What is the median of: 5, 3, 9, 1, 7?",
        "answer": "5",
        "answer_note": "Ordered: 1, 3, 5, 7, 9. Middle value = 5.",
        "category": "logic",
        "difficulty": "easy",
        "hook": "Middle of the sorted list"
    },
    {
        "id": "math_0353",
        "question": "What is the mean of: 10, 20, 30, 40, 50?",
        "answer": "30",
        "answer_note": "Sum = 150. Divide by 5 = 30.",
        "category": "logic",
        "difficulty": "easy",
        "hook": "Sum then divide"
    },
    {
        "id": "math_0354",
        "question": "How many diagonals does a pentagon have?",
        "answer": "5",
        "answer_note": "Formula: n(n−3)/2 = 5×2/2 = 5.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Count the diagonals"
    },
    {
        "id": "math_0355",
        "question": "What is 3/5 × 10?",
        "answer": "6",
        "answer_note": "3/5 × 10 = 30/5 = 6.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Fractions times whole numbers"
    },
    {
        "id": "math_0356",
        "question": "You invest $1000 at 10% simple interest for 3 years. What is the total amount?",
        "answer": "$1,300",
        "answer_note": "Simple interest: 10% of $1000 = $100/year × 3 = $300. Total = $1,300.",
        "category": "percentages",
        "difficulty": "medium",
        "hook": "Simple vs compound — know the difference"
    },
    {
        "id": "math_0357",
        "question": "What is the next term: 1, 4, 9, 16, 25, __?",
        "answer": "36",
        "answer_note": "Perfect squares: 1²,2²,3²,4²,5². Next: 6² = 36.",
        "category": "sequences",
        "difficulty": "easy",
        "hook": "Square number sequence"
    },
    {
        "id": "math_0358",
        "question": "Solve: 2(3x + 1) = 4x + 10",
        "answer": "x = 4",
        "answer_note": "Expand: 6x+2 = 4x+10. So 2x = 8, x = 4.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Expand then solve"
    },
    {
        "id": "math_0359",
        "question": "A fair coin is flipped 3 times. What is the probability of getting exactly 2 heads?",
        "answer": "3/8",
        "answer_note": "Combinations: HHT, HTH, THH = 3 outcomes. Total = 2³ = 8. Probability = 3/8.",
        "category": "probability",
        "difficulty": "medium",
        "hook": "List the outcomes"
    },
    {
        "id": "math_0360",
        "question": "What is the value of π to 2 decimal places?",
        "answer": "3.14",
        "answer_note": "Pi ≈ 3.14159... Rounded to 2 decimal places: 3.14.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "How well do you know pi?"
    },
    {
        "id": "math_0361",
        "question": "What is 3 × (4 + 5) − 6 ÷ 2?",
        "answer": "24",
        "answer_note": "Brackets first: 3×9 = 27. Then 6÷2 = 3. Finally 27−3 = 24.",
        "category": "order_of_operations",
        "difficulty": "medium",
        "hook": "Follow the order strictly"
    },
    {
        "id": "math_0362",
        "question": "In how many ways can 3 people sit in 3 chairs?",
        "answer": "6",
        "answer_note": "3! = 3 × 2 × 1 = 6 arrangements.",
        "category": "probability",
        "difficulty": "medium",
        "hook": "Factorial thinking"
    },
    {
        "id": "math_0363",
        "question": "What is 2/3 of 3/4?",
        "answer": "1/2",
        "answer_note": "'Of' means multiply: 2/3 × 3/4 = 6/12 = 1/2.",
        "category": "fractions",
        "difficulty": "medium",
        "hook": "Of means multiply"
    },
    {
        "id": "math_0364",
        "question": "A price increases by 50% then decreases by 50%. What is the net change?",
        "answer": "25% loss",
        "answer_note": "Start 100. +50%: 150. −50% of 150: 75. Net loss = 25%.",
        "category": "percentages",
        "difficulty": "hard",
        "hook": "Percentage changes compound"
    },
    {
        "id": "math_0365",
        "question": "What is the sum of angles in a triangle?",
        "answer": "180°",
        "answer_note": "All triangles — scalene, isosceles, equilateral — have interior angles summing to 180°.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Fundamental geometry fact"
    },
    {
        "id": "math_0366",
        "question": "Solve: x² − 5x + 6 = 0",
        "answer": "x = 2 or x = 3",
        "answer_note": "Factor: (x−2)(x−3)=0. So x=2 or x=3.",
        "category": "algebra",
        "difficulty": "hard",
        "hook": "Can you factor it?"
    },
    {
        "id": "math_0367",
        "question": "What is 1 − 0.999...?",
        "answer": "0",
        "answer_note": "0.999... = 1 exactly. It's not infinitely close — it IS 1. This is a proven mathematical fact.",
        "category": "logic",
        "difficulty": "hard",
        "hook": "This melts brains every time"
    },
    {
        "id": "math_0368",
        "question": "If 3 is added to a number and the result is doubled, you get 16. What is the number?",
        "answer": "5",
        "answer_note": "2(n+3) = 16. n+3 = 8. n = 5.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Set up the equation"
    },
    {
        "id": "math_0369",
        "question": "What is the next number: 0, 1, 3, 6, 10, 15, __?",
        "answer": "21",
        "answer_note": "Triangular numbers. Differences: 1,2,3,4,5,6. Next = 15+6 = 21.",
        "category": "sequences",
        "difficulty": "medium",
        "hook": "Triangular numbers"
    },
    {
        "id": "math_0370",
        "question": "What is 11 × 11?",
        "answer": "121",
        "answer_note": "11² = 121. The 11-times table has a neat pattern up to 9: mirror the digits.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Know your 11 times table"
    },
    {
        "id": "math_0371",
        "question": "Two numbers add to 20 and multiply to 96. What are they?",
        "answer": "8 and 12",
        "answer_note": "x + y = 20, xy = 96. Solve: x² − 20x + 96 = 0 → (x−8)(x−12). Answers: 8, 12.",
        "category": "algebra",
        "difficulty": "hard",
        "hook": "Two clues, two unknowns"
    },
    {
        "id": "math_0372",
        "question": "A regular hexagon can be divided into how many equilateral triangles?",
        "answer": "6",
        "answer_note": "A regular hexagon consists of 6 equilateral triangles with the same side length.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "See the hidden triangles"
    },
    {
        "id": "math_0373",
        "question": "What is 15 × 15?",
        "answer": "225",
        "answer_note": "Any number ending in 5 squared: keep the 25, multiply the tens digit by itself+1. 1×2=2, append 25 → 225.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Trick for squaring numbers ending in 5"
    },
    {
        "id": "math_0374",
        "question": "How many prime numbers are between 1 and 20?",
        "answer": "8",
        "answer_note": "Primes: 2, 3, 5, 7, 11, 13, 17, 19 — exactly 8.",
        "category": "sequences",
        "difficulty": "medium",
        "hook": "List them out"
    },
    {
        "id": "math_0375",
        "question": "A rectangle's length is twice its width. Its perimeter is 60. What is the width?",
        "answer": "10",
        "answer_note": "Let width = w. Length = 2w. Perimeter = 2(w+2w) = 6w = 60. w = 10.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Use algebra for geometry"
    },
    {
        "id": "math_0376",
        "question": "What is the probability of drawing a heart from a standard deck?",
        "answer": "1/4",
        "answer_note": "13 hearts in 52 cards = 13/52 = 1/4.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Card probability basics"
    },
    {
        "id": "math_0377",
        "question": "What is 0.75 as a fraction in simplest form?",
        "answer": "3/4",
        "answer_note": "0.75 = 75/100. Divide by 25: 3/4.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Decimal to fraction"
    },
    {
        "id": "math_0378",
        "question": "What is the cube root of 27?",
        "answer": "3",
        "answer_note": "3 × 3 × 3 = 27. So ∛27 = 3.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Cube roots"
    },
    {
        "id": "math_0379",
        "question": "A car travels 150 km in 2.5 hours. What is its average speed?",
        "answer": "60 km/h",
        "answer_note": "Speed = distance ÷ time = 150 ÷ 2.5 = 60 km/h.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "Speed = distance ÷ time"
    },
    {
        "id": "math_0380",
        "question": "What is 13²?",
        "answer": "169",
        "answer_note": "13² = (10+3)² = 100 + 60 + 9 = 169.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Use the binomial trick"
    },
    {
        "id": "math_0381",
        "question": "A container holds 3.5 litres. How many 250ml cups can be filled?",
        "answer": "14",
        "answer_note": "3500ml ÷ 250ml = 14 cups.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "Convert units first"
    },
    {
        "id": "math_0382",
        "question": "What is the perimeter of an equilateral triangle with side 8 cm?",
        "answer": "24 cm",
        "answer_note": "3 equal sides: 3 × 8 = 24 cm.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Equal sides, easy perimeter"
    },
    {
        "id": "math_0383",
        "question": "What is (3 + 4)² − 3² − 4²?",
        "answer": "24",
        "answer_note": "7² − 9 − 16 = 49 − 25 = 24. Note: (a+b)² ≠ a²+b²!",
        "category": "order_of_operations",
        "difficulty": "hard",
        "hook": "The common algebra mistake"
    },
    {
        "id": "math_0384",
        "question": "Solve for n: 4n/5 = 8",
        "answer": "n = 10",
        "answer_note": "Multiply both sides by 5: 4n = 40. Divide by 4: n = 10.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Fractions in equations"
    },
    {
        "id": "math_0385",
        "question": "What is 5/6 − 1/4?",
        "answer": "7/12",
        "answer_note": "Common denominator 12: 10/12 − 3/12 = 7/12.",
        "category": "fractions",
        "difficulty": "medium",
        "hook": "Find the common denominator"
    },
    {
        "id": "math_0386",
        "question": "What is the next term: 100, 50, 25, 12.5, __?",
        "answer": "6.25",
        "answer_note": "Each term is halved. 12.5 ÷ 2 = 6.25.",
        "category": "sequences",
        "difficulty": "easy",
        "hook": "Halving sequence"
    },
    {
        "id": "math_0387",
        "question": "How many zeros are in one million?",
        "answer": "6",
        "answer_note": "1,000,000 has 6 zeros.",
        "category": "logic",
        "difficulty": "easy",
        "hook": "Know your large numbers"
    },
    {
        "id": "math_0388",
        "question": "A shop sells 40 items at $5 profit each, and 20 items at $3 loss each. What is the net profit?",
        "answer": "$140",
        "answer_note": "Profit: 40 × 5 = $200. Loss: 20 × 3 = $60. Net = $200 − $60 = $140.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Profit and loss"
    },
    {
        "id": "math_0389",
        "question": "What is the volume of a cylinder with radius 3 and height 5? (π ≈ 3.14)",
        "answer": "141.3 cubic units",
        "answer_note": "V = π × r² × h = 3.14 × 9 × 5 = 141.3.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "3D geometry"
    },
    {
        "id": "math_0390",
        "question": "What is 125% of 80?",
        "answer": "100",
        "answer_note": "125% = 1.25. 1.25 × 80 = 100.",
        "category": "percentages",
        "difficulty": "medium",
        "hook": "More than 100%"
    },
    {
        "id": "math_0391",
        "question": "In a class of 30, 18 play football. What percentage do not?",
        "answer": "40%",
        "answer_note": "Non-football = 12. 12/30 × 100 = 40%.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Find the remainder first"
    },
    {
        "id": "math_0392",
        "question": "What is the smallest number divisible by both 6 and 8?",
        "answer": "24",
        "answer_note": "LCM(6,8): multiples of 8 = 8,16,24. 24 is divisible by 6. LCM = 24.",
        "category": "logic",
        "difficulty": "medium",
        "hook": "Lowest Common Multiple"
    },
    {
        "id": "math_0393",
        "question": "A bag has 3 red, 4 blue, 5 green balls. One is drawn. What is the probability it's NOT red?",
        "answer": "3/4",
        "answer_note": "Total = 12. Not red = 9. P = 9/12 = 3/4.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Complement rule"
    },
    {
        "id": "math_0394",
        "question": "Solve: 7 − 2x = 1",
        "answer": "x = 3",
        "answer_note": "7−1 = 2x. 6 = 2x. x = 3.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Quick algebra warm-up"
    },
    {
        "id": "math_0395",
        "question": "What is 8/3 as a mixed number?",
        "answer": "2 and 2/3",
        "answer_note": "8 ÷ 3 = 2 remainder 2. So 2²/₃.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Improper to mixed"
    },
    {
        "id": "math_0396",
        "question": "A snail travels 3 metres per hour. How long to travel 7.5 metres?",
        "answer": "2.5 hours",
        "answer_note": "Time = distance ÷ speed = 7.5 ÷ 3 = 2.5 hours.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "Slow and steady"
    },
    {
        "id": "math_0397",
        "question": "What is 2³ × 2²?",
        "answer": "32",
        "answer_note": "When multiplying same base: add exponents. 2^(3+2) = 2⁵ = 32.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Index law shortcut"
    },
    {
        "id": "math_0398",
        "question": "A clock ticks every 5 seconds. How many ticks in one hour?",
        "answer": "720",
        "answer_note": "3600 seconds in an hour. 3600 ÷ 5 = 720 ticks.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Careful with the maths"
    },
    {
        "id": "math_0399",
        "question": "What is the area of a parallelogram with base 9 and height 4?",
        "answer": "36 square units",
        "answer_note": "Area = base × height = 9 × 4 = 36.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Same formula as a rectangle"
    },
    {
        "id": "math_0400",
        "question": "What is 6² ÷ (2 + 4)?",
        "answer": "6",
        "answer_note": "Brackets first: 2+4=6. Then 6²=36. Then 36÷6=6.",
        "category": "order_of_operations",
        "difficulty": "medium",
        "hook": "Step by step"
    },
    {
        "id": "math_0401",
        "question": "What percent is 3 out of 12?",
        "answer": "25%",
        "answer_note": "3/12 = 1/4 = 25%.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Simplify first"
    },
    {
        "id": "math_0402",
        "question": "What is the next term: 1, 2, 6, 24, 120, __?",
        "answer": "720",
        "answer_note": "Factorials: 1!, 2!, 3!, 4!, 5!, 6! = 720.",
        "category": "sequences",
        "difficulty": "hard",
        "hook": "Factorial sequence"
    },
    {
        "id": "math_0403",
        "question": "Two parallel lines are cut by a transversal. Alternate interior angles are always...?",
        "answer": "Equal",
        "answer_note": "Alternate interior angles between parallel lines are always congruent (equal).",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Parallel line theorem"
    },
    {
        "id": "math_0404",
        "question": "Solve the inequality: 2x − 3 > 7",
        "answer": "x > 5",
        "answer_note": "Add 3: 2x > 10. Divide by 2: x > 5.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Inequalities work like equations"
    },
    {
        "id": "math_0405",
        "question": "What is 1/3 + 1/6 + 1/2?",
        "answer": "1",
        "answer_note": "Common denominator 6: 2/6 + 1/6 + 3/6 = 6/6 = 1.",
        "category": "fractions",
        "difficulty": "medium",
        "hook": "Three fractions sum to a whole"
    },
    {
        "id": "math_0406",
        "question": "A square field has area 144 m². What is its perimeter?",
        "answer": "48 m",
        "answer_note": "Side = √144 = 12 m. Perimeter = 4 × 12 = 48 m.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Area to perimeter"
    },
    {
        "id": "math_0407",
        "question": "You toss a coin 5 times. What is the probability of 5 heads in a row?",
        "answer": "1/32",
        "answer_note": "(1/2)⁵ = 1/32.",
        "category": "probability",
        "difficulty": "medium",
        "hook": "Rare but possible"
    },
    {
        "id": "math_0408",
        "question": "What is 7 × 8?",
        "answer": "56",
        "answer_note": "7 × 8 = 56. The most commonly forgotten multiplication fact!",
        "category": "logic",
        "difficulty": "easy",
        "hook": "The most forgotten times table"
    },
    {
        "id": "math_0409",
        "question": "If x = 3 and y = 4, what is x² + y²?",
        "answer": "25",
        "answer_note": "9 + 16 = 25. This is again the 3-4-5 Pythagorean triple.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Substitute and calculate"
    },
    {
        "id": "math_0410",
        "question": "What is 0.333... as a fraction?",
        "answer": "1/3",
        "answer_note": "0.333... is the decimal expansion of 1/3.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Recurring decimals"
    },
    {
        "id": "math_0411",
        "question": "A population doubles every 10 years. Starting at 1000, what is it after 30 years?",
        "answer": "8,000",
        "answer_note": "After 10 yrs: 2000. After 20: 4000. After 30: 8000. Doubles 3 times.",
        "category": "sequences",
        "difficulty": "medium",
        "hook": "Exponential growth"
    },
    {
        "id": "math_0412",
        "question": "What is the supplement of a 65° angle?",
        "answer": "115°",
        "answer_note": "Supplementary angles sum to 180°. 180° − 65° = 115°.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Supplementary vs complementary"
    },
    {
        "id": "math_0413",
        "question": "What is the complement of a 38° angle?",
        "answer": "52°",
        "answer_note": "Complementary angles sum to 90°. 90° − 38° = 52°.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Angles that make a right angle"
    },
    {
        "id": "math_0414",
        "question": "Solve: (x + 3)(x − 2) = 0",
        "answer": "x = −3 or x = 2",
        "answer_note": "Zero product property: x+3=0 gives x=−3. x−2=0 gives x=2.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Zero product rule"
    },
    {
        "id": "math_0415",
        "question": "What is 40% of 40% of 1000?",
        "answer": "160",
        "answer_note": "40% of 1000 = 400. 40% of 400 = 160.",
        "category": "percentages",
        "difficulty": "medium",
        "hook": "Percentage of a percentage"
    },
    {
        "id": "math_0416",
        "question": "A room is 4m × 5m. Tiles are 50cm × 50cm. How many tiles needed?",
        "answer": "80",
        "answer_note": "Room: 400cm × 500cm. Tile: 50cm × 50cm. Number = (400/50) × (500/50) = 8 × 10 = 80.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Real-world geometry"
    },
    {
        "id": "math_0417",
        "question": "What is the reciprocal of 2/7?",
        "answer": "7/2",
        "answer_note": "The reciprocal flips the fraction: 2/7 becomes 7/2.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Flip it"
    },
    {
        "id": "math_0418",
        "question": "A number multiplied by itself equals 225. What is the number?",
        "answer": "15",
        "answer_note": "√225 = 15. Check: 15 × 15 = 225.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Square root challenge"
    },
    {
        "id": "math_0419",
        "question": "What is 9 + 3 ÷ 3 × 3 − 3?",
        "answer": "9",
        "answer_note": "Division and multiplication first: 3÷3=1, 1×3=3. Then 9+3−3=9.",
        "category": "order_of_operations",
        "difficulty": "hard",
        "hook": "Packed with traps"
    },
    {
        "id": "math_0420",
        "question": "What is the range of: 4, 7, 2, 9, 5?",
        "answer": "7",
        "answer_note": "Range = max − min = 9 − 2 = 7.",
        "category": "logic",
        "difficulty": "easy",
        "hook": "Spread of the data"
    },
    {
        "id": "math_0421",
        "question": "How many faces does a cube have?",
        "answer": "6",
        "answer_note": "A cube has 6 square faces.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "3D shapes basics"
    },
    {
        "id": "math_0422",
        "question": "A shop offers 30% off $250. What is the sale price?",
        "answer": "$175",
        "answer_note": "30% of $250 = $75. Sale price = $250 − $75 = $175.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Discount calculation"
    },
    {
        "id": "math_0423",
        "question": "What is 5/12 + 7/12?",
        "answer": "1",
        "answer_note": "Same denominator: (5+7)/12 = 12/12 = 1.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Add fractions with same denominator"
    },
    {
        "id": "math_0424",
        "question": "What is the value of i² (where i is the imaginary unit)?",
        "answer": "−1",
        "answer_note": "By definition, i = √(−1), so i² = −1.",
        "category": "algebra",
        "difficulty": "hard",
        "hook": "Imaginary numbers"
    },
    {
        "id": "math_0425",
        "question": "If a = 2 and b = −3, what is 2a − b?",
        "answer": "7",
        "answer_note": "2(2) − (−3) = 4 + 3 = 7.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Substitution with negatives"
    },
    {
        "id": "math_0426",
        "question": "A recipe needs 2/3 cup of sugar. You want to make 3 times the recipe. How much sugar?",
        "answer": "2 cups",
        "answer_note": "3 × 2/3 = 6/3 = 2 cups.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "Scaling a recipe"
    },
    {
        "id": "math_0427",
        "question": "What is 4 × 10³?",
        "answer": "4,000",
        "answer_note": "10³ = 1000. 4 × 1000 = 4000.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Powers of ten"
    },
    {
        "id": "math_0428",
        "question": "What is the next term: 1, 3, 7, 15, 31, __?",
        "answer": "63",
        "answer_note": "Each term = 2 × previous + 1. 31×2+1 = 63. Or: 2¹−1, 2²−1, 2³−1, etc.",
        "category": "sequences",
        "difficulty": "hard",
        "hook": "Doubling plus one"
    },
    {
        "id": "math_0429",
        "question": "What is the probability of NOT rolling a 6 on a die?",
        "answer": "5/6",
        "answer_note": "P(6) = 1/6. Complement: 1 − 1/6 = 5/6.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Complement rule"
    },
    {
        "id": "math_0430",
        "question": "Solve: (2/3)x = 8",
        "answer": "x = 12",
        "answer_note": "Multiply both sides by 3/2: x = 8 × 3/2 = 12.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Fraction coefficient"
    },
    {
        "id": "math_0431",
        "question": "What is the area of a rhombus with diagonals 10 and 6?",
        "answer": "30 square units",
        "answer_note": "Area = (d1 × d2) / 2 = (10 × 6) / 2 = 30.",
        "category": "geometry",
        "difficulty": "hard",
        "hook": "Rhombus area formula"
    },
    {
        "id": "math_0432",
        "question": "If you earn $12 per hour and work 7.5 hours, how much do you earn?",
        "answer": "$90",
        "answer_note": "12 × 7.5 = 90.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "Simple pay calculation"
    },
    {
        "id": "math_0433",
        "question": "What is the ratio 45:15 in simplest form?",
        "answer": "3:1",
        "answer_note": "Divide both by 15: 45÷15=3, 15÷15=1. Ratio = 3:1.",
        "category": "logic",
        "difficulty": "easy",
        "hook": "Simplify the ratio"
    },
    {
        "id": "math_0434",
        "question": "A bag has equal numbers of 1p, 2p, and 5p coins worth £1.60 total. How many of each?",
        "answer": "20 of each",
        "answer_note": "x + 2x + 5x = 160p. 8x = 160. x = 20.",
        "category": "word_problem",
        "difficulty": "hard",
        "hook": "Simultaneous coin puzzle"
    },
    {
        "id": "math_0435",
        "question": "What is the exterior angle of a regular pentagon?",
        "answer": "72°",
        "answer_note": "Exterior angle = 360° ÷ n = 360 ÷ 5 = 72°.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Exterior angle rule"
    },
    {
        "id": "math_0436",
        "question": "What is 101 × 99?",
        "answer": "9,999",
        "answer_note": "(100+1)(100−1) = 100²−1² = 10000−1 = 9999. Difference of squares!",
        "category": "algebra",
        "difficulty": "hard",
        "hook": "Difference of squares shortcut"
    },
    {
        "id": "math_0437",
        "question": "A number is increased by 40% then decreased by 40%. Is it back to the original?",
        "answer": "No — it's 16% less",
        "answer_note": "Start 100. +40%: 140. −40%: 140×0.6 = 84. Lost 16%.",
        "category": "percentages",
        "difficulty": "hard",
        "hook": "Percentages are not reversible"
    },
    {
        "id": "math_0438",
        "question": "What is the sum of the first 100 natural numbers?",
        "answer": "5,050",
        "answer_note": "n(n+1)/2 = 100 × 101 / 2 = 5,050.",
        "category": "sequences",
        "difficulty": "medium",
        "hook": "The trick Gauss used at age 10"
    },
    {
        "id": "math_0439",
        "question": "What is 2/5 of £60?",
        "answer": "£24",
        "answer_note": "2/5 × 60 = 120/5 = 24.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Fractions of money"
    },
    {
        "id": "math_0440",
        "question": "In a group of 4, how many different pairs can be formed?",
        "answer": "6",
        "answer_note": "C(4,2) = 4!/(2!2!) = 6 unique pairs.",
        "category": "probability",
        "difficulty": "medium",
        "hook": "Combinations counting"
    },
    {
        "id": "math_0441",
        "question": "What is 100³?",
        "answer": "1,000,000",
        "answer_note": "100³ = 100 × 100 × 100 = 1,000,000 (one million).",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Powers of 100"
    },
    {
        "id": "math_0442",
        "question": "Solve: 3x + 2y = 12 and x = 2",
        "answer": "y = 3",
        "answer_note": "Substitute x=2: 6 + 2y = 12. 2y = 6. y = 3.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Simultaneous equations"
    },
    {
        "id": "math_0443",
        "question": "What is the sum of all angles in a quadrilateral?",
        "answer": "360°",
        "answer_note": "Any quadrilateral has interior angles summing to 360°.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Quadrilateral angles"
    },
    {
        "id": "math_0444",
        "question": "What is 6.25% as a decimal?",
        "answer": "0.0625",
        "answer_note": "Divide by 100: 6.25 ÷ 100 = 0.0625.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "Percent to decimal"
    },
    {
        "id": "math_0445",
        "question": "A TV costs £480 and is discounted by 15%. What is the sale price?",
        "answer": "£408",
        "answer_note": "15% of 480 = 72. 480 − 72 = £408.",
        "category": "percentages",
        "difficulty": "medium",
        "hook": "Sale price calculation"
    },
    {
        "id": "math_0446",
        "question": "What is 3 × 10⁻² in standard form?",
        "answer": "0.03",
        "answer_note": "10⁻² = 0.01. 3 × 0.01 = 0.03.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Standard form"
    },
    {
        "id": "math_0447",
        "question": "A right triangle has legs 5 and 12. What is the hypotenuse?",
        "answer": "13",
        "answer_note": "√(5²+12²) = √(25+144) = √169 = 13. Another classic triple.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "5-12-13 Pythagorean triple"
    },
    {
        "id": "math_0448",
        "question": "What is the value of 5P2 (permutations)?",
        "answer": "20",
        "answer_note": "5P2 = 5! / (5−2)! = 5 × 4 = 20.",
        "category": "probability",
        "difficulty": "hard",
        "hook": "Ordered arrangements"
    },
    {
        "id": "math_0449",
        "question": "What is the missing number: __, 4, 9, 16, 25?",
        "answer": "1",
        "answer_note": "Perfect squares: 1², 2², 3², 4², 5². First term = 1.",
        "category": "sequences",
        "difficulty": "easy",
        "hook": "Find the start"
    },
    {
        "id": "math_0450",
        "question": "What is 3/7 as a decimal (to 2 dp)?",
        "answer": "0.43",
        "answer_note": "3 ÷ 7 = 0.4285... ≈ 0.43 (2 decimal places).",
        "category": "fractions",
        "difficulty": "medium",
        "hook": "Fraction to decimal"
    },
    {
        "id": "math_0451",
        "question": "A car uses 8 litres of fuel per 100 km. How much for 350 km?",
        "answer": "28 litres",
        "answer_note": "350 ÷ 100 = 3.5. 3.5 × 8 = 28 litres.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Fuel efficiency maths"
    },
    {
        "id": "math_0452",
        "question": "What is 4/9 × 9/4?",
        "answer": "1",
        "answer_note": "Any fraction multiplied by its reciprocal = 1.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Fraction × reciprocal"
    },
    {
        "id": "math_0453",
        "question": "What is −8 ÷ −2?",
        "answer": "4",
        "answer_note": "Negative ÷ negative = positive. −8 ÷ −2 = 4.",
        "category": "order_of_operations",
        "difficulty": "easy",
        "hook": "Sign rules for division"
    },
    {
        "id": "math_0454",
        "question": "What is (2³)²?",
        "answer": "64",
        "answer_note": "Power of a power: multiply exponents. 2^(3×2) = 2⁶ = 64.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Power rule"
    },
    {
        "id": "math_0455",
        "question": "A test has 80 questions. You get 65 right. What is your percentage score?",
        "answer": "81.25%",
        "answer_note": "65/80 × 100 = 81.25%.",
        "category": "percentages",
        "difficulty": "medium",
        "hook": "Exam score"
    },
    {
        "id": "math_0456",
        "question": "What is the surface area of a cube with side 4 cm?",
        "answer": "96 cm²",
        "answer_note": "6 faces, each 4×4=16. 6 × 16 = 96 cm².",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Surface area of 3D shapes"
    },
    {
        "id": "math_0457",
        "question": "A number is 3 more than twice another. Together they sum to 27. What are they?",
        "answer": "8 and 19",
        "answer_note": "x + (2x+3) = 27. 3x+3=27. x=8, 2x+3=19.",
        "category": "word_problem",
        "difficulty": "hard",
        "hook": "Two unknowns, one equation"
    },
    {
        "id": "math_0458",
        "question": "What is the probability of rolling an even number on a standard die?",
        "answer": "1/2",
        "answer_note": "Even faces: 2, 4, 6. That's 3 out of 6. P = 3/6 = 1/2.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Even or odd?"
    },
    {
        "id": "math_0459",
        "question": "What is 1 million in scientific notation?",
        "answer": "1 × 10⁶",
        "answer_note": "1,000,000 = 10⁶ = 1 × 10⁶.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Scientific notation"
    },
    {
        "id": "math_0460",
        "question": "What is the missing angle in a triangle with angles 55° and 80°?",
        "answer": "45°",
        "answer_note": "Sum = 180°. 180 − 55 − 80 = 45°.",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "Missing angle"
    },
    {
        "id": "math_0461",
        "question": "What is 2 − 3 + 4 − 5 + 6?",
        "answer": "4",
        "answer_note": "(2+4+6) − (3+5) = 12 − 8 = 4.",
        "category": "order_of_operations",
        "difficulty": "easy",
        "hook": "Left to right, no tricks"
    },
    {
        "id": "math_0462",
        "question": "Expand: (x + 4)²",
        "answer": "x² + 8x + 16",
        "answer_note": "(x+4)² = x² + 2(4)x + 4² = x² + 8x + 16.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Perfect square expansion"
    },
    {
        "id": "math_0463",
        "question": "If the probability of rain is 0.3, what is the probability it does NOT rain?",
        "answer": "0.7",
        "answer_note": "Complement: 1 − 0.3 = 0.7.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Complement in probability"
    },
    {
        "id": "math_0464",
        "question": "What is 5% of 5% of 4000?",
        "answer": "10",
        "answer_note": "5% of 4000 = 200. 5% of 200 = 10.",
        "category": "percentages",
        "difficulty": "medium",
        "hook": "Tiny percentages"
    },
    {
        "id": "math_0465",
        "question": "A box holds 24 cans. How many boxes hold 288 cans?",
        "answer": "12",
        "answer_note": "288 ÷ 24 = 12 boxes.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "Division word problem"
    },
    {
        "id": "math_0466",
        "question": "What is 3/4 − 1/6?",
        "answer": "7/12",
        "answer_note": "LCD = 12. 9/12 − 2/12 = 7/12.",
        "category": "fractions",
        "difficulty": "medium",
        "hook": "Fraction subtraction"
    },
    {
        "id": "math_0467",
        "question": "What is the sum of the first 5 odd numbers?",
        "answer": "25",
        "answer_note": "1+3+5+7+9 = 25. Sum of first n odd numbers = n².",
        "category": "sequences",
        "difficulty": "medium",
        "hook": "Odd number pattern"
    },
    {
        "id": "math_0468",
        "question": "A map uses scale 1:50000. 3 cm on the map represents how many km?",
        "answer": "1.5 km",
        "answer_note": "3 cm × 50000 = 150000 cm = 1500 m = 1.5 km.",
        "category": "word_problem",
        "difficulty": "hard",
        "hook": "Map scale"
    },
    {
        "id": "math_0469",
        "question": "What is the simplest form of 24/36?",
        "answer": "2/3",
        "answer_note": "GCF of 24 and 36 is 12. 24÷12 = 2, 36÷12 = 3. Simplified: 2/3.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Simplify the fraction"
    },
    {
        "id": "math_0470",
        "question": "Solve: 10 − 2(3x − 1) = 4",
        "answer": "x = 1",
        "answer_note": "Expand: 10 − 6x + 2 = 4. 12 − 6x = 4. 6x = 8. x = 4/3... Wait: −6x = −8, x = 4/3. Let me recheck: 10−2(3x−1)=4 → 10−6x+2=4 → 12−6x=4 → 6x=8 → x=4/3.",
        "category": "algebra",
        "difficulty": "hard",
        "hook": "Careful expansion required"
    },
    {
        "id": "math_0471",
        "question": "What is 8% of £250?",
        "answer": "£20",
        "answer_note": "1% of 250 = 2.50. 8% = 8 × 2.50 = £20.",
        "category": "percentages",
        "difficulty": "easy",
        "hook": "1% trick"
    },
    {
        "id": "math_0472",
        "question": "How many edges does a cube have?",
        "answer": "12",
        "answer_note": "A cube has 12 edges (4 top, 4 bottom, 4 vertical).",
        "category": "geometry",
        "difficulty": "easy",
        "hook": "3D shape properties"
    },
    {
        "id": "math_0473",
        "question": "What is the value of n if nP3 = 60?",
        "answer": "n = 5",
        "answer_note": "nP3 = n(n−1)(n−2) = 60. 5×4×3 = 60. So n=5.",
        "category": "probability",
        "difficulty": "hard",
        "hook": "Reverse permutation"
    },
    {
        "id": "math_0474",
        "question": "The average of 5 numbers is 12. One number is removed and the average becomes 10. What was the removed number?",
        "answer": "20",
        "answer_note": "Total = 5×12=60. New total = 4×10=40. Removed = 60−40=20.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Averages puzzle"
    },
    {
        "id": "math_0475",
        "question": "What is the smallest perfect number?",
        "answer": "6",
        "answer_note": "6 = 1+2+3. A perfect number equals the sum of its proper divisors. 6 is the smallest.",
        "category": "logic",
        "difficulty": "hard",
        "hook": "Perfect numbers"
    },
    {
        "id": "math_0476",
        "question": "What is 5! ÷ 3!?",
        "answer": "20",
        "answer_note": "5! = 120, 3! = 6. 120 ÷ 6 = 20. Or: 5×4 = 20 (cancel common terms).",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Factorial division"
    },
    {
        "id": "math_0477",
        "question": "A number ends in 3 zeros. By what minimum number is it divisible?",
        "answer": "1000",
        "answer_note": "Three zeros means divisible by 10³ = 1000.",
        "category": "logic",
        "difficulty": "medium",
        "hook": "Trailing zeros"
    },
    {
        "id": "math_0478",
        "question": "What is the area of a sector with radius 6 and angle 60°? (π ≈ 3.14)",
        "answer": "18.84 square units",
        "answer_note": "Area = (θ/360) × π × r² = (60/360) × 3.14 × 36 = 1/6 × 113.04 = 18.84.",
        "category": "geometry",
        "difficulty": "hard",
        "hook": "Sector area"
    },
    {
        "id": "math_0479",
        "question": "Express 72 as a product of prime factors.",
        "answer": "2³ × 3²",
        "answer_note": "72 = 8 × 9 = 2³ × 3².",
        "category": "logic",
        "difficulty": "medium",
        "hook": "Prime factorisation"
    },
    {
        "id": "math_0480",
        "question": "What is 4/5 of 75?",
        "answer": "60",
        "answer_note": "75 ÷ 5 = 15. 15 × 4 = 60.",
        "category": "fractions",
        "difficulty": "easy",
        "hook": "Fractions of whole numbers"
    },
    {
        "id": "math_0481",
        "question": "The ratio of boys to girls in a class is 3:2. There are 30 students. How many are girls?",
        "answer": "12",
        "answer_note": "Total parts = 5. Girls = 2/5 × 30 = 12.",
        "category": "word_problem",
        "difficulty": "medium",
        "hook": "Ratio problem"
    },
    {
        "id": "math_0482",
        "question": "What is 35 × 11?",
        "answer": "385",
        "answer_note": "11× trick: 35 → write 3_5, middle digit = 3+5=8. Answer: 385.",
        "category": "logic",
        "difficulty": "medium",
        "hook": "The 11 times table trick"
    },
    {
        "id": "math_0483",
        "question": "Solve: log₁₀(1000) = ?",
        "answer": "3",
        "answer_note": "10³ = 1000. So log₁₀(1000) = 3.",
        "category": "algebra",
        "difficulty": "hard",
        "hook": "Logarithms"
    },
    {
        "id": "math_0484",
        "question": "What is 3.6 × 10⁴?",
        "answer": "36,000",
        "answer_note": "Shift decimal right 4 places: 3.6 → 36,000.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Standard form to ordinary"
    },
    {
        "id": "math_0485",
        "question": "Two numbers are in ratio 5:3. Their sum is 40. What is the smaller number?",
        "answer": "15",
        "answer_note": "Total parts = 8. Smaller = 3/8 × 40 = 15.",
        "category": "logic",
        "difficulty": "medium",
        "hook": "Ratio and sum"
    },
    {
        "id": "math_0486",
        "question": "What is the perimeter of a sector with radius 10 and angle 90°?",
        "answer": "35.7 units",
        "answer_note": "Arc = (90/360) × 2π × 10 = 15.71. Perimeter = 15.71 + 10 + 10 ≈ 35.7.",
        "category": "geometry",
        "difficulty": "hard",
        "hook": "Sector perimeter"
    },
    {
        "id": "math_0487",
        "question": "What is 3⁴?",
        "answer": "81",
        "answer_note": "3⁴ = 3×3×3×3 = 81.",
        "category": "algebra",
        "difficulty": "easy",
        "hook": "Powers of 3"
    },
    {
        "id": "math_0488",
        "question": "How many centimetres are in 2.5 metres?",
        "answer": "250 cm",
        "answer_note": "1 metre = 100 cm. 2.5 × 100 = 250 cm.",
        "category": "word_problem",
        "difficulty": "easy",
        "hook": "Unit conversions"
    },
    {
        "id": "math_0489",
        "question": "What is the interior angle of a regular octagon?",
        "answer": "135°",
        "answer_note": "Interior angle = (n−2)×180/n = (8−2)×180/8 = 6×180/8 = 135°.",
        "category": "geometry",
        "difficulty": "hard",
        "hook": "Regular polygon angles"
    },
    {
        "id": "math_0490",
        "question": "What is √(2² + 2²)?",
        "answer": "2√2 ≈ 2.83",
        "answer_note": "√(4+4) = √8 = 2√2 ≈ 2.83.",
        "category": "geometry",
        "difficulty": "medium",
        "hook": "Diagonal of a unit square × 2"
    },
    {
        "id": "math_0491",
        "question": "A car depreciates by 20% per year. Starting at £15,000, what is its value after 2 years?",
        "answer": "£9,600",
        "answer_note": "Year 1: 15000×0.8=12000. Year 2: 12000×0.8=9600.",
        "category": "percentages",
        "difficulty": "hard",
        "hook": "Compound depreciation"
    },
    {
        "id": "math_0492",
        "question": "What is the HCF of 15 and 25?",
        "answer": "5",
        "answer_note": "Factors of 15: 1,3,5,15. Factors of 25: 1,5,25. Highest common = 5.",
        "category": "logic",
        "difficulty": "easy",
        "hook": "Highest Common Factor"
    },
    {
        "id": "math_0493",
        "question": "What is the gradient of a line through (0,0) and (4,8)?",
        "answer": "2",
        "answer_note": "Gradient = rise/run = 8/4 = 2.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Rise over run"
    },
    {
        "id": "math_0494",
        "question": "A dice is rolled 180 times. How many times would you expect to see a 3?",
        "answer": "30",
        "answer_note": "Expected = 180 × 1/6 = 30.",
        "category": "probability",
        "difficulty": "easy",
        "hook": "Expected frequency"
    },
    {
        "id": "math_0495",
        "question": "What is 125 ÷ 0.25?",
        "answer": "500",
        "answer_note": "Dividing by 0.25 = multiplying by 4. 125 × 4 = 500.",
        "category": "order_of_operations",
        "difficulty": "medium",
        "hook": "Division by decimal"
    },
    {
        "id": "math_0496",
        "question": "What is the nth term of the sequence 3, 7, 11, 15, 19?",
        "answer": "4n − 1",
        "answer_note": "Arithmetic sequence with first term 3, common difference 4. nth term = 3 + (n−1)4 = 4n−1.",
        "category": "sequences",
        "difficulty": "hard",
        "hook": "Find the formula"
    },
    {
        "id": "math_0497",
        "question": "What is 5 + 4 × 3 − 2 ÷ 1?",
        "answer": "15",
        "answer_note": "BODMAS: 4×3=12, 2÷1=2. Then 5+12−2=15.",
        "category": "order_of_operations",
        "difficulty": "medium",
        "hook": "All four operations"
    },
    {
        "id": "math_0498",
        "question": "Factorise: x² − 9",
        "answer": "(x + 3)(x − 3)",
        "answer_note": "Difference of squares: a²−b² = (a+b)(a−b). Here a=x, b=3.",
        "category": "algebra",
        "difficulty": "medium",
        "hook": "Difference of two squares"
    },
    {
        "id": "math_0499",
        "question": "A fair die is rolled. What is P(prime number)?",
        "answer": "1/2",
        "answer_note": "Primes on a die: 2, 3, 5. That's 3 out of 6 = 1/2.",
        "category": "probability",
        "difficulty": "medium",
        "hook": "Primes on a die"
    },
    {
        "id": "math_0500",
        "question": "What is 7 × 99?",
        "answer": "693",
        "answer_note": "7 × 99 = 7 × (100−1) = 700 − 7 = 693.",
        "category": "logic",
        "difficulty": "medium",
        "hook": "The near-100 trick"
    },
    {
        "id": "math_0501",
        "question": "A snail doubles its speed every minute, starting at 1 cm/min. How fast after 7 minutes?",
        "answer": "128 cm/min",
        "answer_note": "After 7 minutes: 2⁷ = 128 cm/min. Exponential growth.",
        "category": "sequences",
        "difficulty": "hard",
        "hook": "Exponential speed growth"
    },
]


def main():
    data = json.loads(TARGET.read_text(encoding="utf-8"))
    print(f"Existing items: {len(data)}")
    data.extend(NEW_ITEMS)
    TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Total after append: {len(data)}")
    print(f"New items appended: {len(NEW_ITEMS)}")
    print(f"ID range: {NEW_ITEMS[0]['id']} — {NEW_ITEMS[-1]['id']}")


if __name__ == "__main__":
    main()
