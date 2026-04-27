import json
from pathlib import Path

F = Path("C:/Users/prawn/OneDrive/Documents/djamies1.github.io/wouldyourather/questions.json")
existing = json.load(open(F, encoding="utf-8"))
ids = [int(x["id"].split("_")[-1]) for x in existing if x.get("id","").startswith("wyr_")]
next_n = max(ids, default=0) + 1

new_items = [
    # SKILLS
    {"option_a": "Be able to speak every language fluently", "option_b": "Be able to play every musical instrument perfectly", "category": "skills", "hook": "Communication or expression?", "debate_note": "Languages connect you to billions; instruments let you express yourself universally."},
    {"option_a": "Have perfect aim with anything you throw", "option_b": "Never miss a shot in any sport you play", "category": "skills", "hook": "Throwing vs sport?", "debate_note": "Perfect aim could be useful in daily life; perfect sport shots only helps in games."},
    {"option_a": "Be able to speed read 10x faster", "option_b": "Have a perfect photographic memory", "category": "skills", "hook": "Reading vs memory?", "debate_note": "Speed reading gets through content fast; photographic memory retains everything forever."},
    {"option_a": "Be an expert chef who can cook any dish", "option_b": "Be able to eat anything without getting full or gaining weight", "category": "skills", "hook": "Cooking vs eating?", "debate_note": "Master chef impresses others; unlimited eating is pure personal pleasure."},
    {"option_a": "Be able to type 200 words per minute perfectly", "option_b": "Be able to write code fluently in any programming language", "category": "skills", "hook": "Speed or coding?", "debate_note": "Ultra-fast typing helps everyone; coding mastery unlocks a career and creativity."},
    {"option_a": "Always know when someone is lying to you", "option_b": "Be able to convince anyone of anything you say", "category": "skills", "hook": "Detect or persuade?", "debate_note": "Lie detection protects you; persuasion powers let you influence the world."},
    {"option_a": "Be fluent in all programming languages", "option_b": "Have complete mastery over every art form", "category": "skills", "hook": "Tech or art?", "debate_note": "Coding builds the future; art enriches the human experience."},
    # SUPERPOWERS
    {"option_a": "Be immune to all diseases", "option_b": "Never need to sleep", "category": "superpowers", "hook": "Health or time?", "debate_note": "Immunity means a longer, healthier life; no sleep gives you 8 extra hours every day."},
    {"option_a": "Have the ability to breathe underwater", "option_b": "Be able to survive in outer space without a suit", "category": "superpowers", "hook": "Ocean or space?", "debate_note": "Breathing underwater opens the deep ocean; surviving space lets you visit other worlds."},
    {"option_a": "Control the weather", "option_b": "Control gravity", "category": "superpowers", "hook": "Weather or gravity?", "debate_note": "Weather control shapes global events; gravity control lets you fly and lift anything."},
    {"option_a": "Have superhuman strength (lift 100 tons)", "option_b": "Have superhuman speed (run at 1000 mph)", "category": "superpowers", "hook": "Strong or fast?", "debate_note": "Strength lets you move mountains; speed lets you travel anywhere instantly."},
    {"option_a": "Be able to copy any skill after watching it once", "option_b": "Be able to learn any subject in a single day", "category": "superpowers", "hook": "Copy or learn?", "debate_note": "Copying skills works in real time; learning any subject builds deep expertise."},
    {"option_a": "Have the power to heal others instantly", "option_b": "Have the power to restore any object to its original condition", "category": "superpowers", "hook": "Heal people or objects?", "debate_note": "Healing saves lives; restoration saves priceless objects and reduces waste."},
    # LIFESTYLE
    {"option_a": "Live in a penthouse in the world's most exciting city", "option_b": "Live in a cabin in the most beautiful natural landscape on Earth", "category": "lifestyle", "hook": "City or nature?", "debate_note": "Penthouse life buzzes with culture and people; cabin life brings peace and beauty."},
    {"option_a": "Work from home forever", "option_b": "Travel to a new country every week for work", "category": "lifestyle", "hook": "Home comfort or global travel?", "debate_note": "Home office gives stability; constant travel is exciting but exhausting."},
    {"option_a": "Have unlimited free time but no money", "option_b": "Have unlimited money but only 1 hour of free time per day", "category": "lifestyle", "hook": "Time or money?", "debate_note": "Free time is the ultimate luxury; but without money you can't enjoy much of it."},
    {"option_a": "Live without the internet for a year", "option_b": "Live without air conditioning or heating for a year", "category": "lifestyle", "hook": "Tech or comfort?", "debate_note": "No internet feels unthinkable; no temperature control could be genuinely dangerous."},
    {"option_a": "Only be able to wear one outfit forever", "option_b": "Only be able to eat one meal forever", "category": "lifestyle", "hook": "Fashion or food?", "debate_note": "One outfit is embarrassing; one meal gets boring but at least nutrition varies."},
    {"option_a": "Have a personal butler for the rest of your life", "option_b": "Have a personal chef for the rest of your life", "category": "lifestyle", "hook": "Service or food?", "debate_note": "A butler handles every task; a chef handles every meal — both are luxury."},
    # SOCIAL
    {"option_a": "Be incredibly popular but have no close friends", "option_b": "Have one absolutely perfect best friend but be ignored by everyone else", "category": "social", "hook": "Popularity or depth?", "debate_note": "Popularity feels good but is shallow; one true friend can sustain you."},
    {"option_a": "Always say exactly what you think", "option_b": "Always know the perfect thing to say in any situation", "category": "social", "hook": "Honesty or tact?", "debate_note": "Brutal honesty can damage relationships; perfect words make you socially invincible."},
    {"option_a": "Never have to make small talk again", "option_b": "Always have something interesting to say to anyone", "category": "social", "hook": "Avoid awkwardness or master it?", "debate_note": "Skipping small talk saves time; having something to say wins every room."},
    {"option_a": "Have your dream partner but no friends", "option_b": "Have the best friend group ever but never find a romantic partner", "category": "social", "hook": "Love or friendship?", "debate_note": "One perfect partner for life vs a lifetime of deep platonic connection."},
    # PHYSICAL
    {"option_a": "Be able to run a marathon without training or fatigue", "option_b": "Be able to lift twice your body weight effortlessly", "category": "physical", "hook": "Endurance or strength?", "debate_note": "Marathon endurance lets you go forever; strength lets you do anything heavy."},
    {"option_a": "Have six-pack abs always without exercise", "option_b": "Have perfect teeth without ever needing dental work", "category": "physical", "hook": "Aesthetic abs or dental perfection?", "debate_note": "Abs are visual; perfect teeth affect health, speech, and confidence daily."},
    {"option_a": "Be naturally gifted at every sport you try", "option_b": "Be naturally gifted at every creative hobby you try", "category": "physical", "hook": "Sports or creativity?", "debate_note": "Sports talent impresses; creative talent produces art, music, and beauty."},
    # ABSURD
    {"option_a": "Every time you sneeze you teleport to a random location on Earth", "option_b": "Every time you laugh you grow 1cm taller permanently", "category": "absurd", "hook": "Sneeze chaos or laugh growth?", "debate_note": "Random teleporting is chaotic; laughing yourself to extreme heights is weird but controllable."},
    {"option_a": "Have a penguin follow you everywhere for the rest of your life", "option_b": "Have a parrot that tells embarrassing truths about you in public", "category": "absurd", "hook": "Penguin or honest parrot?", "debate_note": "A penguin is adorable but inconvenient; a parrot ruins your reputation."},
    {"option_a": "Only be able to communicate by singing", "option_b": "Only be able to move by skipping", "category": "absurd", "hook": "Sing or skip?", "debate_note": "Singing communication is musical chaos; skipping everywhere would get tiring fast."},
    {"option_a": "Everything you sit on makes a fart sound", "option_b": "Every time you walk into a room, dramatic music plays", "category": "absurd", "hook": "Fart sounds or dramatic entrance?", "debate_note": "Fart sounds are mortifying; dramatic music makes every arrival cinematic."},
    # MORAL
    {"option_a": "Save one person you love from certain death", "option_b": "Save 100 strangers from certain death", "category": "moral", "hook": "Love or duty?", "debate_note": "The classic trolley problem of personal vs collective moral duty."},
    {"option_a": "Know the exact day you will die", "option_b": "Know the exact cause of your death but not when", "category": "moral", "hook": "When or why?", "debate_note": "Knowing when lets you prepare; knowing cause lets you avoid certain behaviors."},
    {"option_a": "Have the power to end all war but lose all your memories", "option_b": "Keep your memories but the world continues as it is", "category": "moral", "hook": "Sacrifice for peace?", "debate_note": "Would you erase yourself to save millions? The ultimate selfless choice."},
    # FOOD
    {"option_a": "Everything you eat tastes like your favourite food", "option_b": "You can eat absolutely anything without any negative health effects", "category": "food", "hook": "Taste or freedom?", "debate_note": "Same great taste forever vs eat junk with zero consequences."},
    {"option_a": "Never eat sugar again", "option_b": "Never eat salt again", "category": "food", "hook": "No sugar or no salt?", "debate_note": "No sugar cuts dessert; no salt makes almost all savoury food taste flat."},
    {"option_a": "Only drink water for a year", "option_b": "Only eat one type of cuisine for a year", "category": "food", "hook": "Plain drinks or repetitive food?", "debate_note": "Only water is boring but healthy; one cuisine gets monotonous but flavorful."},
    {"option_a": "Get $1,000 every time you eat a vegetable you hate", "option_b": "Get $100 every time you eat something delicious", "category": "food", "hook": "Pain for profit or pleasure for pennies?", "debate_note": "Hate-eating vegetables hurts but pays well; delicious eating pays little."},
    # MENTAL
    {"option_a": "Be able to pause time for 1 hour per day", "option_b": "Be able to go back in time 1 minute, unlimited times", "category": "mental", "hook": "Pause or rewind?", "debate_note": "A pause gives you personal time; 1-minute rewinds let you redo any mistake endlessly."},
    {"option_a": "Have a brain that never forgets anything ever", "option_b": "Have a brain that can perfectly estimate any probability or chance", "category": "mental", "hook": "Memory or prediction?", "debate_note": "Perfect recall stores everything; perfect probability sense helps you gamble, invest, and decide."},
    {"option_a": "Have complete control over your dreams every night", "option_b": "Be able to see anyone else's dreams while they sleep", "category": "mental", "hook": "Control your dreams or spy on others?", "debate_note": "Dream control makes sleep an adventure; seeing others' dreams is fascinating but voyeuristic."},
    {"option_a": "Never feel boredom", "option_b": "Never feel anxiety", "category": "mental", "hook": "Boredom or anxiety?", "debate_note": "Boredom drives procrastination; anxiety drives stress and overthinking — which is worse for you?"},
    {"option_a": "Know the answer to any question you ask but you can only ask 3 questions a day", "option_b": "Get a good hint toward any answer but unlimited questions daily", "category": "mental", "hook": "Precision or volume?", "debate_note": "3 perfect answers vs unlimited good-but-imperfect hints — quality vs quantity."},
    # NEW CATEGORIES
    {"option_a": "Be able to hear any conversation happening anywhere in the world right now", "option_b": "Be able to see any place in the world as if you were standing there", "category": "superpowers", "hook": "Hear or see the world?", "debate_note": "Hearing gives information; seeing gives visual surveillance of anywhere."},
    {"option_a": "Always arrive exactly on time no matter what", "option_b": "Never have to wait in any queue or line again", "category": "lifestyle", "hook": "Perfect timing or no queuing?", "debate_note": "Perfect timing impresses everyone; no queues saves hours of your life annually."},
    {"option_a": "Have a robot do all your household chores", "option_b": "Have a personal assistant manage all your admin and emails", "category": "lifestyle", "hook": "Physical chores or admin tasks?", "debate_note": "Cleaning robots are useful; admin help frees mental bandwidth and time."},
    {"option_a": "Be able to instantly translate any written text you see", "option_b": "Be able to instantly understand any spoken language you hear", "category": "skills", "hook": "Read or listen in any language?", "debate_note": "Reading translation helps with signs and documents; spoken comprehension helps in conversation."},
    {"option_a": "Have a supercomputer-level brain but look average", "option_b": "Look like the most beautiful person in the world but have average intelligence", "category": "mental", "hook": "Brains or beauty?", "debate_note": "Intelligence builds wealth and solutions; beauty opens social doors and opportunities."},
]

for i, item in enumerate(new_items):
    item["id"] = f"wyr_{next_n + i:04d}"

result = existing + new_items
json.dump(result, open(F, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"wouldyourather: {len(existing)} -> {len(result)} (+{len(new_items)})")
