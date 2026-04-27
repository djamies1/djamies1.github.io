import json
from pathlib import Path

F = Path("C:/Users/prawn/OneDrive/Documents/djamies1.github.io/mandelaeffect/questions.json")
existing = json.load(open(F, encoding="utf-8"))
ids = [int(x["id"].split("_")[-1]) for x in existing if x.get("id","").startswith("me_")]
next_n = max(ids, default=0) + 1

new_items = [
    # LOGOS & BRANDS
    {"question": "The Volkswagen logo — the V and W overlap in the middle. TRUE or FALSE?", "answer": "FALSE", "answer_note": "The V and W in the Volkswagen logo do NOT overlap — there is a small gap between them.", "hook": "Check the logo!"},
    {"question": "The Pepsi logo has a red top half and blue bottom half. TRUE or FALSE?", "answer": "FALSE", "answer_note": "The Pepsi logo has red on top, white in the middle, and blue on the bottom.", "hook": "Which way is red?"},
    {"question": "The Starbucks mermaid (siren) has a crown on her head. TRUE or FALSE?", "answer": "TRUE", "answer_note": "The Starbucks siren does indeed wear a crown/star tiara above her head.", "hook": "Crown or no crown?"},
    {"question": "The Domino's Pizza logo shows a domino tile with 3 dots. TRUE or FALSE?", "answer": "FALSE", "answer_note": "The Domino's logo shows a domino tile with 1 dot on top and 2 dots on the bottom.", "hook": "Count the dots!"},
    {"question": "The word 'Google' uses more than 4 colors in its logo. TRUE or FALSE?", "answer": "FALSE", "answer_note": "The Google logo uses exactly 4 colors: blue, red, yellow, and green.", "hook": "Count the colors!"},
    {"question": "The Target logo is a red circle with one white ring around it. TRUE or FALSE?", "answer": "TRUE", "answer_note": "Target's logo (a bullseye) has a red dot, one white ring, and a red outer ring — so two rings total but one white ring.", "hook": "Bulls-eye!"},
    {"question": "Kit Kat is spelled 'KitKat' with no space or hyphen. TRUE or FALSE?", "answer": "TRUE", "answer_note": "The official spelling is 'KitKat' — one word, no space, no hyphen.", "hook": "Break me off!"},
    {"question": "The IKEA logo text is entirely uppercase. TRUE or FALSE?", "answer": "TRUE", "answer_note": "IKEA's logo uses all uppercase letters: I-K-E-A in blue text.", "hook": "Furniture giant!"},
    # MOVIES & TV
    {"question": "In Forrest Gump, the famous quote is: 'Life is like a box of chocolates.' TRUE or FALSE?", "answer": "FALSE", "answer_note": "The actual quote is: 'Life WAS like a box of chocolates.' Past tense, spoken by Forrest about his mother.", "hook": "Past tense matters!"},
    {"question": "In The Wizard of Oz, Dorothy's slippers are ruby red. TRUE or FALSE?", "answer": "TRUE", "answer_note": "In the 1939 film they are ruby red — but in the original book by L. Frank Baum, they were silver.", "hook": "Book vs film!"},
    {"question": "In Star Wars, Darth Vader says 'Luke, I am your father.' TRUE or FALSE?", "answer": "FALSE", "answer_note": "The exact line is 'No, I am your father.' — the word 'Luke' is never said in that line.", "hook": "Famous misquote!"},
    {"question": "In Snow White, the Evil Queen says 'Mirror, mirror on the wall.' TRUE or FALSE?", "answer": "FALSE", "answer_note": "In the 1937 Disney film, the line is 'Magic mirror on the wall' — the 'mirror mirror' version comes from the original fairy tale.", "hook": "Disney vs fairy tale!"},
    {"question": "In Jaws, the famous line is 'We're gonna need a bigger boat.' TRUE or FALSE?", "answer": "TRUE", "answer_note": "Chief Brody says 'You're gonna need a bigger boat' — technically 'you're' not 'we're' but the quote is widely accepted.", "hook": "Shark classic!"},
    {"question": "In the Monopoly board game, the character 'Rich Uncle Pennybags' wears a monocle. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Despite widespread belief, Mr. Monopoly (Rich Uncle Pennybags) has never worn a monocle in the game's official art.", "hook": "No monocle!"},
    {"question": "C-3PO in Star Wars is entirely gold-colored. TRUE or FALSE?", "answer": "FALSE", "answer_note": "C-3PO has always had a silver right leg — visible in many scenes throughout the original trilogy.", "hook": "Silver leg!"},
    {"question": "In The Matrix, Morpheus says 'What if I told you everything you know is a lie?' TRUE or FALSE?", "answer": "FALSE", "answer_note": "Morpheus never says this in the film. It became a popular internet meme but the line does not appear in the movie.", "hook": "Internet meme!"},
    {"question": "In Silence of the Lambs, Hannibal Lecter says 'Hello, Clarice.' TRUE or FALSE?", "answer": "FALSE", "answer_note": "He actually says 'Good morning' — 'Hello, Clarice' is a common misquotation from pop culture parodies.", "hook": "Misquoted horror!"},
    {"question": "The Home Alone kid's name is Kevin McCallister. TRUE or FALSE?", "answer": "TRUE", "answer_note": "Yes — Macaulay Culkin's character is Kevin McCallister, abandoned at home during Christmas.", "hook": "Correct!"},
    # GEOGRAPHY & HISTORY
    {"question": "New Zealand is northeast of Australia. TRUE or FALSE?", "answer": "FALSE", "answer_note": "New Zealand is to the southeast of Australia, not the northeast.", "hook": "Check the map!"},
    {"question": "The Great Wall of China is visible from space with the naked eye. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Multiple astronauts have confirmed you cannot see the Great Wall from space with the naked eye — it's too narrow.", "hook": "Space myth!"},
    {"question": "Brazil shares a border with every South American country except two. TRUE or FALSE?", "answer": "TRUE", "answer_note": "Brazil borders every South American country except Chile and Ecuador.", "hook": "Brazil borders!"},
    {"question": "Easter Island belongs to Australia. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Easter Island (Rapa Nui) is a territory of Chile, not Australia.", "hook": "Who owns it?"},
    {"question": "The capital of Canada is Toronto. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Ottawa is the capital of Canada, not Toronto (which is the largest city).", "hook": "Ottawa!"},
    {"question": "Russia and the USA are separated by less than 4 km at their closest point. TRUE or FALSE?", "answer": "TRUE", "answer_note": "The Diomede Islands in the Bering Strait are just 3.8 km apart — one belongs to Russia, one to the USA.", "hook": "So close!"},
    # FOOD & PRODUCTS
    {"question": "Froot Loops cereal: all the loops taste different based on their color. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Despite different colors, all Froot Loops have the same flavor. The colors are purely visual.", "hook": "One flavor!"},
    {"question": "Pop Rocks candy was invented in the 1970s. TRUE or FALSE?", "answer": "TRUE", "answer_note": "Pop Rocks were invented by General Foods chemist William Mitchell in 1956 but commercially released in 1975.", "hook": "Popping candy history!"},
    {"question": "Lucky Charms: the marshmallow shapes have changed over the years. TRUE or FALSE?", "answer": "TRUE", "answer_note": "Lucky Charms has added and changed marshmallow shapes many times since 1964 (original: hearts, stars, moons, clovers).", "hook": "Marshmallow updates!"},
    {"question": "Oreos are vegan. TRUE or FALSE?", "answer": "TRUE (officially, though cross-contact disclaimer applies)", "answer_note": "Oreos contain no animal ingredients — they're technically vegan. However, Nabisco notes cross-contact with milk in production.", "hook": "Vegan Oreos?"},
    {"question": "Twinkies have an almost unlimited shelf life. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Twinkies have a shelf life of about 45 days — much less than the mythical 'forever' claim.", "hook": "Twinkie myth!"},
    # HUMAN BODY & SCIENCE
    {"question": "Humans have five senses. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Humans actually have many more senses including proprioception, thermoception, nociception, equilibrioception, and others.", "hook": "More than 5!"},
    {"question": "Humans and chimpanzees share about 98% of their DNA. TRUE or FALSE?", "answer": "TRUE", "answer_note": "Humans and chimpanzees share approximately 98.7% of their DNA, making them our closest living relatives.", "hook": "Almost chimps!"},
    {"question": "Chameleons change color to camouflage themselves. TRUE or FALSE?", "answer": "FALSE (mostly)", "answer_note": "Chameleons primarily change color for communication, mood, and temperature regulation — not camouflage. Their base color already matches their environment.", "hook": "Not about hiding!"},
    {"question": "A blue whale's heart is the size of a small car. TRUE or FALSE?", "answer": "TRUE", "answer_note": "A blue whale's heart can weigh up to 400 pounds (180 kg) and is about the size of a small car.", "hook": "Massive heart!"},
    {"question": "The tongue is the strongest muscle in the human body. TRUE or FALSE?", "answer": "FALSE", "answer_note": "The tongue is strong for its size, but it's not the strongest. The masseter (jaw muscle) produces the most force.", "hook": "Jaw wins!"},
    # MISCELLANEOUS
    {"question": "The nursery rhyme 'Ring Around the Rosie' is about the Black Plague. TRUE or FALSE?", "answer": "FALSE", "answer_note": "This is a popular modern myth. Folklorists and historians agree there is no evidence linking it to the plague — it likely has no dark origin.", "hook": "Myth of a myth!"},
    {"question": "Napoleon Bonaparte was exiled to St. Helena after Waterloo. TRUE or FALSE?", "answer": "TRUE", "answer_note": "After his defeat at Waterloo in 1815, Napoleon was exiled to Saint Helena island in the South Atlantic, where he died in 1821.", "hook": "Final exile!"},
    {"question": "Einstein failed math at school. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Einstein excelled at mathematics from a young age. He mastered calculus by age 15. The myth arose from a misunderstanding of Swiss grading scales.", "hook": "Failed genius?"},
    {"question": "The word 'set' has the most definitions in the English dictionary. TRUE or FALSE?", "answer": "TRUE", "answer_note": "The word 'set' has the most meanings in English according to the Oxford English Dictionary — over 430 uses.", "hook": "Most meanings!"},
    {"question": "Walt Disney is cryonically frozen beneath Disneyland. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Walt Disney was cremated and interred at Forest Lawn Memorial Park in Glendale, California. The cryonics story is a complete myth.", "hook": "Disney myth!"},
    {"question": "Diamonds can be made from peanut butter. TRUE or FALSE?", "answer": "TRUE", "answer_note": "Scientists have actually created tiny synthetic diamonds from peanut butter using extreme pressure — it contains carbon, the key ingredient.", "hook": "Peanut butter diamonds!"},
    {"question": "The human body produces a new skeleton every 10 years. TRUE or FALSE?", "answer": "FALSE", "answer_note": "Bone cells do regenerate but at different rates — some parts take decades. You don't get a completely new skeleton every 10 years.", "hook": "Bone myth!"},
    {"question": "A day on Mercury is longer than a year on Mercury. TRUE or FALSE?", "answer": "TRUE", "answer_note": "Mercury rotates so slowly that its day (58.6 Earth days) is longer than its year (88 Earth days when accounting for rotation relative to the Sun, it's actually 176 Earth days per solar day).", "hook": "Slow spinner!"},
    {"question": "Penguins only live in the southern hemisphere. TRUE or FALSE?", "answer": "FALSE", "answer_note": "While most penguins live in the southern hemisphere, the Galapagos penguin lives at the equator, straddling the northern hemisphere.", "hook": "Equator penguins!"},
    {"question": "The original name of the city of New York was New Amsterdam. TRUE or FALSE?", "answer": "TRUE", "answer_note": "New York was founded by Dutch colonists as New Amsterdam in 1626. The English took it in 1664 and renamed it New York.", "hook": "Dutch origins!"},
]

for i, item in enumerate(new_items):
    item["id"] = f"me_{next_n + i:04d}"

result = existing + new_items
json.dump(result, open(F, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"mandelaeffect: {len(existing)} -> {len(result)} (+{len(new_items)})")
