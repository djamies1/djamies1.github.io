import json
from pathlib import Path

F = Path("C:/Users/prawn/OneDrive/Documents/djamies1.github.io/funfacts/facts.json")
existing = json.load(open(F, encoding="utf-8"))
ids = [int(x["id"].split("_")[-1]) for x in existing if x.get("id", "").startswith("ff_")]
next_n = max(ids, default=0) + 1

new_items = [
    # ANIMALS
    {"question": "How many hearts does an octopus have?", "answer": "3", "answer_note": "Two pump blood to the gills, one pumps it to the rest of the body.", "category": "animals", "hook": "Triple the heartbeats!"},
    {"question": "What is the only mammal capable of true flight?", "answer": "Bat", "answer_note": "Birds and insects also fly, but bats are the only flying mammals.", "category": "animals", "hook": "The flying mammal!"},
    {"question": "How long can a snail sleep in one stretch?", "answer": "3 years", "answer_note": "Snails hibernate during drought and can sleep for up to 3 years waiting for moisture.", "category": "animals", "hook": "The ultimate napper!"},
    {"question": "What animal has rectangular pupils?", "answer": "Goat", "answer_note": "Rectangular pupils give goats nearly 360-degree vision to spot predators.", "category": "animals", "hook": "Weird eyes!"},
    {"question": "How many noses does a slug have?", "answer": "4", "answer_note": "Slugs have four tentacles — two for seeing, two for smelling.", "category": "animals", "hook": "Four times the sniffing!"},
    {"question": "What color is a polar bear's skin?", "answer": "Black", "answer_note": "Their fur is translucent and hollow; the black skin absorbs heat from sunlight.", "category": "animals", "hook": "Not what you'd expect!"},
    {"question": "How do sea otters keep from drifting apart while sleeping?", "answer": "They hold hands", "answer_note": "Groups of sea otters called rafts hold hands to stay together while floating.", "category": "animals", "hook": "The cutest fact ever!"},
    {"question": "What is a group of flamingos called?", "answer": "A flamboyance", "answer_note": "A gathering of flamingos is fittingly called a flamboyance.", "category": "animals", "hook": "The most dramatic group name!"},
    {"question": "Which animal has the longest lifespan?", "answer": "Ocean quahog clam", "answer_note": "One clam named Ming lived to 507 years old, confirmed by counting growth rings.", "category": "animals", "hook": "Older than nations!"},
    {"question": "How far can a skunk's spray travel?", "answer": "10 feet (3 meters)", "answer_note": "Skunks can accurately spray targets up to 10 feet away with precision.", "category": "animals", "hook": "Don't get too close!"},
    {"question": "What is the fastest land animal?", "answer": "Cheetah", "answer_note": "Cheetahs can reach speeds of up to 70-75 mph (112 km/h) in short bursts.", "category": "animals", "hook": "Speed king of the savanna!"},
    {"question": "How many legs does a lobster have?", "answer": "10", "answer_note": "Lobsters are decapods, meaning they have 10 legs including their claws.", "category": "animals", "hook": "Counting crustacean legs!"},
    {"question": "What animal produces silk?", "answer": "Silkworm", "answer_note": "Silkworms are caterpillars of the Bombyx mori moth that spin cocoons of raw silk.", "category": "animals", "hook": "Nature's textile factory!"},
    {"question": "How many teeth can a great white shark grow in its lifetime?", "answer": "Around 20,000", "answer_note": "Sharks constantly replace lost teeth throughout their lives, growing row after row.", "category": "animals", "hook": "Never short of teeth!"},
    {"question": "What animal has the strongest bite force on Earth?", "answer": "Saltwater crocodile", "answer_note": "With a bite force of over 3,700 psi, it far exceeds lions and great white sharks.", "category": "animals", "hook": "Jaw-dropping power!"},
    # SCIENCE
    {"question": "What is the most abundant gas in Earth's atmosphere?", "answer": "Nitrogen", "answer_note": "Nitrogen makes up about 78% of the atmosphere, with oxygen at around 21%.", "category": "science", "hook": "It's not oxygen!"},
    {"question": "How hot is the surface of the Sun?", "answer": "About 5,500°C (9,932°F)", "answer_note": "The Sun's core is even hotter at 15 million degrees Celsius.", "category": "science", "hook": "Unfathomably hot!"},
    {"question": "What is the hardest natural substance on Earth?", "answer": "Diamond", "answer_note": "Diamond rates 10 on the Mohs scale of mineral hardness, the maximum.", "category": "science", "hook": "Nature's toughest material!"},
    {"question": "How many bones are in the human body?", "answer": "206", "answer_note": "Babies are born with about 270 bones that fuse together as they grow.", "category": "science", "hook": "Your inner skeleton!"},
    {"question": "What percentage of the human body is water?", "answer": "About 60%", "answer_note": "The brain and heart are about 73% water, and the lungs are about 83% water.", "category": "science", "hook": "Mostly water!"},
    {"question": "How long does it take light to travel from the Sun to Earth?", "answer": "About 8 minutes", "answer_note": "Sunlight travels 93 million miles at 186,000 miles per second.", "category": "science", "hook": "Old light!"},
    {"question": "What is the smallest planet in our solar system?", "answer": "Mercury", "answer_note": "Mercury is only slightly larger than Earth's Moon.", "category": "science", "hook": "Tiny but mighty!"},
    {"question": "How many colors are in a rainbow?", "answer": "7", "answer_note": "Red, orange, yellow, green, blue, indigo, and violet — Roy G Biv!", "category": "science", "hook": "ROYGBIV!"},
    {"question": "What element has the chemical symbol Au?", "answer": "Gold", "answer_note": "Au comes from the Latin word 'aurum', meaning gold.", "category": "science", "hook": "Ancient element!"},
    {"question": "What is the rarest blood type?", "answer": "AB negative", "answer_note": "Only about 1% of the population has AB negative blood type.", "category": "science", "hook": "One in a hundred!"},
    {"question": "How many chromosomes do humans have?", "answer": "46", "answer_note": "Humans have 23 pairs of chromosomes, totaling 46.", "category": "science", "hook": "The blueprint of life!"},
    {"question": "What is the speed of sound in air?", "answer": "About 343 m/s (767 mph)", "answer_note": "Sound speed varies with temperature and medium — faster in water, even faster in solids.", "category": "science", "hook": "Boom!"},
    {"question": "Which planet has the most moons in our solar system?", "answer": "Saturn", "answer_note": "Saturn has 146 confirmed moons, beating Jupiter which has 95.", "category": "science", "hook": "The moon collector!"},
    {"question": "What is the most common element in the universe?", "answer": "Hydrogen", "answer_note": "Hydrogen makes up about 75% of all normal matter in the universe by mass.", "category": "science", "hook": "Universe's building block!"},
    {"question": "How long is a day on Venus?", "answer": "Longer than a year on Venus", "answer_note": "Venus rotates so slowly that one day is 243 Earth days, but its year is only 225 Earth days.", "category": "science", "hook": "Time works differently there!"},
    # HISTORY
    {"question": "In what year did World War II end?", "answer": "1945", "answer_note": "Germany surrendered in May 1945 and Japan in September 1945, ending the war.", "category": "history", "hook": "The end of a global conflict!"},
    {"question": "Who was the first person to walk on the Moon?", "answer": "Neil Armstrong", "answer_note": "Neil Armstrong stepped onto the Moon on July 20, 1969 during the Apollo 11 mission.", "category": "history", "hook": "One giant leap!"},
    {"question": "How long did the Roman Empire last?", "answer": "About 1,000 years", "answer_note": "The Western Roman Empire fell in 476 AD but the Eastern (Byzantine) Empire lasted until 1453.", "category": "history", "hook": "An empire for the ages!"},
    {"question": "What ancient wonder of the world still stands today?", "answer": "The Great Pyramid of Giza", "answer_note": "Of the Seven Wonders of the Ancient World, only the Great Pyramid has survived intact.", "category": "history", "hook": "Thousands of years standing!"},
    {"question": "In what year did the Berlin Wall fall?", "answer": "1989", "answer_note": "The Berlin Wall fell on November 9, 1989, ending the division of East and West Germany.", "category": "history", "hook": "Tear down this wall!"},
    {"question": "Who invented the telephone?", "answer": "Alexander Graham Bell", "answer_note": "Bell patented the telephone in 1876, though others like Elisha Gray were also close to the invention.", "category": "history", "hook": "Hello, can you hear me?"},
    {"question": "What year did the Titanic sink?", "answer": "1912", "answer_note": "The Titanic struck an iceberg on April 14 and sank April 15, 1912 on her maiden voyage.", "category": "history", "hook": "The unsinkable ship!"},
    {"question": "Which country was the first to give women the right to vote?", "answer": "New Zealand", "answer_note": "New Zealand gave women the right to vote in 1893, ahead of all other countries.", "category": "history", "hook": "Leading the way!"},
    {"question": "How long did the Hundred Years War last?", "answer": "116 years", "answer_note": "The Hundred Years War between England and France lasted from 1337 to 1453.", "category": "history", "hook": "Bad at naming!"},
    {"question": "Who was the youngest US President ever?", "answer": "Theodore Roosevelt", "answer_note": "Roosevelt became president at 42 after McKinley's assassination. JFK was the youngest elected.", "category": "history", "hook": "Young commander-in-chief!"},
    # GEOGRAPHY
    {"question": "What is the largest ocean on Earth?", "answer": "Pacific Ocean", "answer_note": "The Pacific Ocean covers more than 30% of Earth's surface, larger than all land combined.", "category": "geography", "hook": "Bigger than all continents!"},
    {"question": "What is the longest river in the world?", "answer": "Nile River", "answer_note": "The Nile stretches about 4,132 miles (6,650 km) through northeastern Africa.", "category": "geography", "hook": "Ancient waterway!"},
    {"question": "Which country has the most natural lakes?", "answer": "Canada", "answer_note": "Canada contains about 60% of the world's lakes — over 31,000 lakes larger than 3 km².", "category": "geography", "hook": "Lake country!"},
    {"question": "What is the smallest country in the world?", "answer": "Vatican City", "answer_note": "Vatican City covers just 0.44 km² and has a population of around 800 people.", "category": "geography", "hook": "Tiny nation!"},
    {"question": "How tall is Mount Everest?", "answer": "8,849 meters (29,032 feet)", "answer_note": "The 2020 survey revised the height to 8,848.86m, generally rounded up.", "category": "geography", "hook": "Roof of the world!"},
    {"question": "What is the driest place on Earth?", "answer": "Atacama Desert, Chile", "answer_note": "Some parts of the Atacama haven't received rainfall in over 500 years.", "category": "geography", "hook": "Not a drop of rain!"},
    {"question": "Which continent is the largest?", "answer": "Asia", "answer_note": "Asia covers about 44.6 million km², making it the world's largest continent.", "category": "geography", "hook": "Massive landmass!"},
    {"question": "What is the deepest lake in the world?", "answer": "Lake Baikal", "answer_note": "Baikal in Siberia is 1,642 meters (5,387 feet) deep and holds 20% of Earth's fresh surface water.", "category": "geography", "hook": "Deep Siberian secret!"},
    # FOOD & CULTURE
    {"question": "What fruit is known as the king of fruits?", "answer": "Durian", "answer_note": "The durian is beloved in Southeast Asia but infamous for its powerful smell.", "category": "food", "hook": "Love it or hate it!"},
    {"question": "How many cups of coffee are consumed worldwide daily?", "answer": "About 2 billion", "answer_note": "Coffee is one of the most popular beverages globally after water and tea.", "category": "food", "hook": "The world runs on coffee!"},
    {"question": "What is the most expensive spice in the world?", "answer": "Saffron", "answer_note": "Saffron requires over 75,000 crocus flowers per pound and sells for thousands of dollars.", "category": "food", "hook": "Worth its weight in gold!"},
    {"question": "Which country invented pizza?", "answer": "Italy", "answer_note": "Modern pizza originated in Naples, Italy in the 18th–19th century.", "category": "food", "hook": "Grazie Italia!"},
    {"question": "How long does it take to hard-boil an egg?", "answer": "10–12 minutes", "answer_note": "At sea level, 10 minutes yields a fully set yolk. At altitude it takes longer.", "category": "food", "hook": "Kitchen science!"},
    # HUMAN BODY
    {"question": "How many muscles does it take to smile?", "answer": "About 12", "answer_note": "It takes roughly 12 muscles to smile and 11 to frown, though estimates vary.", "category": "body", "hook": "Smile muscles!"},
    {"question": "How long is the human small intestine?", "answer": "About 6 meters (20 feet)", "answer_note": "The small intestine is tightly coiled to fit inside the abdomen.", "category": "body", "hook": "A lot of gut!"},
    {"question": "How many times does the human heart beat per day?", "answer": "About 100,000 times", "answer_note": "The average heart beats 60–100 times per minute, around 100,000 times per day.", "category": "body", "hook": "Non-stop pump!"},
    {"question": "What is the largest organ in the human body?", "answer": "Skin", "answer_note": "The skin covers about 2 square meters and weighs around 3–4 kg in adults.", "category": "body", "hook": "You're wearing it!"},
    {"question": "How fast does a sneeze travel?", "answer": "Up to 100 mph (160 km/h)", "answer_note": "Sneezes expel air at extremely high speed along with thousands of droplets.", "category": "body", "hook": "Achoo at speed!"},
    {"question": "How many brain cells does the average human have?", "answer": "About 86 billion neurons", "answer_note": "The human brain has roughly 86 billion neurons connected by trillions of synapses.", "category": "body", "hook": "Incredible computing power!"},
    {"question": "How long does it take for a fingernail to fully grow back?", "answer": "3–6 months", "answer_note": "Fingernails grow about 3.5 mm per month; toenails grow slower at about 1.5 mm per month.", "category": "body", "hook": "Patient nail watchers!"},
    # SPACE
    {"question": "How many Earth-sized planets could fit inside the Sun?", "answer": "About 1.3 million", "answer_note": "The Sun's volume is so enormous that over a million Earths could fit inside it.", "category": "space", "hook": "The Sun is enormous!"},
    {"question": "What is the closest star to Earth besides the Sun?", "answer": "Proxima Centauri", "answer_note": "Proxima Centauri is about 4.24 light-years away from Earth.", "category": "space", "hook": "Our nearest stellar neighbor!"},
    {"question": "How old is the universe?", "answer": "About 13.8 billion years", "answer_note": "Scientists estimate the universe began with the Big Bang 13.8 billion years ago.", "category": "space", "hook": "Ancient beyond imagination!"},
    {"question": "What is the Great Red Spot on Jupiter?", "answer": "A massive storm", "answer_note": "Jupiter's Great Red Spot is a storm larger than Earth that has raged for at least 350 years.", "category": "space", "hook": "A storm that never ends!"},
    {"question": "How many moons does Earth have?", "answer": "1", "answer_note": "Earth has one natural satellite, simply called the Moon, with a diameter of 3,474 km.", "category": "space", "hook": "Just one big Moon!"},
    {"question": "What would happen if you removed all empty space from human atoms?", "answer": "All humans would fit in a sugar cube", "answer_note": "Atoms are mostly empty space — if removed, all 8 billion humans would fit in a sugar cube.", "category": "space", "hook": "Mind-bending physics!"},
    # TECHNOLOGY
    {"question": "In what year was the first iPhone released?", "answer": "2007", "answer_note": "Steve Jobs unveiled the original iPhone on January 9, 2007.", "category": "technology", "hook": "Changed everything!"},
    {"question": "What does WWW stand for?", "answer": "World Wide Web", "answer_note": "Tim Berners-Lee invented the World Wide Web in 1989 at CERN.", "category": "technology", "hook": "The web of webs!"},
    {"question": "How many emails are sent every day worldwide?", "answer": "About 333 billion", "answer_note": "Over 333 billion emails are sent and received every day globally as of recent estimates.", "category": "technology", "hook": "Inbox overload!"},
    {"question": "What was the first video game ever created?", "answer": "Tennis for Two (1958)", "answer_note": "Tennis for Two was created by physicist William Higinbotham on an oscilloscope in 1958.", "category": "technology", "hook": "The origin of gaming!"},
    {"question": "How much data does the human brain store?", "answer": "About 2.5 petabytes", "answer_note": "Scientists estimate the human brain's storage capacity at about 2.5 million gigabytes.", "category": "technology", "hook": "The ultimate hard drive!"},
    # RANDOM & WEIRD
    {"question": "What is the fear of long words called?", "answer": "Hippopotomonstrosesquippedaliophobia", "answer_note": "Ironically, the fear of long words is itself one of the longest words in English.", "category": "random", "hook": "Meta-ironic!"},
    {"question": "How fast do fingernails grow compared to toenails?", "answer": "3 times faster", "answer_note": "Fingernails grow about 3.5mm per month while toenails grow only about 1.5mm per month.", "category": "random", "hook": "Keep clipping!"},
    {"question": "What is the world's most widely spoken language?", "answer": "Mandarin Chinese", "answer_note": "Mandarin has about 1.1 billion native speakers, far more than any other language.", "category": "random", "hook": "A billion speakers!"},
    {"question": "How many languages are spoken in the world?", "answer": "About 7,000", "answer_note": "Linguists estimate there are between 6,500 and 7,000 living languages worldwide.", "category": "random", "hook": "Lost in translation!"},
    {"question": "What is the most played song in history?", "answer": "Happy Birthday to You", "answer_note": "Happy Birthday to You is sung millions of times daily worldwide and is one of the most recognized songs.", "category": "random", "hook": "You've heard it a thousand times!"},
    {"question": "How long would it take to drive to the Moon?", "answer": "About 130 days", "answer_note": "At highway speed (70 mph), the 238,855-mile trip would take about 130 days nonstop.", "category": "random", "hook": "Pack snacks!"},
    {"question": "What is the most common surname in the world?", "answer": "Wang", "answer_note": "Wang is the most common surname globally due to China's enormous population.", "category": "random", "hook": "Hello, Mr. Wang!"},
    {"question": "How old is the oldest known piece of chewing gum?", "answer": "About 9,000 years old", "answer_note": "Ancient birch bark tar chewing pieces have been found in Scandinavia dating back 9,000 years.", "category": "random", "hook": "Ancient chewer!"},
    {"question": "How many dimples does a golf ball have?", "answer": "Between 300 and 500", "answer_note": "Most golf balls have 336 dimples, though regulation allows a range.", "category": "random", "hook": "Not smooth at all!"},
    {"question": "What letter is not on the periodic table?", "answer": "J", "answer_note": "J is the only letter of the alphabet not used as a chemical symbol on the periodic table.", "category": "random", "hook": "The odd one out!"},
    {"question": "How many steps does the average person walk in a lifetime?", "answer": "About 100 million steps", "answer_note": "The average person walks about 100 million steps in a lifetime, or roughly 65,000 miles.", "category": "random", "hook": "Walk the Earth!"},
    {"question": "What country has the most pyramids?", "answer": "Sudan", "answer_note": "Sudan has about 200–255 pyramids, far more than Egypt which has around 130.", "category": "random", "hook": "Not Egypt!"},
    {"question": "How long is a day on Mars?", "answer": "24 hours and 37 minutes", "answer_note": "A Martian day (sol) is very close to Earth's at 24 hours and 37 minutes.", "category": "random", "hook": "Almost like home!"},
    {"question": "What is the national animal of Scotland?", "answer": "Unicorn", "answer_note": "The unicorn has been Scotland's national animal since the 12th century, symbolizing power and purity.", "category": "random", "hook": "Mythical national pride!"},
    {"question": "How many teeth does an adult human have?", "answer": "32", "answer_note": "Adults have 32 teeth including 4 wisdom teeth, though many people have these removed.", "category": "random", "hook": "Count them!"},
    {"question": "How far can a kangaroo jump in a single leap?", "answer": "Up to 9 meters (30 feet)", "answer_note": "Red kangaroos can leap up to 9 meters and clear 3-meter fences.", "category": "random", "hook": "Incredible leaper!"},
    {"question": "What is the most common phobia?", "answer": "Arachnophobia (fear of spiders)", "answer_note": "Fear of spiders affects up to 30% of the population worldwide.", "category": "random", "hook": "Eight legs of terror!"},
    {"question": "How long has chess been played?", "answer": "Over 1,500 years", "answer_note": "Chess originated in India around 500 AD and spread through Persia and then Europe.", "category": "random", "hook": "Ancient game of kings!"},
    {"question": "What is the world's bestselling book of all time?", "answer": "The Bible", "answer_note": "The Bible has sold an estimated 5 billion copies, making it by far the bestselling book in history.", "category": "random", "hook": "Timeless bestseller!"},
    {"question": "How fast can a hummingbird flap its wings?", "answer": "50–80 times per second", "answer_note": "The sound of a hummingbird's hum comes from the rapid wing beats, up to 80 per second.", "category": "random", "hook": "Tiny turbines!"},
    {"question": "What is the most visited tourist attraction in the world?", "answer": "The Great Wall of China", "answer_note": "The Great Wall attracts over 10 million tourists annually, more than any other attraction.", "category": "random", "hook": "Wall of wonder!"},
    {"question": "How long can a cockroach live without its head?", "answer": "Up to a week", "answer_note": "Cockroaches breathe through spiracles in their body segments, not their heads.", "category": "random", "hook": "Creepy survivor!"},
]

for i, item in enumerate(new_items):
    item["id"] = f"ff_{next_n + i:04d}"

result = existing + new_items
json.dump(result, open(F, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"funfacts: {len(existing)} -> {len(result)} items (+{len(new_items)})")
