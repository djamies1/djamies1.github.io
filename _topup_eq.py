import json
from pathlib import Path

F = Path("C:/Users/prawn/OneDrive/Documents/djamies1.github.io/emojiquiz/questions.json")
existing = json.load(open(F, encoding="utf-8"))
ids = [int(x["id"].split("_")[-1]) for x in existing if x.get("id","").startswith("eq_")]
next_n = max(ids, default=0) + 1

new_items = [
    # MOVIES
    {"emojis": "🏴‍☠️☠️🗺️🪙", "answer": "Pirates of the Caribbean", "category": "movies", "hook": "Savvy?"},
    {"emojis": "🤖❤️🌱", "answer": "WALL-E", "category": "movies", "hook": "Adorable robot love story!"},
    {"emojis": "🐠🔵🌊🔍", "answer": "Finding Dory", "category": "movies", "hook": "Just keep swimming!"},
    {"emojis": "🧠💭🎨🎪", "answer": "Inside Out", "category": "movies", "hook": "Emotions run the show!"},
    {"emojis": "🚂🌙👶👴", "answer": "The Curious Case of Benjamin Button", "category": "movies", "hook": "Aging in reverse!"},
    {"emojis": "🌍🤝🛸👽", "answer": "E.T. the Extra-Terrestrial", "category": "movies", "hook": "Phone home!"},
    {"emojis": "🦁🐻🐷🎶", "answer": "The Jungle Book", "category": "movies", "hook": "Bare necessities!"},
    {"emojis": "🎭👹🏰🌹", "answer": "Phantom of the Opera", "category": "movies", "hook": "Mask on!"},
    {"emojis": "🐺🌕🧛‍♂️💘", "answer": "Twilight", "category": "movies", "hook": "Team Edward or Team Jacob?"},
    {"emojis": "🧊🏔️🐻‍❄️🎣", "answer": "Ice Age", "category": "movies", "hook": "Glacial adventure!"},
    {"emojis": "🦅🕊️🪶🏞️", "answer": "Dances with Wolves", "category": "movies", "hook": "Kevin Costner western epic!"},
    {"emojis": "🤠🐍🧳🔫", "answer": "Indiana Jones", "category": "movies", "hook": "I hate snakes!"},
    {"emojis": "🎪🤹🎠🔮", "answer": "The Greatest Showman", "category": "movies", "hook": "This is me!"},
    {"emojis": "🌙🧚✨🏝️", "answer": "Peter Pan", "category": "movies", "hook": "Second star to the right!"},
    {"emojis": "🦁🐯🐘🎠", "answer": "Madagascar", "category": "movies", "hook": "I like to move it!"},
    {"emojis": "🧲🔩👨‍🔬🤖", "answer": "Ironman", "category": "movies", "hook": "I am Iron Man!"},
    {"emojis": "🌌⚡🔨👑", "answer": "Thor", "category": "movies", "hook": "God of Thunder!"},
    {"emojis": "🕶️🧬🌆🦸‍♂️", "answer": "Black Panther", "category": "movies", "hook": "Wakanda Forever!"},
    {"emojis": "🌊🏄🌺🤙", "answer": "Moana", "category": "movies", "hook": "How far I'll go!"},
    {"emojis": "🐝👑🌺🍯", "answer": "Bee Movie", "category": "movies", "hook": "According to all known laws of aviation..."},
    # SONGS
    {"emojis": "🌃🎹🎵💔", "answer": "Piano Man", "category": "songs", "hook": "Billy Joel classic!"},
    {"emojis": "🌹🥀💔🎸", "answer": "Every Rose Has Its Thorn", "category": "songs", "hook": "Poison power ballad!"},
    {"emojis": "🎸🔥🌡️❤️", "answer": "Hot Blooded", "category": "songs", "hook": "Foreigner classic!"},
    {"emojis": "🐅🎶🔥", "answer": "Eye of the Tiger", "category": "songs", "hook": "Survivor's Rocky anthem!"},
    {"emojis": "🌙🎵🛸🌌", "answer": "Space Oddity", "category": "songs", "hook": "David Bowie!"},
    {"emojis": "🤞✌️💫🎤", "answer": "I Will Survive", "category": "songs", "hook": "Gloria Gaynor disco anthem!"},
    {"emojis": "🔔🎄❄️🛷", "answer": "Jingle Bell Rock", "category": "songs", "hook": "Christmas classic!"},
    {"emojis": "🌊🤿🌴🌅", "answer": "Margaritaville", "category": "songs", "hook": "Jimmy Buffett island life!"},
    {"emojis": "👑🎵💎🎤", "answer": "Diamonds", "category": "songs", "hook": "Rihanna's shining hit!"},
    {"emojis": "🏙️🌆🎷🎵", "answer": "New York New York", "category": "songs", "hook": "If I can make it there..."},
    {"emojis": "🚀🛸⭐🌌", "answer": "Rocket Man", "category": "songs", "hook": "Elton John!"},
    {"emojis": "🌊🎵🎶💙", "answer": "Ocean Eyes", "category": "songs", "hook": "Billie Eilish debut!"},
    {"emojis": "🌈🎵🦋", "answer": "Over the Rainbow", "category": "songs", "hook": "Judy Garland classic!"},
    {"emojis": "🎸⚡🔥🤘", "answer": "Back in Black", "category": "songs", "hook": "AC/DC comeback!"},
    {"emojis": "🌙💫🎸🎶", "answer": "Hotel California", "category": "songs", "hook": "Eagles masterpiece!"},
    # TV SHOWS
    {"emojis": "🏥🍸🎭😂", "answer": "Scrubs", "category": "tv", "hook": "Sacred Heart Hospital!"},
    {"emojis": "🧪🏫🎒👨‍🏫", "answer": "Breaking Bad", "category": "tv", "hook": "Mr. White!"},
    {"emojis": "🔍🚗💀🌵", "answer": "True Detective", "category": "tv", "hook": "Detective drama!"},
    {"emojis": "🧟‍♂️⚔️🏰🔥", "answer": "Game of Thrones", "category": "tv", "hook": "Dracarys!"},
    {"emojis": "🤖🌐💻🕵️", "answer": "Person of Interest", "category": "tv", "hook": "You are being watched!"},
    {"emojis": "🐉🏔️⚔️🏹", "answer": "The Witcher", "category": "tv", "hook": "Toss a coin!"},
    {"emojis": "🌍🦸‍♀️⚡💪", "answer": "Supergirl", "category": "tv", "hook": "Girl of Steel!"},
    {"emojis": "🕵️‍♂️🎩🔬🔍", "answer": "Sherlock", "category": "tv", "hook": "Elementary!"},
    {"emojis": "🎲🃏🎰💰", "answer": "Poker Face", "category": "tv", "hook": "Can't read her!"},
    {"emojis": "🦅🌲🔫🤠", "answer": "Yellowstone", "category": "tv", "hook": "Montana ranch drama!"},
    # GEOGRAPHY
    {"emojis": "🌸⛩️🏔️🦌", "answer": "Japan", "category": "geography", "hook": "Land of Sakura!"},
    {"emojis": "🦁🌍🏃‍♂️🥁", "answer": "Kenya", "category": "geography", "hook": "East African runner!"},
    {"emojis": "🌮🌵🎭🏜️", "answer": "Mexico", "category": "geography", "hook": "Viva Mexico!"},
    {"emojis": "🍁🏒🐻🌲", "answer": "Canada", "category": "geography", "hook": "Oh Canada!"},
    {"emojis": "🕌🐪☀️🌊", "answer": "Egypt", "category": "geography", "hook": "Land of pharaohs!"},
    {"emojis": "🌺🌊🎸🤙", "answer": "Hawaii", "category": "geography", "hook": "Aloha!"},
    {"emojis": "🍕🛵⛲🌞", "answer": "Italy", "category": "geography", "hook": "La dolce vita!"},
    {"emojis": "🧉🎶💃🥩", "answer": "Argentina", "category": "geography", "hook": "Tango!"},
    {"emojis": "🐉🌾🏯🌸", "answer": "China", "category": "geography", "hook": "The Middle Kingdom!"},
    {"emojis": "🦒🌅🏔️☕", "answer": "Ethiopia", "category": "geography", "hook": "Coffee's birthplace!"},
    # ANIMALS
    {"emojis": "🐬🌊🎵💙", "answer": "Dolphin", "category": "animals", "hook": "Ocean acrobats!"},
    {"emojis": "🦅🌤️🏔️", "answer": "Eagle", "category": "animals", "hook": "King of the skies!"},
    {"emojis": "🐝🌼🍯⬡", "answer": "Bee", "category": "animals", "hook": "Honey makers!"},
    {"emojis": "🦁👑🌾😤", "answer": "Lion", "category": "animals", "hook": "King of the jungle!"},
    {"emojis": "🦋🌸🌈✨", "answer": "Butterfly", "category": "animals", "hook": "Beautiful transformation!"},
    {"emojis": "🐌🐚🌿🐢", "answer": "Snail", "category": "animals", "hook": "Slow and steady!"},
    {"emojis": "🦩🩷🌅🐟", "answer": "Flamingo", "category": "animals", "hook": "Pink and fabulous!"},
    {"emojis": "🦊🧡🌲🍂", "answer": "Fox", "category": "animals", "hook": "Cunning forest dweller!"},
    {"emojis": "🐧❄️🐟🎉", "answer": "Penguin", "category": "animals", "hook": "Tuxedo birds!"},
    {"emojis": "🦑🌊🎨👀", "answer": "Squid", "category": "animals", "hook": "Ink master!"},
    # FOOD
    {"emojis": "🥑🌮🍋🧂", "answer": "Guacamole", "category": "food", "hook": "Green gold!"},
    {"emojis": "🍜🍲🌶️🥢", "answer": "Pho", "category": "food", "hook": "Vietnamese noodle soup!"},
    {"emojis": "🥞🍓🍦🍫", "answer": "Crepes", "category": "food", "hook": "French thin pancakes!"},
    {"emojis": "🫕🌽🥩🌶️", "answer": "Chili", "category": "food", "hook": "Spicy comfort food!"},
    {"emojis": "🥚🧈🍞🧀", "answer": "Omelette", "category": "food", "hook": "Breakfast favorite!"},
    {"emojis": "🫐🥛🥣", "answer": "Blueberry Smoothie", "category": "food", "hook": "Purple power!"},
    {"emojis": "🧁🎂🕯️🎉", "answer": "Birthday Cake", "category": "food", "hook": "Make a wish!"},
    {"emojis": "🥩🧄🌿🔥", "answer": "Garlic Steak", "category": "food", "hook": "Sizzling!"},
    {"emojis": "🍰🍓❤️", "answer": "Strawberry Cheesecake", "category": "food", "hook": "Dessert perfection!"},
    {"emojis": "🧆🥙🌯🧄", "answer": "Falafel Wrap", "category": "food", "hook": "Middle Eastern classic!"},
]

for i, item in enumerate(new_items):
    item["id"] = f"eq_{next_n + i:04d}"

result = existing + new_items
json.dump(result, open(F, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"emojiquiz: {len(existing)} -> {len(result)} (+{len(new_items)})")
