import json
from pathlib import Path

F = Path("C:/Users/prawn/OneDrive/Documents/djamies1.github.io/funfacts/facts.json")
existing = json.load(open(F, encoding="utf-8"))
ids = [int(x["id"].split("_")[-1]) for x in existing if x.get("id","").startswith("ff_")]
next_n = max(ids, default=0) + 1

new_items = [
    # ANIMALS
    {"question": "How many eyes does a bee have?", "answer": "5", "answer_note": "Bees have 2 large compound eyes and 3 small simple eyes (ocelli) on top of their head.", "category": "animals", "hook": "Five eyes on the hive!"},
    {"question": "What animal cannot stick out its tongue?", "answer": "Crocodile", "answer_note": "A crocodile's tongue is attached to the bottom of its mouth and cannot be extended.", "category": "animals", "hook": "Stuck-in tongue!"},
    {"question": "Which bird can fly backwards?", "answer": "Hummingbird", "answer_note": "Hummingbirds are the only birds capable of flying backwards, thanks to their unique ball-and-socket wing joints.", "category": "animals", "hook": "Reverse flight!"},
    {"question": "What is the only mammal that cannot jump?", "answer": "Elephant (among largest)", "answer_note": "Elephants are the only large mammals that physically cannot jump — their body weight and leg structure prevent it.", "category": "animals", "hook": "No jumping!"},
    {"question": "How long is a giraffe's tongue?", "answer": "About 45–50 cm (18 inches)", "answer_note": "A giraffe's long dark tongue is used to strip leaves from tall branches and is even used to clean its own ears.", "category": "animals", "hook": "Long tongue!"},
    {"question": "How many legs does a lobster have?", "answer": "10", "answer_note": "Lobsters are decapods (10 legs). Their front two legs are claws used for feeding and defense.", "category": "animals", "hook": "Crustacean count!"},
    {"question": "What animal has the longest pregnancy?", "answer": "Elephant (22 months)", "answer_note": "African elephants have a gestation period of about 22 months — nearly 2 years!", "category": "animals", "hook": "Long wait!"},
    {"question": "A group of jellyfish is called what?", "answer": "A smack", "answer_note": "A gathering of jellyfish is called a smack (also bloom or swarm). You get smacked if you swim into one!", "category": "animals", "hook": "Ouch!"},
    {"question": "Which animal has the most teeth?", "answer": "Giant armadillo (up to 100 teeth)", "answer_note": "The giant armadillo has up to 100 teeth — more than any other land animal. Some snails have thousands of tiny teeth.", "category": "animals", "hook": "Tooth count!"},
    {"question": "How many legs does a spider have?", "answer": "8", "answer_note": "All spiders have 8 legs, which distinguishes them from insects (6 legs) and places them in the class Arachnida.", "category": "animals", "hook": "Arachnid facts!"},
    {"question": "Which animal has the loudest call in the world?", "answer": "Sperm whale", "answer_note": "Sperm whale clicks can reach 230 decibels — the loudest sound produced by any animal.", "category": "animals", "hook": "Ear-shattering!"},
    {"question": "How do starfish eat?", "answer": "They push their stomach out of their body", "answer_note": "Starfish evert their stomach through their mouth onto prey, digest it externally, then retract the stomach.", "category": "animals", "hook": "Stomach outside!"},
    {"question": "Which insect has the shortest lifespan?", "answer": "Mayfly (24 hours)", "answer_note": "Adult mayflies live just one day — their sole purpose is to mate and lay eggs.", "category": "animals", "hook": "One day wonder!"},
    {"question": "What is the fastest fish in the ocean?", "answer": "Sailfish (up to 110 km/h)", "answer_note": "The sailfish can swim at speeds up to 110 km/h (68 mph), making it the fastest fish in the ocean.", "category": "animals", "hook": "Speed demon!"},
    {"question": "How many hearts does a worm have?", "answer": "5 pairs of aortic arches (10 pseudo-hearts)", "answer_note": "Earthworms have 5 pairs of aortic arches that act like hearts, pumping blood through their simple circulatory system.", "category": "animals", "hook": "Multi-hearted!"},
    # SCIENCE
    {"question": "What is the only metal that is liquid at room temperature?", "answer": "Mercury", "answer_note": "Mercury is the only metal that is liquid at room temperature (25°C). Gallium also liquefies just above room temp.", "category": "science", "hook": "Liquid metal!"},
    {"question": "How many bones are in a human hand?", "answer": "27", "answer_note": "Each hand has 27 bones: 8 carpals, 5 metacarpals, and 14 phalanges (finger bones).", "category": "science", "hook": "Counting hand bones!"},
    {"question": "What is the most abundant mineral in the human body?", "answer": "Calcium", "answer_note": "Calcium makes up about 1.5% of body weight — mostly stored in bones and teeth.", "category": "science", "hook": "Bone mineral!"},
    {"question": "Which planet rotates in the opposite direction to most others?", "answer": "Venus (and Uranus)", "answer_note": "Venus rotates clockwise when viewed from above its north pole, opposite to most planets. Uranus rotates on its side.", "category": "science", "hook": "Backwards rotation!"},
    {"question": "How many times can a piece of paper be folded in half?", "answer": "About 7 (by hand)", "answer_note": "A standard piece of paper can only be folded about 7 times due to thickness doubling with each fold.", "category": "science", "hook": "Try it!"},
    {"question": "What is absolute zero?", "answer": "-273.15°C (-459.67°F)", "answer_note": "Absolute zero is the coldest possible temperature, where all molecular motion ceases. It's 0 Kelvin.", "category": "science", "hook": "Coldest possible!"},
    {"question": "How many cells are in the human body?", "answer": "About 37 trillion", "answer_note": "The human body contains approximately 37 trillion cells, of which only about 10 trillion are human — the rest are microbes!", "category": "science", "hook": "Cell count!"},
    {"question": "What is the name of the force that keeps planets in orbit?", "answer": "Gravity", "answer_note": "Gravity is the attractive force between masses. The Sun's gravity keeps planets in elliptical orbits.", "category": "science", "hook": "Orbital force!"},
    {"question": "How long does it take the Earth to orbit the Sun?", "answer": "365.25 days", "answer_note": "Earth takes 365.25 days to orbit the Sun. The extra 0.25 day is why we have a leap year every 4 years.", "category": "science", "hook": "Leap year reason!"},
    {"question": "What is the pH of pure water?", "answer": "7 (neutral)", "answer_note": "Pure water has a pH of exactly 7, making it neutral — neither acidic (below 7) nor basic (above 7).", "category": "science", "hook": "Neutral water!"},
    # HISTORY
    {"question": "Who invented the printing press?", "answer": "Johannes Gutenberg", "answer_note": "Johannes Gutenberg invented the movable-type printing press around 1440 in Germany, revolutionizing information sharing.", "category": "history", "hook": "Revolution in print!"},
    {"question": "How long did the Byzantine Empire last?", "answer": "About 1,100 years (330–1453 AD)", "answer_note": "The Byzantine (Eastern Roman) Empire lasted from 330 AD when Constantine moved the capital to 1453 when Constantinople fell.", "category": "history", "hook": "Ancient empire!"},
    {"question": "What year did World War I begin?", "answer": "1914", "answer_note": "WWI began on July 28, 1914, following the assassination of Archduke Franz Ferdinand of Austria.", "category": "history", "hook": "The Great War!"},
    {"question": "Which US President served the shortest term?", "answer": "William Henry Harrison (32 days)", "answer_note": "Harrison died of pneumonia just 32 days after his inauguration in 1841, the shortest US presidency.", "category": "history", "hook": "Brief presidency!"},
    {"question": "What was the name of the first human in space?", "answer": "Yuri Gagarin", "answer_note": "Soviet cosmonaut Yuri Gagarin became the first human in space on April 12, 1961, orbiting Earth once.", "category": "history", "hook": "First in space!"},
    {"question": "Who was the longest-reigning British monarch?", "answer": "Queen Elizabeth II (70 years)", "answer_note": "Queen Elizabeth II reigned from February 6, 1952, until her death on September 8, 2022 — 70 years and 214 days.", "category": "history", "hook": "Longest reign!"},
    # GEOGRAPHY
    {"question": "What is the largest island in the world?", "answer": "Greenland", "answer_note": "Greenland covers about 2.16 million km², making it the world's largest island (Australia is a continent).", "category": "geography", "hook": "Biggest island!"},
    {"question": "How many countries share a border with Germany?", "answer": "9", "answer_note": "Germany borders Denmark, Poland, Czech Republic, Austria, Switzerland, France, Luxembourg, Belgium, and the Netherlands.", "category": "geography", "hook": "Nine neighbors!"},
    {"question": "What is the world's highest waterfall?", "answer": "Angel Falls, Venezuela (979m)", "answer_note": "Angel Falls (Salto Angel) in Venezuela drops 979 meters, making it the world's tallest uninterrupted waterfall.", "category": "geography", "hook": "Highest drop!"},
    {"question": "Which city has the most skyscrapers in the world?", "answer": "Hong Kong", "answer_note": "Hong Kong has more skyscrapers (buildings over 150m) than any other city in the world.", "category": "geography", "hook": "Skyline king!"},
    {"question": "What is the longest coastline in the world?", "answer": "Canada (202,080 km)", "answer_note": "Canada has the world's longest coastline at 202,080 km — more than five times longer than the US coastline.", "category": "geography", "hook": "Endless coast!"},
    # FOOD & CULTURE
    {"question": "Which country drinks the most coffee per capita?", "answer": "Finland", "answer_note": "Finland leads the world in coffee consumption per capita, averaging about 12 kg per person per year.", "category": "food", "hook": "Coffee champions!"},
    {"question": "What is the world's hottest chili pepper?", "answer": "Pepper X (over 2.69 million Scoville)", "answer_note": "As of recent records, Pepper X created by Ed Curlin exceeds 2.69 million Scoville Heat Units, surpassing the Carolina Reaper.", "category": "food", "hook": "Burn!"},
    {"question": "How long does it take to hard-boil an egg at altitude?", "answer": "Longer — water boils at lower temperatures at altitude", "answer_note": "At high altitudes, water boils below 100°C, so eggs take longer to cook fully.", "category": "food", "hook": "Altitude cooking!"},
    {"question": "Which fruit contains the most vitamin C?", "answer": "Kakadu plum (3,000mg per 100g)", "answer_note": "The Australian Kakadu plum has the highest vitamin C content of any food — about 100x more than oranges.", "category": "food", "hook": "Vitamin C king!"},
    {"question": "What is the most stolen food in the world?", "answer": "Cheese", "answer_note": "About 4% of all cheese produced worldwide is stolen — it's the world's most shoplifted food.", "category": "food", "hook": "Cheese theft!"},
    # TECHNOLOGY
    {"question": "How fast does data travel through fiber optic cables?", "answer": "Close to the speed of light (~200,000 km/s)", "answer_note": "Data in fiber optic cables travels at about 2/3 the speed of light — around 200,000 km/s.", "category": "technology", "hook": "Light speed internet!"},
    {"question": "What was the first domain name ever registered?", "answer": "Symbolics.com (1985)", "answer_note": "Symbolics.com was registered on March 15, 1985, making it the world's first commercial domain name.", "category": "technology", "hook": "First domain!"},
    {"question": "How many photos are taken every day worldwide?", "answer": "About 1.8 trillion per year (roughly 5 billion per day)", "answer_note": "With smartphones everywhere, approximately 5 billion photos are taken globally each day.", "category": "technology", "hook": "Snap happy!"},
    {"question": "What language is most widely used for web development?", "answer": "JavaScript", "answer_note": "JavaScript is used by about 97% of websites for client-side scripting, making it the most widespread web language.", "category": "technology", "hook": "Web language!"},
    {"question": "How much data does the human genome contain?", "answer": "About 1.5 GB (gigabytes)", "answer_note": "The human genome contains about 3 billion base pairs, equivalent to roughly 1.5 gigabytes of data.", "category": "technology", "hook": "DNA as data!"},
    # RANDOM
    {"question": "What is the name of the longest English word without a vowel?", "answer": "Rhythms", "answer_note": "Rhythms is often cited as the longest common English word containing no traditional vowels (a, e, i, o, u) — though 'y' acts as one.", "category": "random", "hook": "No vowels!"},
    {"question": "How many languages are in danger of extinction?", "answer": "About 3,000 (nearly half of all languages)", "answer_note": "UNESCO estimates that about 3,000 of the world's 7,000 languages are endangered and may disappear by 2100.", "category": "random", "hook": "Dying languages!"},
    {"question": "What is the most popular sport in the world?", "answer": "Football (Soccer)", "answer_note": "Soccer has an estimated 4 billion fans worldwide, making it far and away the world's most popular sport.", "category": "random", "hook": "Beautiful game!"},
    {"question": "How long would it take to walk to the Moon?", "answer": "About 9.5 years nonstop", "answer_note": "At an average walking pace of 5 km/h, the 384,400 km trip would take about 9.5 years without stopping.", "category": "random", "hook": "Walk to the Moon!"},
    {"question": "How many muscles does the human tongue consist of?", "answer": "8", "answer_note": "The tongue is made up of 8 muscles — 4 intrinsic (inside the tongue) and 4 extrinsic (connecting to the jaw and skull).", "category": "random", "hook": "Tongue muscles!"},
    {"question": "What percentage of the ocean has been explored by humans?", "answer": "About 20%", "answer_note": "Despite covering over 70% of Earth, only about 20% of the ocean has been mapped or explored by humans.", "category": "random", "hook": "Deep mystery!"},
    {"question": "How many keys does a standard piano have?", "answer": "88", "answer_note": "A standard piano has 88 keys — 52 white and 36 black, spanning just over 7 octaves.", "category": "random", "hook": "Piano keys!"},
    {"question": "How old is the oldest known living organism?", "answer": "Approximately 5,000 years (bristlecone pine)", "answer_note": "Methuselah, a Great Basin bristlecone pine in California, is about 5,000 years old — the oldest known living tree.", "category": "random", "hook": "Ancient living tree!"},
    {"question": "What is the most common eye color in the world?", "answer": "Brown", "answer_note": "About 79% of the world's population has brown eyes, making it by far the most common eye color.", "category": "random", "hook": "Eye color facts!"},
    {"question": "How high can a flea jump relative to its body size?", "answer": "Up to 150 times its own height", "answer_note": "Fleas can jump up to 33 cm — about 150 times their own height. Proportionally the best jumpers on Earth.", "category": "random", "hook": "Super jumper!"},
    {"question": "What is the only planet in our solar system that has a retrograde rotation?", "answer": "Venus (and Uranus rotates on its side)", "answer_note": "Venus spins clockwise, opposite to Earth and most other planets. Uranus rotates nearly on its side.", "category": "random", "hook": "Backwards planet!"},
    {"question": "How many bones are babies born with?", "answer": "About 270–300", "answer_note": "Babies are born with 270–300 bones (mostly cartilage). Many fuse together, leaving adults with 206 bones.", "category": "random", "hook": "Extra baby bones!"},
    {"question": "Which country has the most UNESCO World Heritage Sites?", "answer": "Italy (58)", "answer_note": "Italy leads the world with 58 UNESCO World Heritage Sites, followed by China and Germany.", "category": "random", "hook": "Heritage champion!"},
]

for i, item in enumerate(new_items):
    item["id"] = f"ff_{next_n + i:04d}"

result = existing + new_items
json.dump(result, open(F, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"funfacts: {len(existing)} -> {len(result)} (+{len(new_items)})")
