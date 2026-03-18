import json
import os
import sys

CROPS = {
    "Arugula": {
        "emoji": "🥬",
        "depth": "1/8 in",
        "spacing": "6 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "35-45 days",
        "tip": "Bolts quickly in heat; succession sow every 2-3 weeks for continuous harvest.",
        "difficulty": "Easy",
        "germ_temp": "40-70°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Light nitrogen; minimal feeding needed.",
        "companions": [
            "Beans",
            "Carrots",
            "Onions"
        ],
        "avoid": [
            "Fennel"
        ],
        "pests": [
            "Flea Beetles",
            "Aphids",
            "Cabbage Worm"
        ],
        "harvest_cues": "Leaves 2-3 inches; harvest before flowering for mildest flavor.",
        "storage": "Fridge up to 5 days; keep dry.",
        "varieties": [
            "Astro",
            "Roquette",
            "Sylvetta (wild)"
        ]
    },
    "Asparagus": {
        "emoji": "🌿",
        "depth": "6-8 in (crown)",
        "spacing": "18 in",
        "water": "1-2 in/week",
        "sun": "Full sun",
        "days": "2-3 years to first harvest",
        "tip": "Plant 1- or 2-year crowns; don't harvest first 2 years to build root strength.",
        "difficulty": "Moderate",
        "germ_temp": "N/A (plant crowns)",
        "soil_ph": "6.5-7.0",
        "fertilizer": "Heavy feeder; balanced spring + phosphorus after harvest season.",
        "companions": [
            "Tomatoes",
            "Parsley",
            "Basil"
        ],
        "avoid": [
            "Garlic",
            "Onions",
            "Potatoes"
        ],
        "pests": [
            "Asparagus Beetle",
            "Aphids",
            "Fusarium Crown Rot"
        ],
        "harvest_cues": "Spears 6-8 inches, pencil-thick; snap at base. Harvest 2-4 weeks (young bed).",
        "storage": "Fridge upright in water up to 5 days.",
        "varieties": [
            "Jersey Knight",
            "Mary Washington",
            "Purple Passion"
        ]
    },
    "Avocados": {
        "emoji": "🥑",
        "depth": "N/A (tree)",
        "spacing": "20-30 ft",
        "water": "Deep, 2x/week",
        "sun": "Full sun",
        "days": "3-4 years",
        "tip": "Zones 9-11 only — protect from frost when young.",
        "difficulty": "Hard",
        "germ_temp": "N/A",
        "soil_ph": "6.0-6.5",
        "fertilizer": "Balanced citrus/avocado fertilizer 3x per year.",
        "companions": [
            "Comfrey",
            "Nasturtiums"
        ],
        "avoid": [],
        "pests": [
            "Persea Mite",
            "Thrips",
            "Root Rot"
        ],
        "harvest_cues": "N/A",
        "storage": "N/A",
        "varieties": [
            "Hass",
            "Fuerte",
            "Reed"
        ]
    },
    "Basil": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "10-12 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "25-35 days",
        "tip": "Pinch flowers to keep leaves coming.",
        "difficulty": "Easy",
        "germ_temp": "65-85°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Light balanced; avoid high nitrogen (reduces flavor).",
        "companions": [
            "Tomatoes",
            "Peppers",
            "Marigolds"
        ],
        "avoid": [
            "Sage",
            "Fennel"
        ],
        "pests": [
            "Aphids",
            "Slugs",
            "Japanese Beetles"
        ],
        "harvest_cues": "Pinch above leaf node; harvest before flowering.",
        "storage": "Store in water on counter 1 week; freeze in oil for long term.",
        "varieties": [
            "Genovese",
            "Thai",
            "Purple Ruffles"
        ]
    },
    "Beans": {
        "emoji": "🫘",
        "depth": "1 in",
        "spacing": "4-6 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "50-60 days",
        "tip": "Do not start indoors — direct sow only.",
        "difficulty": "Easy",
        "germ_temp": "60-85°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Low nitrogen (fixes own); light phosphorus at planting.",
        "companions": [
            "Corn",
            "Squash",
            "Cucumbers"
        ],
        "avoid": [
            "Onions",
            "Fennel"
        ],
        "pests": [
            "Bean Beetle",
            "Aphids",
            "Spider Mites"
        ],
        "harvest_cues": "Pods firm and filled out; snap cleanly.",
        "storage": "Fridge up to 1 week; blanch and freeze for longer.",
        "varieties": [
            "Blue Lake",
            "Kentucky Wonder",
            "Dragon Tongue"
        ]
    },
    "Beets": {
        "emoji": "🫀",
        "depth": "1/2 in",
        "spacing": "3-4 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "55-70 days",
        "tip": "Each 'seed' is a cluster — thin to 3-4 in after sprouting.",
        "difficulty": "Easy",
        "germ_temp": "50-85°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Moderate balanced; avoid high nitrogen.",
        "companions": [
            "Onions",
            "Lettuce",
            "Brassicas"
        ],
        "avoid": [
            "Pole Beans",
            "Mustard"
        ],
        "pests": [
            "Leaf Miners",
            "Aphids",
            "Flea Beetles"
        ],
        "harvest_cues": "Roots 1.5-3 inches diameter; greens edible at any size.",
        "storage": "Fridge up to 3 weeks; remove tops.",
        "varieties": [
            "Detroit Dark Red",
            "Chioggia",
            "Golden"
        ]
    },
    "Bok Choy": {
        "emoji": "🥬",
        "depth": "1/4 in",
        "spacing": "6-12 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "45-60 days",
        "tip": "Quick cool-season crop; bolt-resistant varieties extend harvest.",
        "difficulty": "Easy",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Moderate nitrogen; one side-dress mid-season.",
        "companions": [
            "Carrots",
            "Kale",
            "Beets"
        ],
        "avoid": [
            "Tomatoes",
            "Peppers"
        ],
        "pests": [
            "Cabbage Worm",
            "Flea Beetles",
            "Aphids"
        ],
        "harvest_cues": "Leaves full and crisp; cut at base before bolting.",
        "storage": "Fridge up to 5 days; keeps best unwashed.",
        "varieties": [
            "Shanghai",
            "Joi Choi",
            "Baby Bok Choy"
        ]
    },
    "Broccoli": {
        "emoji": "🥦",
        "depth": "1/4-1/2 in",
        "spacing": "18 in",
        "water": "1-1.5 in/week",
        "sun": "Full sun",
        "days": "70-100 days",
        "tip": "Harvest before florets start to open.",
        "difficulty": "Moderate",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "High nitrogen; side-dress every 3 weeks.",
        "companions": [
            "Onions",
            "Celery",
            "Herbs"
        ],
        "avoid": [
            "Tomatoes",
            "Peppers",
            "Strawberries"
        ],
        "pests": [
            "Cabbage Worm",
            "Aphids",
            "Flea Beetles"
        ],
        "harvest_cues": "Head tight and dark green; cut before florets open.",
        "storage": "Fridge up to 5 days; blanch and freeze.",
        "varieties": [
            "Calabrese",
            "Di Cicco",
            "Belstar"
        ]
    },
    "Brussels Sprouts": {
        "emoji": "🥦",
        "depth": "1/4-1/2 in",
        "spacing": "18-24 in",
        "water": "1-1.5 in/week",
        "sun": "Full sun",
        "days": "80-100 days",
        "tip": "Start early for fall harvest; flavor improves after frost.",
        "difficulty": "Hard",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "High nitrogen; side-dress monthly, reduce once heads form.",
        "companions": [
            "Onions",
            "Celery",
            "Herbs"
        ],
        "avoid": [
            "Tomatoes",
            "Strawberries",
            "Fennel"
        ],
        "pests": [
            "Cabbage Worm",
            "Aphids",
            "Cabbage Looper"
        ],
        "harvest_cues": "Sprouts firm and 1-2 inches; harvest from bottom up as they mature.",
        "storage": "Fridge up to 5 days; blanch and freeze.",
        "varieties": [
            "Long Island Improved",
            "Jade Cross",
            "Diablo"
        ]
    },
    "Cabbage": {
        "emoji": "🥬",
        "depth": "1/4-1/2 in",
        "spacing": "12-24 in",
        "water": "1-1.5 in/week",
        "sun": "Full sun",
        "days": "70-120 days",
        "tip": "Even moisture prevents heads from splitting.",
        "difficulty": "Moderate",
        "germ_temp": "45-85°F",
        "soil_ph": "6.5-7.0",
        "fertilizer": "High nitrogen; side-dress every 3 weeks.",
        "companions": [
            "Onions",
            "Celery",
            "Dill"
        ],
        "avoid": [
            "Tomatoes",
            "Strawberries"
        ],
        "pests": [
            "Cabbage Worm",
            "Aphids",
            "Slugs"
        ],
        "harvest_cues": "Head firm and dense; squeeze — it should feel solid.",
        "storage": "Fridge up to 2 months; don't wash until use.",
        "varieties": [
            "Golden Acre",
            "Savoy",
            "Red Drumhead"
        ]
    },
    "Carrots": {
        "emoji": "🥕",
        "depth": "1/4 in",
        "spacing": "2-3 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "70-80 days",
        "tip": "Loose, deep soil is essential — thin to avoid forking.",
        "difficulty": "Easy",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Low nitrogen; moderate phosphorus and potassium.",
        "companions": [
            "Tomatoes",
            "Onions",
            "Rosemary"
        ],
        "avoid": [
            "Dill",
            "Parsnips"
        ],
        "pests": [
            "Carrot Fly",
            "Aphids",
            "Wireworm"
        ],
        "harvest_cues": "Shoulders visible at soil surface; orange and firm.",
        "storage": "Fridge up to 3 weeks; remove tops first.",
        "varieties": [
            "Nantes",
            "Danvers",
            "Imperator"
        ]
    },
    "Cauliflower": {
        "emoji": "⚪",
        "depth": "1/4-1/2 in",
        "spacing": "18-24 in",
        "water": "1.5 in/week",
        "sun": "Full sun",
        "days": "75-85 days",
        "tip": "Tie outer leaves over the head to blanch it white.",
        "difficulty": "Hard",
        "germ_temp": "45-85°F",
        "soil_ph": "6.5-7.0",
        "fertilizer": "High nitrogen; side-dress every 2 weeks.",
        "companions": [
            "Onions",
            "Celery",
            "Herbs"
        ],
        "avoid": [
            "Tomatoes",
            "Strawberries"
        ],
        "pests": [
            "Cabbage Worm",
            "Aphids",
            "Flea Beetles"
        ],
        "harvest_cues": "Head 6-8 inches, compact and white; cut before curds separate.",
        "storage": "Fridge up to 1 week; blanch and freeze.",
        "varieties": [
            "Snowball",
            "Cheddar",
            "Romanesco"
        ]
    },
    "Celeriac": {
        "emoji": "🌿",
        "depth": "1/8 in (seed)",
        "spacing": "12-15 in",
        "water": "1-2 in/week",
        "sun": "Full sun",
        "days": "110-120 days",
        "tip": "Start indoors 10-12 weeks early; needs long cool season and consistent moisture.",
        "difficulty": "Hard",
        "germ_temp": "60-70°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Heavy feeder; high nitrogen throughout season.",
        "companions": [
            "Tomatoes",
            "Onions",
            "Beans"
        ],
        "avoid": [
            "Corn",
            "Potatoes"
        ],
        "pests": [
            "Leaf Miners",
            "Celery Fly",
            "Slugs"
        ],
        "harvest_cues": "Root 3-4 inches across; firm and aromatic. Flavor peaks after light frost.",
        "storage": "Fridge up to 1 month; stores well in cool cellar.",
        "varieties": [
            "Prague Giant",
            "Brilliant",
            "Monarch"
        ]
    },
    "Celery": {
        "emoji": "🌿",
        "depth": "1/8 in",
        "spacing": "8-10 in",
        "water": "1-2 in/week",
        "sun": "Full sun",
        "days": "130-140 days",
        "tip": "Needs consistently moist soil — mulch heavily.",
        "difficulty": "Hard",
        "germ_temp": "60-70°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Heavy feeder; high nitrogen throughout season.",
        "companions": [
            "Tomatoes",
            "Onions",
            "Beans"
        ],
        "avoid": [
            "Corn",
            "Potatoes"
        ],
        "pests": [
            "Aphids",
            "Leaf Miners",
            "Slugs"
        ],
        "harvest_cues": "Stalks 8+ inches; cut outer stalks first or harvest whole.",
        "storage": "Fridge up to 2 weeks; wrap in foil to prevent drying.",
        "varieties": [
            "Utah",
            "Tango",
            "Golden Pascal"
        ]
    },
    "Chard": {
        "emoji": "🌈",
        "depth": "1/2 in",
        "spacing": "6-12 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "50-60 days",
        "tip": "Cut outer leaves and the plant keeps producing.",
        "difficulty": "Easy",
        "germ_temp": "50-85°F",
        "soil_ph": "6.0-8.0",
        "fertilizer": "Moderate nitrogen; side-dress every 3-4 weeks.",
        "companions": [
            "Beans",
            "Brassicas",
            "Alliums"
        ],
        "avoid": [
            "Corn"
        ],
        "pests": [
            "Leaf Miners",
            "Aphids",
            "Slugs"
        ],
        "harvest_cues": "Outer leaves 6-8 inches; cut at base.",
        "storage": "Fridge up to 5 days; stems and leaves store separately.",
        "varieties": [
            "Rainbow",
            "Fordhook Giant",
            "Bright Lights"
        ]
    },
    "Chives": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "6-8 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "60-90 days from seed",
        "tip": "Perennial in zones 3+; divide clumps every 3 years to reinvigorate.",
        "difficulty": "Easy",
        "germ_temp": "60-70°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Light balanced annually.",
        "companions": [
            "Carrots",
            "Tomatoes",
            "Roses"
        ],
        "avoid": [
            "Beans",
            "Peas"
        ],
        "pests": [
            "Generally pest-resistant; occasionally thrips"
        ],
        "harvest_cues": "Snip leaves 2-3 inches from base; harvest before flowering.",
        "storage": "Fridge up to 1 week; freeze chopped for long term.",
        "varieties": [
            "Common",
            "Garlic Chives"
        ]
    },
    "Cilantro": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "4-6 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "45-70 days",
        "tip": "Bolts quickly — succession sow every 3 weeks. The dried seed is coriander.",
        "difficulty": "Easy",
        "germ_temp": "55-68°F",
        "soil_ph": "6.2-6.8",
        "fertilizer": "Light balanced; avoid excess nitrogen.",
        "companions": [
            "Beans",
            "Tomatoes",
            "Spinach"
        ],
        "avoid": [
            "Fennel"
        ],
        "pests": [
            "Aphids",
            "Whitefly"
        ],
        "harvest_cues": "Leaves ferny and 6+ inches; harvest before flowering.",
        "storage": "Fridge in water up to 1 week; freeze packed in oil.",
        "varieties": [
            "Slow-Bolt",
            "Calypso",
            "Santo"
        ]
    },
    "Collard Greens": {
        "emoji": "🥬",
        "depth": "1/4-1/2 in",
        "spacing": "18-24 in",
        "water": "1-1.5 in/week",
        "sun": "Full sun",
        "days": "60-80 days",
        "tip": "More heat-tolerant than kale; harvest outer leaves for continuous production.",
        "difficulty": "Easy",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Moderate nitrogen; side-dress monthly.",
        "companions": [
            "Onions",
            "Beans",
            "Herbs"
        ],
        "avoid": [
            "Tomatoes",
            "Peppers"
        ],
        "pests": [
            "Cabbage Worm",
            "Aphids",
            "Flea Beetles"
        ],
        "harvest_cues": "Outer leaves 8-10 inches; pick lower leaves first.",
        "storage": "Fridge up to 1 week; blanch and freeze.",
        "varieties": [
            "Georgia",
            "Vates",
            "Morris Heading"
        ]
    },
    "Corn": {
        "emoji": "🌽",
        "depth": "1 in",
        "spacing": "9-12 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "60-100 days",
        "tip": "Plant in blocks of 4+ rows for good pollination.",
        "difficulty": "Moderate",
        "germ_temp": "60-95°F",
        "soil_ph": "5.8-6.8",
        "fertilizer": "Heavy nitrogen feeder; side-dress at knee height.",
        "companions": [
            "Beans",
            "Squash",
            "Sunflowers"
        ],
        "avoid": [
            "Tomatoes"
        ],
        "pests": [
            "Corn Earworm",
            "Corn Borer",
            "Rootworm"
        ],
        "harvest_cues": "Silks brown and dry; kernels plump and milky when punctured.",
        "storage": "Fridge up to 3 days; eat as soon as possible for best flavor.",
        "varieties": [
            "Silver Queen",
            "Peaches and Cream",
            "Ambrosia"
        ]
    },
    "Cucumbers": {
        "emoji": "🥒",
        "depth": "1 in",
        "spacing": "12 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "50-70 days",
        "tip": "Trellis vining types to save space.",
        "difficulty": "Easy",
        "germ_temp": "70-90°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Balanced at planting; side-dress with nitrogen when vining.",
        "companions": [
            "Beans",
            "Corn",
            "Marigolds"
        ],
        "avoid": [
            "Potatoes",
            "Aromatic Herbs"
        ],
        "pests": [
            "Cucumber Beetle",
            "Aphids",
            "Spider Mites"
        ],
        "harvest_cues": "Dark green and firm; pick before yellowing.",
        "storage": "Fridge up to 1 week; do not freeze.",
        "varieties": [
            "Straight Eight",
            "Marketmore",
            "Lemon"
        ]
    },
    "Dill": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "12 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "40-60 days",
        "tip": "Direct sow — dislikes transplanting. Succession sow for continuous harvest.",
        "difficulty": "Easy",
        "germ_temp": "60-70°F",
        "soil_ph": "5.5-6.5",
        "fertilizer": "Light; minimal feeding needed.",
        "companions": [
            "Cabbage",
            "Cucumbers",
            "Lettuce"
        ],
        "avoid": [
            "Carrots",
            "Fennel",
            "Tomatoes"
        ],
        "pests": [
            "Aphids",
            "Swallowtail Caterpillar"
        ],
        "harvest_cues": "Harvest leaves before flowering; seeds when heads turn brown.",
        "storage": "Fridge up to 5 days; dry or freeze for long term.",
        "varieties": [
            "Fernleaf",
            "Bouquet",
            "Mammoth"
        ]
    },
    "Edamame": {
        "emoji": "🫛",
        "depth": "1 in",
        "spacing": "4-6 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "70-90 days",
        "tip": "Harvest at the green stage before pods dry — pick when plump and bright.",
        "difficulty": "Easy",
        "germ_temp": "60-85°F",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Low nitrogen (fixes own); balanced at planting.",
        "companions": [
            "Corn",
            "Squash",
            "Cucumbers"
        ],
        "avoid": [
            "Onions",
            "Fennel"
        ],
        "pests": [
            "Bean Beetle",
            "Aphids",
            "Stink Bugs"
        ],
        "harvest_cues": "Pods plump and bright green, 3 inches long; beans visible through pod.",
        "storage": "Fridge up to 3 days; blanch and freeze for longer.",
        "varieties": [
            "Midori Giant",
            "Envy",
            "Sayamusume"
        ]
    },
    "Eggplant": {
        "emoji": "🍆",
        "depth": "1/4 in",
        "spacing": "18-24 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "65-80 days",
        "tip": "Needs warm soil — wait until nights stay above 55°F.",
        "difficulty": "Moderate",
        "germ_temp": "75-85°F",
        "soil_ph": "5.8-6.5",
        "fertilizer": "Balanced at planting; side-dress with nitrogen mid-season.",
        "companions": [
            "Tomatoes",
            "Peppers",
            "Marigolds"
        ],
        "avoid": [
            "Fennel"
        ],
        "pests": [
            "Flea Beetles",
            "Aphids",
            "Colorado Potato Beetle"
        ],
        "harvest_cues": "Skin glossy and slightly springy; don't let it go dull.",
        "storage": "Fridge up to 5 days; best used fresh.",
        "varieties": [
            "Black Beauty",
            "Ichiban",
            "Rosa Bianca"
        ]
    },
    "Endive": {
        "emoji": "🥬",
        "depth": "1/8-1/4 in",
        "spacing": "9-12 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "65-90 days",
        "tip": "Cover heads for 2 weeks before harvest to blanch and mellow the flavor.",
        "difficulty": "Moderate",
        "germ_temp": "45-75°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Moderate nitrogen; one side-dress mid-season.",
        "companions": [
            "Lettuce",
            "Carrots",
            "Radishes"
        ],
        "avoid": [
            "Fennel"
        ],
        "pests": [
            "Aphids",
            "Slugs",
            "Leaf Miners"
        ],
        "harvest_cues": "Head firm and full; blanch if desired before cutting.",
        "storage": "Fridge up to 2 weeks; one of the longest-storing salad greens.",
        "varieties": [
            "Broad-leaved Batavian",
            "Frisée",
            "Nuvena"
        ]
    },
    "Fava Beans": {
        "emoji": "🫘",
        "depth": "2 in",
        "spacing": "6 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "75-90 days",
        "tip": "Cool-season legume — direct sow 4-6 weeks before last frost; tolerates light frost.",
        "difficulty": "Easy",
        "germ_temp": "40-75°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Low nitrogen (fixes own); light phosphorus at planting.",
        "companions": [
            "Carrots",
            "Potatoes",
            "Brassicas"
        ],
        "avoid": [
            "Onions",
            "Garlic"
        ],
        "pests": [
            "Black Bean Aphid",
            "Chocolate Spot",
            "Pea Weevil"
        ],
        "harvest_cues": "Pods fat and filled; beans inside clear with no dark ring.",
        "storage": "Fridge up to 1 week; shell and freeze for longer.",
        "varieties": [
            "Aquadulce",
            "Windsor",
            "Sweet Lorane"
        ]
    },
    "Fennel": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "12-18 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "65-80 days",
        "tip": "Grow in isolation — allelopathic to most vegetables. Keep away from all food crops.",
        "difficulty": "Easy",
        "germ_temp": "50-65°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Light balanced; too much fertility reduces flavor.",
        "companions": [
            "Dill"
        ],
        "avoid": [
            "Tomatoes",
            "Peppers",
            "Beans",
            "Basil",
            "Lettuce",
            "Cilantro",
            "Most vegetables"
        ],
        "pests": [
            "Aphids",
            "Swallowtail Caterpillar"
        ],
        "harvest_cues": "Bulb 3-5 inches across; fronds harvestable anytime before bolting.",
        "storage": "Fridge up to 1 week; fronds dry well.",
        "varieties": [
            "Florence Fennel",
            "Perfection",
            "Zefa Fino"
        ]
    },
    "Garlic": {
        "emoji": "🧄",
        "depth": "2 in",
        "spacing": "6 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "240-270 days",
        "tip": "Plant cloves in fall, pointy end up.",
        "difficulty": "Easy",
        "germ_temp": "32-50°F (cold treatment)",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Nitrogen in spring; stop fertilizing by early summer.",
        "companions": [
            "Tomatoes",
            "Roses",
            "Carrots"
        ],
        "avoid": [
            "Beans",
            "Peas"
        ],
        "pests": [
            "Thrips",
            "Onion Fly",
            "Nematodes"
        ],
        "harvest_cues": "Bottom 3-4 leaves brown; dig before all leaves die back.",
        "storage": "Cure 3-4 weeks in warm, dry place; store up to 6 months.",
        "varieties": [
            "Rocambole",
            "Porcelain",
            "Silverskin"
        ]
    },
    "Ginger": {
        "emoji": "🫚",
        "depth": "2-4 in (rhizome)",
        "spacing": "8-10 in",
        "water": "1-2 in/week",
        "sun": "Partial shade",
        "days": "8-10 months",
        "tip": "Zones 8b+ outdoor; elsewhere start in pots and bring indoors before frost.",
        "difficulty": "Moderate",
        "germ_temp": "70-80°F (soil temp)",
        "soil_ph": "5.5-6.5",
        "fertilizer": "Monthly balanced during growing season.",
        "companions": [
            "Peppers",
            "Tomatoes",
            "Lemongrass"
        ],
        "avoid": [
            "Walnut Trees"
        ],
        "pests": [
            "Rhizome Rot",
            "Aphids",
            "Root Knot Nematode"
        ],
        "harvest_cues": "Leaves yellow and die back in fall; dig after first frost threat.",
        "storage": "Fridge up to 1 month; freeze grated; dry and grind.",
        "varieties": [
            "Common (Zingiber officinale)",
            "Hawaiian Baby",
            "Culinary White"
        ]
    },
    "Globe Artichoke": {
        "emoji": "🌿",
        "depth": "1/4 in (seed)",
        "spacing": "36-48 in",
        "water": "2 in/week",
        "sun": "Full sun",
        "days": "85-100 days (annual) or perennial yr 2+",
        "tip": "Perennial zones 7+; in cold zones start early indoors and treat as annual.",
        "difficulty": "Moderate",
        "germ_temp": "70-80°F",
        "soil_ph": "6.5-8.0",
        "fertilizer": "Heavy feeder; balanced monthly during growing season.",
        "companions": [
            "Sunflowers",
            "Peas",
            "Tarragon"
        ],
        "avoid": [
            "Beans",
            "Alliums"
        ],
        "pests": [
            "Aphids",
            "Earwigs",
            "Slugs"
        ],
        "harvest_cues": "Buds before they open; tight scales and firm; cut 1-2 inches below head.",
        "storage": "Fridge up to 1 week.",
        "varieties": [
            "Green Globe",
            "Purple of Romagna",
            "Imperial Star"
        ]
    },
    "Green Onions": {
        "emoji": "🌿",
        "depth": "1/4-1/2 in",
        "spacing": "1-2 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "50-60 days",
        "tip": "Snip from above — plants regrow; succession sow for continuous harvest.",
        "difficulty": "Easy",
        "germ_temp": "50-85°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Light nitrogen; minimal feeding needed.",
        "companions": [
            "Carrots",
            "Tomatoes",
            "Brassicas"
        ],
        "avoid": [
            "Beans",
            "Peas"
        ],
        "pests": [
            "Thrips",
            "Aphids",
            "Onion Maggot"
        ],
        "harvest_cues": "Stems pencil-thick; harvest at any size.",
        "storage": "Fridge up to 2 weeks; stand in water to keep fresh.",
        "varieties": [
            "Evergreen Hardy White",
            "Ishikura",
            "Tokyo Long White"
        ]
    },
    "Ground Cherries": {
        "emoji": "🫑",
        "depth": "1/4 in",
        "spacing": "24-36 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "70-80 days",
        "tip": "Fruit falls to ground when ripe — fallen fruit inside husk is ready.",
        "difficulty": "Easy",
        "germ_temp": "70-80°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Balanced at planting; minimal thereafter.",
        "companions": [
            "Basil",
            "Marigolds",
            "Tomatoes"
        ],
        "avoid": [
            "Fennel",
            "Brassicas"
        ],
        "pests": [
            "Aphids",
            "Flea Beetles",
            "Colorado Potato Beetle"
        ],
        "harvest_cues": "Fruit falls to ground; papery husk tan. Check frequently.",
        "storage": "In husk at room temp 2-3 weeks; fridge in husk 1-2 months.",
        "varieties": [
            "Aunt Molly's",
            "Cossack Pineapple",
            "Goldie"
        ]
    },
    "Horseradish": {
        "emoji": "🌿",
        "depth": "2-4 in (root cutting)",
        "spacing": "18-24 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "N/A (perennial root)",
        "tip": "Plant root pieces in spring; very vigorous — give it dedicated space.",
        "difficulty": "Easy",
        "germ_temp": "N/A (plant root cuttings)",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Minimal; top-dress with compost each spring.",
        "companions": [
            "Potatoes",
            "Fruit Trees"
        ],
        "avoid": [
            "Tomatoes",
            "Peppers"
        ],
        "pests": [
            "Generally pest-resistant"
        ],
        "harvest_cues": "Harvest roots after first frost for best flavor; dig in fall.",
        "storage": "Fridge up to 3 months; grate fresh for maximum pungency.",
        "varieties": [
            "Common (Armoracia rusticana)",
            "Bohemian"
        ]
    },
    "Jerusalem Artichoke": {
        "emoji": "🌻",
        "depth": "3-5 in (tuber)",
        "spacing": "12-18 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "100-150 days",
        "tip": "Invasive — plant in a contained bed or large pot to control spread.",
        "difficulty": "Easy",
        "germ_temp": "N/A (plant tubers)",
        "soil_ph": "5.8-6.8",
        "fertilizer": "Minimal; very self-sufficient once established.",
        "companions": [
            "Corn",
            "Beans",
            "Sunflowers"
        ],
        "avoid": [
            "Potatoes"
        ],
        "pests": [
            "Slugs",
            "Aphids"
        ],
        "harvest_cues": "Stalks die back in fall; dig tubers through winter.",
        "storage": "Fridge up to 2 weeks; leave in ground as living pantry.",
        "varieties": [
            "Stampede",
            "Clearwater",
            "Fuseau"
        ]
    },
    "Kale": {
        "emoji": "🥦",
        "depth": "1/4-1/2 in",
        "spacing": "12-18 in",
        "water": "1-1.5 in/week",
        "sun": "Full sun",
        "days": "55-75 days",
        "tip": "Flavor improves after a light frost.",
        "difficulty": "Easy",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Moderate nitrogen; side-dress monthly.",
        "companions": [
            "Beets",
            "Herbs",
            "Nasturtiums"
        ],
        "avoid": [
            "Tomatoes",
            "Beans"
        ],
        "pests": [
            "Cabbage Worm",
            "Aphids",
            "Flea Beetles"
        ],
        "harvest_cues": "Outer leaves 8-10 inches; pick lower leaves first.",
        "storage": "Fridge up to 1 week; remove stems before storing.",
        "varieties": [
            "Lacinato",
            "Curly",
            "Red Russian"
        ]
    },
    "Kohlrabi": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "5-8 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "45-60 days",
        "tip": "Harvest when bulb is tennis ball size — larger gets woody.",
        "difficulty": "Easy",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Moderate nitrogen; light side-dress.",
        "companions": [
            "Onions",
            "Beets",
            "Herbs"
        ],
        "avoid": [
            "Tomatoes",
            "Peppers",
            "Strawberries"
        ],
        "pests": [
            "Aphids",
            "Flea Beetles",
            "Cabbage Worm"
        ],
        "harvest_cues": "Bulb 2-3 inches diameter; firm and bright.",
        "storage": "Fridge up to 2 weeks; store bulb and leaves separately.",
        "varieties": [
            "Early White Vienna",
            "Purple Vienna",
            "Kossak"
        ]
    },
    "Leeks": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "6 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "100-120 days",
        "tip": "Blanch by hilling soil up around stems as they grow.",
        "difficulty": "Moderate",
        "germ_temp": "55-77°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Moderate nitrogen; side-dress monthly.",
        "companions": [
            "Carrots",
            "Celery",
            "Onions"
        ],
        "avoid": [
            "Beans",
            "Peas"
        ],
        "pests": [
            "Onion Fly",
            "Thrips",
            "Leaf Miner"
        ],
        "harvest_cues": "Shaft 1 inch diameter; blanched white portion 4+ inches.",
        "storage": "Fridge up to 2 weeks; or leave in ground until needed.",
        "varieties": [
            "King Richard",
            "Giant Musselburgh",
            "Autumn Giant"
        ]
    },
    "Lemongrass": {
        "emoji": "🌾",
        "depth": "Surface (division/transplant)",
        "spacing": "24-36 in",
        "water": "1-2 in/week",
        "sun": "Full sun",
        "days": "90-120 days to harvest",
        "tip": "Zones 8b+ perennial; root a grocery store stalk in water to start for free.",
        "difficulty": "Easy",
        "germ_temp": "70-80°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Balanced monthly during growing season.",
        "companions": [
            "Ginger",
            "Turmeric",
            "Peppers"
        ],
        "avoid": [],
        "pests": [
            "Spider Mites",
            "Rust",
            "Aphids"
        ],
        "harvest_cues": "Stalks 1 foot or taller; cut at base; inner stalk white-pale yellow.",
        "storage": "Fridge up to 2 weeks; dry or freeze stalks.",
        "varieties": [
            "East Indian (C. flexuosus)",
            "West Indian (C. citratus)"
        ]
    },
    "Lettuce": {
        "emoji": "🥬",
        "depth": "1/8 in",
        "spacing": "6-8 in",
        "water": "1 in/week",
        "sun": "Partial shade",
        "days": "45-60 days",
        "tip": "Bolts in heat — succession sow every 2 weeks.",
        "difficulty": "Easy",
        "germ_temp": "40-75°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Light nitrogen; side-dress mid-season.",
        "companions": [
            "Carrots",
            "Radishes",
            "Strawberries"
        ],
        "avoid": [
            "Fennel",
            "Parsley"
        ],
        "pests": [
            "Aphids",
            "Slugs",
            "Leafhoppers"
        ],
        "harvest_cues": "Outer leaves firm and full; cut before bolting.",
        "storage": "Fridge up to 1 week; keep moist.",
        "varieties": [
            "Buttercrunch",
            "Romaine",
            "Red Leaf"
        ]
    },
    "Mangoes": {
        "emoji": "🥭",
        "depth": "N/A (tree)",
        "spacing": "25-30 ft",
        "water": "Deep, weekly",
        "sun": "Full sun",
        "days": "3-5 years",
        "tip": "Zones 10-11 only — needs frost-free winters.",
        "difficulty": "Hard",
        "germ_temp": "N/A",
        "soil_ph": "5.5-7.5",
        "fertilizer": "Balanced fertilizer 3-4x per year; reduce nitrogen once mature.",
        "companions": [
            "Comfrey",
            "Lemongrass"
        ],
        "avoid": [],
        "pests": [
            "Mango Hopper",
            "Fruit Fly",
            "Anthracnose"
        ],
        "harvest_cues": "N/A",
        "storage": "N/A",
        "varieties": [
            "Tommy Atkins",
            "Keitt",
            "Alphonso"
        ]
    },
    "Melons": {
        "emoji": "🍈",
        "depth": "1 in",
        "spacing": "24-36 in",
        "water": "2 in/week",
        "sun": "Full sun",
        "days": "70-90 days",
        "tip": "Needs long warm season — start indoors in cool climates.",
        "difficulty": "Moderate",
        "germ_temp": "75-90°F",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Balanced early; switch to low-nitrogen when fruit sets.",
        "companions": [
            "Corn",
            "Sunflowers",
            "Radishes"
        ],
        "avoid": [
            "Potatoes"
        ],
        "pests": [
            "Aphids",
            "Cucumber Beetle",
            "Spider Mites"
        ],
        "harvest_cues": "Sweet smell at stem end; slips off vine with light pressure.",
        "storage": "Counter until ripe; fridge once cut.",
        "varieties": [
            "Honeydew",
            "Cantaloupe",
            "Sugar Baby Watermelon"
        ]
    },
    "Mint": {
        "emoji": "🌿",
        "depth": "Surface (division/transplant)",
        "spacing": "18-24 in",
        "water": "1-2 in/week",
        "sun": "Partial shade/full sun",
        "days": "Perennial (fast-spreading)",
        "tip": "Contain in pots — spreads aggressively by underground runners.",
        "difficulty": "Easy",
        "germ_temp": "65-70°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Light; vigorous grower needs minimal feeding.",
        "companions": [
            "Tomatoes",
            "Cabbage",
            "Peas"
        ],
        "avoid": [
            "Parsley",
            "Chamomile"
        ],
        "pests": [
            "Spider Mites",
            "Aphids",
            "Mint Rust"
        ],
        "harvest_cues": "Leaves 3-4 inches; harvest before flowering for best flavor.",
        "storage": "Fridge in water up to 1 week; dry or freeze.",
        "varieties": [
            "Spearmint",
            "Peppermint",
            "Chocolate Mint"
        ]
    },
    "Mustard Greens": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "6-9 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "30-50 days",
        "tip": "Very fast cool-season crop; sow in fall for mildest flavor.",
        "difficulty": "Easy",
        "germ_temp": "40-75°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Light nitrogen; quick crop needs minimal feeding.",
        "companions": [
            "Beans",
            "Alliums"
        ],
        "avoid": [
            "Fennel"
        ],
        "pests": [
            "Aphids",
            "Flea Beetles",
            "Cabbage Worm"
        ],
        "harvest_cues": "Leaves 4-6 inches; harvest before bolting.",
        "storage": "Fridge up to 3 days; best used fresh.",
        "varieties": [
            "Southern Giant Curled",
            "Red Giant",
            "Tendergreen"
        ]
    },
    "Mâche": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "4-6 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "45-60 days",
        "tip": "Cold-hardy to 5°F — an excellent winter green in cold frames.",
        "difficulty": "Easy",
        "germ_temp": "50-65°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Light; minimal feeding needed.",
        "companions": [
            "Lettuce",
            "Spinach",
            "Radishes"
        ],
        "avoid": [
            "Fennel"
        ],
        "pests": [
            "Aphids",
            "Slugs"
        ],
        "harvest_cues": "Rosettes 3-4 inches across; harvest whole or leaf by leaf.",
        "storage": "Fridge up to 3 days; very delicate.",
        "varieties": [
            "Vit",
            "Cavallo",
            "D'Etampes"
        ]
    },
    "Okra": {
        "emoji": "🫛",
        "depth": "1 in",
        "spacing": "12-18 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "50-65 days",
        "tip": "Soak seeds overnight to speed germination.",
        "difficulty": "Easy",
        "germ_temp": "75-90°F",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Moderate balanced; side-dress monthly.",
        "companions": [
            "Melons",
            "Cucumbers",
            "Sunflowers"
        ],
        "avoid": [
            "Tomatoes",
            "Peppers"
        ],
        "pests": [
            "Aphids",
            "Stink Bugs",
            "Corn Earworm"
        ],
        "harvest_cues": "Pods 2-4 inches; pick every 2 days to prevent toughening.",
        "storage": "Fridge up to 3 days; slice and freeze long term.",
        "varieties": [
            "Clemson Spineless",
            "Burgundy",
            "Emerald"
        ]
    },
    "Onions": {
        "emoji": "🧅",
        "depth": "1/2 in (seed)",
        "spacing": "4-6 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "100-120 days",
        "tip": "Stop watering when tops fall over to cure bulbs.",
        "difficulty": "Moderate",
        "germ_temp": "50-85°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "High nitrogen early; reduce once bulbing starts.",
        "companions": [
            "Carrots",
            "Tomatoes",
            "Brassicas"
        ],
        "avoid": [
            "Beans",
            "Peas"
        ],
        "pests": [
            "Thrips",
            "Onion Maggot",
            "Aphids"
        ],
        "harvest_cues": "Tops fall over naturally; cure in sun 1-2 weeks.",
        "storage": "Cool, dry, dark place up to 6 months after curing.",
        "varieties": [
            "Yellow Sweet Spanish",
            "Red Zeppelin",
            "Walla Walla"
        ]
    },
    "Oregano": {
        "emoji": "🌿",
        "depth": "1/8 in",
        "spacing": "12-18 in",
        "water": "Low; drought-tolerant",
        "sun": "Full sun",
        "days": "Perennial (60-90 days from seed)",
        "tip": "Perennial zones 5+; slightly stressed plants have stronger flavor.",
        "difficulty": "Easy",
        "germ_temp": "70-80°F",
        "soil_ph": "6.0-8.0",
        "fertilizer": "Very light; lean soil improves flavor.",
        "companions": [
            "Tomatoes",
            "Peppers",
            "Squash"
        ],
        "avoid": [],
        "pests": [
            "Aphids",
            "Spider Mites"
        ],
        "harvest_cues": "Harvest stems before flowering; cut back by 1/3 maximum.",
        "storage": "Fridge up to 1 week; dries excellently.",
        "varieties": [
            "Greek",
            "Italian",
            "Marjoram (sweet oregano)"
        ]
    },
    "Parsley": {
        "emoji": "🌿",
        "depth": "1/4 in",
        "spacing": "8-10 in",
        "water": "1 in/week",
        "sun": "Full sun/partial",
        "days": "70-90 days",
        "tip": "Soak seed overnight to speed germination; biennial — best leaf production in year 1.",
        "difficulty": "Easy",
        "germ_temp": "50-70°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Moderate nitrogen; one side-dress mid-season.",
        "companions": [
            "Tomatoes",
            "Asparagus",
            "Carrots"
        ],
        "avoid": [
            "Alliums",
            "Fennel"
        ],
        "pests": [
            "Carrot Fly",
            "Aphids",
            "Swallowtail Caterpillar"
        ],
        "harvest_cues": "Stems with 3 leaf segments; harvest outer stems first.",
        "storage": "Fridge in water up to 2 weeks; dry or freeze for long term.",
        "varieties": [
            "Italian Flat-Leaf",
            "Curled",
            "Hamburg (root parsley)"
        ]
    },
    "Parsnips": {
        "emoji": "🌿",
        "depth": "1/2 in",
        "spacing": "3-4 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "100-130 days",
        "tip": "Sow fresh seed; flavor peaks after frost. Slow to germinate — be patient.",
        "difficulty": "Moderate",
        "germ_temp": "50-70°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Moderate balanced; avoid excess nitrogen (causes forking).",
        "companions": [
            "Peas",
            "Beans",
            "Peppers"
        ],
        "avoid": [
            "Carrots",
            "Celery"
        ],
        "pests": [
            "Carrot Fly",
            "Aphids",
            "Parsnip Canker"
        ],
        "harvest_cues": "Roots 8-12 inches; sweetest after a hard frost.",
        "storage": "Fridge up to 2 weeks; or leave in ground under mulch.",
        "varieties": [
            "Hollow Crown",
            "Harris Model",
            "Javelin"
        ]
    },
    "Peanuts": {
        "emoji": "🥜",
        "depth": "2-3 in",
        "spacing": "6-8 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "120-150 days",
        "tip": "Zones 6b+ for reliable harvest; hill soil as plants flower — pods develop underground.",
        "difficulty": "Moderate",
        "germ_temp": "65-85°F",
        "soil_ph": "5.8-6.2",
        "fertilizer": "Low nitrogen (fixes own); high calcium helps pod fill.",
        "companions": [
            "Beans",
            "Corn",
            "Sunflowers"
        ],
        "avoid": [
            "Onions",
            "Garlic"
        ],
        "pests": [
            "Thrips",
            "Leaf Spot",
            "Aphids"
        ],
        "harvest_cues": "Leaves yellow; dig and check a pod — inner hull ridged and full.",
        "storage": "Dry in shell 2-3 weeks, then cure; store months in cool dry place.",
        "varieties": [
            "Valencia",
            "Virginia",
            "Spanish"
        ]
    },
    "Peas": {
        "emoji": "🫛",
        "depth": "1 in",
        "spacing": "2-3 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "60-70 days",
        "tip": "Direct sow as soon as soil can be worked in spring.",
        "difficulty": "Easy",
        "germ_temp": "40-75°F",
        "soil_ph": "6.0-7.5",
        "fertilizer": "Low nitrogen; light phosphorus at planting.",
        "companions": [
            "Carrots",
            "Turnips",
            "Radishes"
        ],
        "avoid": [
            "Onions",
            "Garlic"
        ],
        "pests": [
            "Pea Moth",
            "Aphids",
            "Pea Weevil"
        ],
        "harvest_cues": "Pods plump and filled; pick daily to encourage production.",
        "storage": "Fridge up to 5 days; blanch and freeze for longer.",
        "varieties": [
            "Sugar Snap",
            "Lincoln",
            "Oregon Sugar Pod"
        ]
    },
    "Peppers": {
        "emoji": "🌶️",
        "depth": "1/4 in",
        "spacing": "12-18 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "70-90 days",
        "tip": "Start indoors 8-10 weeks before transplant.",
        "difficulty": "Moderate",
        "germ_temp": "75-85°F",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Balanced at planting; reduce nitrogen when fruiting.",
        "companions": [
            "Basil",
            "Carrots",
            "Tomatoes"
        ],
        "avoid": [
            "Fennel",
            "Brassicas"
        ],
        "pests": [
            "Aphids",
            "Pepper Weevil",
            "Spider Mites"
        ],
        "harvest_cues": "Green or wait until fully colored; firm and glossy.",
        "storage": "Fridge up to 2 weeks; freeze for long term.",
        "varieties": [
            "Bell Boy",
            "Jalapeño",
            "Banana Pepper"
        ]
    },
    "Potatoes": {
        "emoji": "🥔",
        "depth": "4 in (seed potato)",
        "spacing": "12-15 in",
        "water": "1-2 in/week",
        "sun": "Full sun",
        "days": "70-120 days",
        "tip": "Hill soil as vines grow to increase yield; stop watering when tops die back.",
        "difficulty": "Easy",
        "germ_temp": "45-65°F (soil temp)",
        "soil_ph": "5.0-6.0",
        "fertilizer": "Balanced at planting; side-dress when plants are 6 inches tall.",
        "companions": [
            "Beans",
            "Corn",
            "Cabbage"
        ],
        "avoid": [
            "Tomatoes",
            "Peppers",
            "Cucumbers"
        ],
        "pests": [
            "Colorado Potato Beetle",
            "Aphids",
            "Wireworm"
        ],
        "harvest_cues": "Skin set (doesn't rub off easily); dig after tops die back.",
        "storage": "Cool, dark, dry place 2-3 months; cure 1 week at 55°F first.",
        "varieties": [
            "Yukon Gold",
            "Red Pontiac",
            "Russet Burbank"
        ]
    },
    "Pumpkins": {
        "emoji": "🎃",
        "depth": "1 in",
        "spacing": "36-60 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "90-120 days",
        "tip": "Each plant needs 50+ sq ft — plan space accordingly.",
        "difficulty": "Easy",
        "germ_temp": "70-90°F",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Heavy feeder; balanced at planting, low-nitrogen once flowering.",
        "companions": [
            "Corn",
            "Beans",
            "Marigolds"
        ],
        "avoid": [
            "Potatoes"
        ],
        "pests": [
            "Squash Bug",
            "Vine Borer",
            "Cucumber Beetle"
        ],
        "harvest_cues": "Deep color and hard rind; stem dry and corky.",
        "storage": "Cool, dry place 2-3 months; do not freeze.",
        "varieties": [
            "Jack O'Lantern",
            "Baby Pam",
            "Cinderella"
        ]
    },
    "Radishes": {
        "emoji": "🔴",
        "depth": "1/2 in",
        "spacing": "1-2 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "22-30 days",
        "tip": "Fastest crop in the garden — great row markers.",
        "difficulty": "Easy",
        "germ_temp": "45-90°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Light balanced; avoid high nitrogen.",
        "companions": [
            "Carrots",
            "Lettuce",
            "Tomatoes"
        ],
        "avoid": [
            "Hyssop"
        ],
        "pests": [
            "Flea Beetles",
            "Root Maggots",
            "Aphids"
        ],
        "harvest_cues": "Roots 1 inch diameter; pull before getting pithy.",
        "storage": "Fridge up to 2 weeks; remove tops.",
        "varieties": [
            "Cherry Belle",
            "French Breakfast",
            "Daikon"
        ]
    },
    "Rhubarb": {
        "emoji": "🌿",
        "depth": "2-3 in (crown)",
        "spacing": "36-48 in",
        "water": "1-2 in/week",
        "sun": "Full sun",
        "days": "2 years to harvest (plant crowns)",
        "tip": "Don't harvest first year; NEVER eat the leaves — they are toxic.",
        "difficulty": "Easy",
        "germ_temp": "N/A (plant crowns)",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Balanced in spring; compost mulch annually.",
        "companions": [
            "Strawberries",
            "Onions",
            "Garlic"
        ],
        "avoid": [
            "Root vegetables (competition)"
        ],
        "pests": [
            "Rhubarb Curculio",
            "Slugs",
            "Crown Rot"
        ],
        "harvest_cues": "Stalks 12-18 inches; pull and twist — never cut more than 1/3 of plant.",
        "storage": "Fridge up to 2 weeks; chops and freezes well.",
        "varieties": [
            "Victoria",
            "Chipman Canada Red",
            "Crimson Red"
        ]
    },
    "Rosemary": {
        "emoji": "🌿",
        "depth": "1/4 in (seed)",
        "spacing": "24-36 in",
        "water": "Low; drought-tolerant",
        "sun": "Full sun",
        "days": "Perennial (3-6 months from seed)",
        "tip": "Perennial zones 7+; grow in pots elsewhere and overwinter indoors.",
        "difficulty": "Moderate",
        "germ_temp": "70-80°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Very light; excess fertilizer reduces flavor and fragrance.",
        "companions": [
            "Beans",
            "Carrots",
            "Cabbage"
        ],
        "avoid": [],
        "pests": [
            "Aphids",
            "Spider Mites",
            "Scale"
        ],
        "harvest_cues": "Snip tips 3-4 inches; harvest before or just after flowering.",
        "storage": "Fridge 2 weeks; dry bundles or freeze for long term.",
        "varieties": [
            "Arp",
            "Tuscan Blue",
            "Prostrate"
        ]
    },
    "Rutabaga": {
        "emoji": "🌿",
        "depth": "1/2 in",
        "spacing": "6-8 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "90-100 days",
        "tip": "Direct sow early summer for fall harvest; frost improves sweetness.",
        "difficulty": "Easy",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Moderate balanced; low nitrogen.",
        "companions": [
            "Peas",
            "Onions",
            "Leeks"
        ],
        "avoid": [
            "Tomatoes"
        ],
        "pests": [
            "Cabbage Maggot",
            "Aphids",
            "Flea Beetles"
        ],
        "harvest_cues": "Roots 3-5 inches; harvest after first frost for best flavor.",
        "storage": "Fridge up to 3 weeks; root cellar several months.",
        "varieties": [
            "American Purple Top",
            "Laurentian",
            "Marian"
        ]
    },
    "Sage": {
        "emoji": "🌿",
        "depth": "1/8-1/4 in",
        "spacing": "18-24 in",
        "water": "Low; drought-tolerant",
        "sun": "Full sun",
        "days": "Perennial (75-90 days from seed)",
        "tip": "Perennial zones 4+; prune hard in spring to prevent woodiness.",
        "difficulty": "Easy",
        "germ_temp": "60-70°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Very light; excess fertility reduces flavor.",
        "companions": [
            "Cabbage",
            "Carrots",
            "Tomatoes"
        ],
        "avoid": [
            "Basil",
            "Onions"
        ],
        "pests": [
            "Spider Mites",
            "Aphids",
            "Slugs"
        ],
        "harvest_cues": "Harvest leaves before or just after flowering.",
        "storage": "Fridge up to 1 week; dries and freezes well.",
        "varieties": [
            "Common",
            "Purple",
            "Tri-color"
        ]
    },
    "Shallots": {
        "emoji": "🧅",
        "depth": "1-2 in (set)",
        "spacing": "6-8 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "60-120 days from sets",
        "tip": "Plant sets in fall (mild climates) or early spring (cold climates).",
        "difficulty": "Easy",
        "germ_temp": "35-50°F (vernalization)",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Moderate nitrogen; reduce once bulbing starts.",
        "companions": [
            "Carrots",
            "Tomatoes",
            "Brassicas"
        ],
        "avoid": [
            "Beans",
            "Peas"
        ],
        "pests": [
            "Thrips",
            "Onion Maggot",
            "Aphids"
        ],
        "harvest_cues": "Tops fall and yellow; cure 2-3 weeks in warm dry spot.",
        "storage": "Cool, dry, dark place up to 6 months after curing.",
        "varieties": [
            "French Gray",
            "Prisma",
            "Ambition"
        ]
    },
    "Spinach": {
        "emoji": "🌿",
        "depth": "1/2 in",
        "spacing": "3-5 in",
        "water": "1-1.5 in/week",
        "sun": "Full sun/partial",
        "days": "40-50 days",
        "tip": "Cool-season crop — sow in early spring or fall.",
        "difficulty": "Easy",
        "germ_temp": "35-75°F",
        "soil_ph": "6.5-7.5",
        "fertilizer": "Moderate nitrogen; side-dress lightly once established.",
        "companions": [
            "Strawberries",
            "Peas",
            "Brassicas"
        ],
        "avoid": [
            "Fennel"
        ],
        "pests": [
            "Aphids",
            "Leaf Miners",
            "Slugs"
        ],
        "harvest_cues": "Outer leaves 3+ inches; harvest before heat causes bolting.",
        "storage": "Fridge up to 5 days; do not wash until use.",
        "varieties": [
            "Bloomsdale",
            "Tyee",
            "Baby Leaf"
        ]
    },
    "Squash": {
        "emoji": "🎃",
        "depth": "1 in",
        "spacing": "24-36 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "50-65 days",
        "tip": "Direct sow after last frost — transplants poorly.",
        "difficulty": "Easy",
        "germ_temp": "70-90°F",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Heavy feeder; side-dress monthly with balanced fertilizer.",
        "companions": [
            "Corn",
            "Beans",
            "Nasturtiums"
        ],
        "avoid": [
            "Potatoes"
        ],
        "pests": [
            "Squash Bug",
            "Vine Borer",
            "Cucumber Beetle"
        ],
        "harvest_cues": "Skin resists thumbnail scratch; rich color.",
        "storage": "Cool, dry place up to 3 months (winter squash); fridge 5 days (summer).",
        "varieties": [
            "Zucchini",
            "Butternut",
            "Acorn"
        ]
    },
    "Strawberries": {
        "emoji": "🍓",
        "depth": "Crown at soil level",
        "spacing": "12-18 in",
        "water": "1-2 in/week",
        "sun": "Full sun",
        "days": "Year 1 (day-neutral) or Year 2 (June-bearing)",
        "tip": "Remove first-year flowers on June-bearing types for stronger plants.",
        "difficulty": "Easy",
        "germ_temp": "N/A (transplant crowns)",
        "soil_ph": "5.5-6.5",
        "fertilizer": "Balanced in spring; high phosphorus supports fruiting.",
        "companions": [
            "Lettuce",
            "Spinach",
            "Borage"
        ],
        "avoid": [
            "Brassicas",
            "Fennel"
        ],
        "pests": [
            "Slugs",
            "Spider Mites",
            "Gray Mold"
        ],
        "harvest_cues": "Fully red all over; slight give; stem snaps cleanly.",
        "storage": "Fridge up to 5 days; do not wash until use. Freeze whole.",
        "varieties": [
            "Ozark Beauty",
            "Albion",
            "Seascape",
            "Jewel"
        ]
    },
    "Sweet Potatoes": {
        "emoji": "🍠",
        "depth": "4-6 in (slips)",
        "spacing": "12-18 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "90-120 days",
        "tip": "Plant slips, not seeds — cure dug roots for 2 weeks.",
        "difficulty": "Moderate",
        "germ_temp": "75-85°F (soil temp for slips)",
        "soil_ph": "5.8-6.5",
        "fertilizer": "Low nitrogen; high potassium at planting.",
        "companions": [
            "Herbs",
            "Radishes",
            "Beans"
        ],
        "avoid": [
            "Squash"
        ],
        "pests": [
            "Sweet Potato Weevil",
            "Flea Beetles",
            "Wireworm"
        ],
        "harvest_cues": "Leaves yellow and vines die back; skin doesn't rub off.",
        "storage": "Cure 10-14 days at 85°F; store at 55-60°F up to 6 months.",
        "varieties": [
            "Beauregard",
            "Jewel",
            "Purple"
        ]
    },
    "Thyme": {
        "emoji": "🌿",
        "depth": "1/8 in",
        "spacing": "12-24 in",
        "water": "Low; drought-tolerant",
        "sun": "Full sun",
        "days": "Perennial (60-90 days from seed)",
        "tip": "Perennial zones 5+; excellent ground cover between larger plants.",
        "difficulty": "Easy",
        "germ_temp": "60-70°F",
        "soil_ph": "6.0-8.0",
        "fertilizer": "Very light; well-drained soil matters more than fertility.",
        "companions": [
            "Roses",
            "Cabbage",
            "Tomatoes"
        ],
        "avoid": [],
        "pests": [
            "Generally pest-resistant; occasionally spider mites"
        ],
        "harvest_cues": "Harvest leafy stems anytime; just before flowering is strongest.",
        "storage": "Fridge up to 1 week; dries excellently.",
        "varieties": [
            "English",
            "French",
            "Lemon Thyme"
        ]
    },
    "Tomatillos": {
        "emoji": "🫑",
        "depth": "1/4 in",
        "spacing": "24-36 in",
        "water": "1-2 in/week",
        "sun": "Full sun",
        "days": "75-100 days",
        "tip": "Need 2 plants for pollination; papery husk bursts when ripe.",
        "difficulty": "Easy",
        "germ_temp": "70-80°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Balanced at planting; low-nitrogen once flowering.",
        "companions": [
            "Basil",
            "Marigolds",
            "Squash"
        ],
        "avoid": [
            "Fennel",
            "Brassicas"
        ],
        "pests": [
            "Aphids",
            "Hornworm",
            "Flea Beetles"
        ],
        "harvest_cues": "Husk fills out fully and starts to split or brown; fruit firm inside.",
        "storage": "Counter in husk 1-2 weeks; fridge up to 3 weeks.",
        "varieties": [
            "Toma Verde",
            "Purple Tomatillo",
            "Pineapple"
        ]
    },
    "Tomatoes": {
        "emoji": "🍅",
        "depth": "1/4 in",
        "spacing": "18-24 in",
        "water": "Deep, 2x/week",
        "sun": "Full sun",
        "days": "60-85 days",
        "tip": "Stake or cage early.",
        "difficulty": "Moderate",
        "germ_temp": "70-80°F",
        "soil_ph": "6.0-6.8",
        "fertilizer": "Balanced at planting; low-nitrogen once flowering.",
        "companions": [
            "Basil",
            "Carrots",
            "Marigolds"
        ],
        "avoid": [
            "Fennel",
            "Brassicas"
        ],
        "pests": [
            "Aphids",
            "Hornworm",
            "Whitefly"
        ],
        "harvest_cues": "Fully colored and slightly soft; twist to test.",
        "storage": "Counter at room temp; use within 1 week.",
        "varieties": [
            "Sun Gold",
            "Roma",
            "Cherokee Purple"
        ]
    },
    "Turmeric": {
        "emoji": "🟡",
        "depth": "2-4 in (rhizome)",
        "spacing": "12-18 in",
        "water": "1-2 in/week",
        "sun": "Partial shade/full sun",
        "days": "8-10 months",
        "tip": "Similar to ginger — long season tropical. Start rhizomes indoors 8 weeks early in cool zones.",
        "difficulty": "Moderate",
        "germ_temp": "65-80°F (soil temp)",
        "soil_ph": "5.5-7.0",
        "fertilizer": "Monthly balanced; high potassium before harvest.",
        "companions": [
            "Ginger",
            "Lemongrass",
            "Peppers"
        ],
        "avoid": [],
        "pests": [
            "Rhizome Scale",
            "Root Knot Nematode"
        ],
        "harvest_cues": "Leaves yellow and drop in fall; rhizomes bright orange when scraped.",
        "storage": "Fridge up to 1 month; dry and grind; freeze.",
        "varieties": [
            "Common (Curcuma longa)",
            "Mango Ginger"
        ]
    },
    "Turnips": {
        "emoji": "🌿",
        "depth": "1/4-1/2 in",
        "spacing": "4-6 in",
        "water": "1 in/week",
        "sun": "Full sun",
        "days": "40-60 days",
        "tip": "Thin early for best root development; greens are edible and nutritious.",
        "difficulty": "Easy",
        "germ_temp": "45-85°F",
        "soil_ph": "6.0-7.0",
        "fertilizer": "Moderate balanced; avoid excess nitrogen.",
        "companions": [
            "Peas",
            "Beans",
            "Herbs"
        ],
        "avoid": [
            "Mustard"
        ],
        "pests": [
            "Cabbage Maggot",
            "Aphids",
            "Flea Beetles"
        ],
        "harvest_cues": "Roots 2-3 inches; younger is more tender.",
        "storage": "Fridge up to 2 weeks; cool cellar up to a month.",
        "varieties": [
            "Purple Top White Globe",
            "Hakurei",
            "Golden Globe"
        ]
    },
    "Watercress": {
        "emoji": "🌿",
        "depth": "Surface (scatter seed)",
        "spacing": "6-8 in",
        "water": "Consistently moist/wet",
        "sun": "Partial shade",
        "days": "40-50 days",
        "tip": "Needs consistently moist or flowing water; excellent in containers with wet saucers.",
        "difficulty": "Moderate",
        "germ_temp": "55-70°F",
        "soil_ph": "6.5-7.5",
        "fertilizer": "Light; grows well in nutrient-rich water.",
        "companions": [
            "Mint",
            "Spearmint"
        ],
        "avoid": [],
        "pests": [
            "Aphids",
            "Watercress Beetle"
        ],
        "harvest_cues": "Stems 6-8 inches; harvest tips to encourage bushiness.",
        "storage": "Fridge in water up to 5 days.",
        "varieties": [
            "Common Watercress",
            "Upland Cress"
        ]
    }
}


PLANTING_RAW = {'Zone 3a': {2: {'startIndoors': ['Onions', 'Leeks', 'Shallots', 'Chives']}, 3: {'startIndoors': ['Tomatoes', 'Peppers', 'Eggplant', 'Celery', 'Tomatillos', 'Ground Cherries', 'Cauliflower', 'Parsley', 'Celeriac']}, 4: {'startIndoors': ['Squash', 'Cucumbers', 'Melons', 'Brussels Sprouts', 'Kohlrabi', 'Bok Choy', 'Endive'], 'directSow': ['Spinach', 'Kale', 'Lettuce', 'Arugula', 'Mâche', 'Mustard Greens', 'Turnips', 'Green Onions'], 'transplant': ['Onions', 'Shallots', 'Asparagus', 'Rhubarb', 'Horseradish', 'Strawberries']}, 5: {'directSow': ['Peas', 'Radishes', 'Carrots', 'Beets', 'Potatoes', 'Parsnips', 'Cilantro', 'Dill', 'Fava Beans', 'Fennel', 'Watercress'], 'transplant': ['Broccoli', 'Cabbage', 'Cauliflower', 'Chives', 'Sage', 'Thyme', 'Mint', 'Collard Greens']}, 6: {'directSow': ['Beans', 'Corn', 'Squash', 'Rutabaga', 'Bok Choy', 'Edamame'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Basil', 'Tomatillos', 'Ground Cherries', 'Rosemary', 'Oregano', 'Celeriac', 'Endive'], 'harvest': ['Lettuce', 'Radishes', 'Spinach', 'Arugula', 'Mustard Greens', 'Turnips', 'Kohlrabi', 'Fava Beans', 'Watercress']}, 7: {'directSow': ['Cucumbers', 'Beans'], 'transplant': ['Squash', 'Cucumbers', 'Melons'], 'harvest': ['Peas', 'Lettuce', 'Kale', 'Bok Choy', 'Green Onions', 'Fennel']}, 8: {'harvest': ['Beans', 'Cucumbers', 'Squash', 'Tomatoes', 'Tomatillos', 'Ground Cherries', 'Potatoes', 'Strawberries', 'Broccoli', 'Cauliflower', 'Edamame', 'Endive', 'Watercress']}, 9: {'startIndoors': ['Broccoli', 'Cabbage', 'Kale'], 'harvest': ['Tomatoes', 'Peppers', 'Corn', 'Melons', 'Carrots', 'Parsnips', 'Rutabaga', 'Beets', 'Collard Greens', 'Celeriac', 'Fennel']}, 10: {'directSow': ['Spinach', 'Lettuce'], 'transplant': ['Broccoli', 'Kale'], 'harvest': ['Squash', 'Pumpkins', 'Brussels Sprouts', 'Rutabaga', 'Collard Greens', 'Celeriac']}, 11: {'harvest': ['Broccoli', 'Kale', 'Carrots', 'Beets', 'Jerusalem Artichoke', 'Collard Greens']}}, 'Zone 4a': {2: {'startIndoors': ['Onions', 'Leeks', 'Celery', 'Shallots', 'Chives', 'Parsley']}, 3: {'startIndoors': ['Tomatoes', 'Peppers', 'Eggplant', 'Broccoli', 'Cabbage', 'Cauliflower', 'Brussels Sprouts', 'Tomatillos', 'Ground Cherries', 'Celeriac', 'Collard Greens']}, 4: {'startIndoors': ['Squash', 'Cucumbers', 'Melons', 'Basil', 'Kohlrabi', 'Bok Choy', 'Globe Artichoke', 'Endive'], 'directSow': ['Spinach', 'Kale', 'Lettuce', 'Peas', 'Arugula', 'Mâche', 'Turnips', 'Green Onions'], 'transplant': ['Onions', 'Broccoli', 'Shallots', 'Asparagus', 'Rhubarb', 'Horseradish', 'Strawberries']}, 5: {'directSow': ['Radishes', 'Carrots', 'Beets', 'Chard', 'Potatoes', 'Parsnips', 'Cilantro', 'Dill', 'Fava Beans', 'Fennel', 'Watercress'], 'transplant': ['Cabbage', 'Lettuce', 'Cauliflower', 'Sage', 'Thyme', 'Mint', 'Chives', 'Collard Greens'], 'harvest': ['Spinach', 'Radishes', 'Arugula', 'Mâche', 'Turnips']}, 6: {'directSow': ['Beans', 'Corn', 'Squash', 'Cucumbers', 'Rutabaga', 'Edamame'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Basil', 'Squash', 'Tomatillos', 'Ground Cherries', 'Rosemary', 'Oregano', 'Globe Artichoke', 'Celeriac', 'Endive'], 'harvest': ['Peas', 'Lettuce', 'Kale', 'Bok Choy', 'Kohlrabi', 'Fava Beans', 'Watercress']}, 7: {'directSow': ['Beans', 'Carrots', 'Bok Choy', 'Turnips'], 'harvest': ['Beans', 'Cucumbers', 'Squash', 'Beets', 'Green Onions', 'Fennel']}, 8: {'startIndoors': ['Broccoli', 'Kale'], 'harvest': ['Tomatoes', 'Peppers', 'Corn', 'Cucumbers', 'Beans', 'Tomatillos', 'Ground Cherries', 'Potatoes', 'Strawberries', 'Edamame', 'Endive', 'Celeriac']}, 9: {'directSow': ['Spinach', 'Lettuce', 'Kale'], 'transplant': ['Broccoli', 'Kale', 'Cauliflower'], 'harvest': ['Tomatoes', 'Peppers', 'Squash', 'Melons', 'Rutabaga', 'Collard Greens', 'Fennel']}, 10: {'harvest': ['Broccoli', 'Kale', 'Squash', 'Pumpkins', 'Carrots', 'Parsnips', 'Brussels Sprouts', 'Cauliflower', 'Collard Greens']}, 11: {'harvest': ['Kale', 'Beets', 'Carrots', 'Jerusalem Artichoke', 'Collard Greens']}}, 'Zone 5b': {2: {'startIndoors': ['Onions', 'Leeks', 'Celery', 'Peppers', 'Shallots', 'Chives', 'Parsley']}, 3: {'startIndoors': ['Tomatoes', 'Eggplant', 'Broccoli', 'Cabbage', 'Basil', 'Cauliflower', 'Brussels Sprouts', 'Tomatillos', 'Ground Cherries', 'Globe Artichoke', 'Celeriac', 'Collard Greens'], 'directSow': ['Peas', 'Spinach', 'Kale'], 'transplant': ['Onions', 'Shallots']}, 4: {'startIndoors': ['Squash', 'Cucumbers', 'Melons', 'Kohlrabi', 'Bok Choy', 'Endive'], 'directSow': ['Lettuce', 'Radishes', 'Carrots', 'Beets', 'Chard', 'Arugula', 'Mâche', 'Turnips', 'Green Onions', 'Cilantro', 'Dill', 'Fava Beans', 'Watercress'], 'transplant': ['Broccoli', 'Cabbage', 'Cauliflower', 'Asparagus', 'Rhubarb', 'Horseradish', 'Strawberries', 'Chives', 'Sage', 'Thyme', 'Mint', 'Collard Greens'], 'harvest': ['Spinach', 'Kale']}, 5: {'directSow': ['Beans', 'Corn', 'Squash', 'Cucumbers', 'Potatoes', 'Parsnips', 'Fennel', 'Edamame'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Basil', 'Squash', 'Cucumbers', 'Tomatillos', 'Ground Cherries', 'Globe Artichoke', 'Rosemary', 'Oregano', 'Celeriac', 'Endive'], 'harvest': ['Peas', 'Lettuce', 'Radishes', 'Arugula', 'Turnips', 'Kohlrabi', 'Fava Beans']}, 6: {'directSow': ['Beans', 'Carrots', 'Beets', 'Rutabaga', 'Bok Choy'], 'transplant': ['Melons'], 'harvest': ['Lettuce', 'Kale', 'Beets', 'Carrots', 'Broccoli', 'Cauliflower', 'Bok Choy', 'Green Onions', 'Peas', 'Watercress', 'Fennel']}, 7: {'startIndoors': ['Broccoli', 'Kale', 'Cabbage'], 'directSow': ['Turnips'], 'harvest': ['Beans', 'Cucumbers', 'Squash', 'Beets', 'Tomatoes', 'Potatoes', 'Strawberries', 'Endive']}, 8: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Radishes', 'Arugula', 'Mustard Greens', 'Bok Choy'], 'transplant': ['Broccoli', 'Kale', 'Cabbage', 'Cauliflower'], 'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Corn', 'Beans', 'Tomatillos', 'Ground Cherries', 'Edamame']}, 9: {'directSow': ['Spinach', 'Mâche'], 'harvest': ['Tomatoes', 'Peppers', 'Squash', 'Melons', 'Pumpkins', 'Rutabaga', 'Celeriac', 'Collard Greens']}, 10: {'harvest': ['Broccoli', 'Kale', 'Cabbage', 'Carrots', 'Beets', 'Squash', 'Parsnips', 'Brussels Sprouts', 'Cauliflower', 'Collard Greens', 'Celeriac']}, 11: {'harvest': ['Kale', 'Carrots', 'Jerusalem Artichoke', 'Mâche', 'Collard Greens']}}, 'Zone 6b': {1: {'startIndoors': ['Onions', 'Leeks', 'Shallots']}, 2: {'startIndoors': ['Peppers', 'Celery', 'Broccoli', 'Cabbage', 'Cauliflower', 'Brussels Sprouts', 'Globe Artichoke', 'Parsley', 'Celeriac', 'Collard Greens'], 'transplant': ['Onions', 'Shallots']}, 3: {'startIndoors': ['Tomatoes', 'Eggplant', 'Basil', 'Squash', 'Tomatillos', 'Ground Cherries', 'Kohlrabi', 'Bok Choy', 'Endive'], 'directSow': ['Peas', 'Spinach', 'Kale', 'Lettuce', 'Radishes', 'Arugula', 'Mâche', 'Turnips', 'Green Onions', 'Cilantro', 'Dill', 'Fava Beans', 'Watercress'], 'transplant': ['Broccoli', 'Cabbage', 'Cauliflower', 'Asparagus', 'Rhubarb', 'Horseradish', 'Strawberries', 'Collard Greens']}, 4: {'startIndoors': ['Cucumbers', 'Melons'], 'directSow': ['Carrots', 'Beets', 'Chard', 'Potatoes', 'Parsnips', 'Fennel'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Chives', 'Sage', 'Thyme', 'Mint', 'Celeriac', 'Endive'], 'harvest': ['Spinach', 'Lettuce', 'Radishes', 'Peas', 'Arugula', 'Turnips', 'Kohlrabi', 'Fava Beans', 'Watercress']}, 5: {'directSow': ['Beans', 'Corn', 'Squash', 'Cucumbers', 'Peanuts', 'Rutabaga', 'Bok Choy', 'Edamame'], 'transplant': ['Basil', 'Squash', 'Cucumbers', 'Melons', 'Tomatillos', 'Ground Cherries', 'Globe Artichoke', 'Rosemary', 'Oregano'], 'harvest': ['Lettuce', 'Kale', 'Broccoli', 'Beets', 'Carrots', 'Cauliflower', 'Bok Choy', 'Green Onions', 'Fennel', 'Collard Greens']}, 6: {'startIndoors': ['Broccoli', 'Kale'], 'directSow': ['Beans', 'Carrots'], 'harvest': ['Beans', 'Cucumbers', 'Squash', 'Tomatoes', 'Peppers', 'Peas', 'Strawberries', 'Potatoes', 'Watercress']}, 7: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Beets', 'Arugula', 'Turnips', 'Bok Choy', 'Mustard Greens', 'Endive'], 'transplant': ['Broccoli', 'Kale', 'Cauliflower'], 'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Corn', 'Beans', 'Cucumbers', 'Tomatillos', 'Ground Cherries', 'Edamame', 'Celeriac']}, 8: {'directSow': ['Radishes', 'Carrots', 'Chard', 'Mâche', 'Cilantro', 'Watercress'], 'harvest': ['Tomatoes', 'Peppers', 'Squash', 'Melons', 'Peanuts']}, 9: {'directSow': ['Spinach', 'Peas'], 'harvest': ['Squash', 'Pumpkins', 'Sweet Potatoes', 'Peppers', 'Parsnips', 'Rutabaga', 'Brussels Sprouts', 'Endive', 'Celeriac', 'Collard Greens']}, 10: {'harvest': ['Broccoli', 'Kale', 'Carrots', 'Beets', 'Cabbage', 'Cauliflower', 'Turnips', 'Collard Greens']}, 11: {'startIndoors': ['Onions'], 'harvest': ['Kale', 'Carrots', 'Jerusalem Artichoke', 'Mâche', 'Collard Greens']}}, 'Zone 7b': {1: {'startIndoors': ['Onions', 'Leeks', 'Broccoli', 'Cabbage', 'Cauliflower', 'Shallots', 'Parsley', 'Celeriac'], 'directSow': ['Spinach', 'Kale', 'Lettuce', 'Mâche', 'Fava Beans'], 'harvest': ['Kale', 'Spinach', 'Carrots']}, 2: {'startIndoors': ['Peppers', 'Celery', 'Tomatoes', 'Eggplant', 'Brussels Sprouts', 'Tomatillos', 'Ground Cherries', 'Globe Artichoke', 'Collard Greens'], 'directSow': ['Peas', 'Radishes', 'Chard', 'Arugula', 'Turnips', 'Green Onions', 'Cilantro', 'Watercress'], 'transplant': ['Onions', 'Broccoli', 'Cabbage', 'Cauliflower', 'Shallots', 'Strawberries'], 'harvest': ['Lettuce', 'Spinach', 'Kale', 'Mâche', 'Fava Beans']}, 3: {'startIndoors': ['Basil', 'Squash', 'Cucumbers', 'Melons', 'Kohlrabi', 'Bok Choy', 'Endive'], 'directSow': ['Carrots', 'Beets', 'Lettuce', 'Potatoes', 'Parsnips', 'Dill', 'Mustard Greens', 'Fennel'], 'transplant': ['Tomatoes', 'Peppers', 'Celery', 'Asparagus', 'Rhubarb', 'Horseradish', 'Chives', 'Sage', 'Thyme', 'Mint', 'Celeriac', 'Collard Greens'], 'harvest': ['Peas', 'Lettuce', 'Radishes', 'Broccoli', 'Arugula', 'Turnips', 'Kohlrabi', 'Watercress']}, 4: {'directSow': ['Beans', 'Corn', 'Peanuts', 'Edamame'], 'transplant': ['Basil', 'Squash', 'Cucumbers', 'Melons', 'Eggplant', 'Tomatillos', 'Ground Cherries', 'Globe Artichoke', 'Rosemary', 'Oregano', 'Endive'], 'harvest': ['Lettuce', 'Spinach', 'Kale', 'Beets', 'Carrots', 'Cauliflower', 'Bok Choy', 'Green Onions', 'Strawberries', 'Fennel', 'Celeriac']}, 5: {'directSow': ['Squash', 'Cucumbers', 'Sweet Potatoes', 'Rutabaga'], 'harvest': ['Beans', 'Beets', 'Broccoli', 'Cabbage', 'Carrots', 'Potatoes', 'Peas', 'Watercress', 'Endive']}, 6: {'startIndoors': ['Broccoli', 'Kale', 'Cabbage'], 'directSow': ['Beans', 'Okra', 'Bok Choy'], 'harvest': ['Cucumbers', 'Squash', 'Tomatoes', 'Peppers', 'Beans', 'Tomatillos', 'Ground Cherries', 'Edamame', 'Collard Greens']}, 7: {'startIndoors': ['Brussels Sprouts', 'Cauliflower'], 'directSow': ['Beans', 'Beets', 'Carrots'], 'transplant': ['Broccoli', 'Kale', 'Cabbage'], 'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Okra', 'Corn', 'Peanuts', 'Celeriac']}, 8: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Radishes', 'Arugula', 'Turnips', 'Mâche', 'Cilantro', 'Mustard Greens', 'Endive', 'Watercress'], 'transplant': ['Brussels Sprouts', 'Cauliflower'], 'harvest': ['Tomatoes', 'Peppers', 'Squash', 'Melons', 'Sweet Potatoes', 'Bok Choy']}, 9: {'directSow': ['Peas', 'Chard', 'Carrots', 'Beets', 'Green Onions', 'Bok Choy', 'Fava Beans'], 'harvest': ['Squash', 'Pumpkins', 'Peppers', 'Eggplant', 'Rutabaga', 'Endive', 'Celeriac']}, 10: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Garlic', 'Shallots'], 'transplant': ['Strawberries'], 'harvest': ['Broccoli', 'Kale', 'Carrots', 'Beets', 'Cabbage', 'Cauliflower', 'Brussels Sprouts', 'Parsnips', 'Collard Greens', 'Fennel']}, 11: {'startIndoors': ['Onions'], 'directSow': ['Spinach', 'Lettuce'], 'harvest': ['Kale', 'Carrots', 'Beets', 'Broccoli', 'Jerusalem Artichoke', 'Mâche', 'Fava Beans', 'Collard Greens']}, 12: {'startIndoors': ['Onions', 'Leeks', 'Celeriac'], 'harvest': ['Kale', 'Carrots', 'Spinach', 'Mâche']}}, 'Zone 8b': {1: {'startIndoors': ['Onions', 'Leeks', 'Tomatoes', 'Peppers', 'Broccoli', 'Cauliflower', 'Tomatillos', 'Shallots', 'Parsley', 'Celeriac'], 'directSow': ['Spinach', 'Kale', 'Lettuce', 'Peas', 'Arugula', 'Mâche', 'Cilantro', 'Fava Beans', 'Watercress', 'Endive'], 'harvest': ['Kale', 'Spinach', 'Broccoli', 'Carrots']}, 2: {'startIndoors': ['Eggplant', 'Celery', 'Basil', 'Brussels Sprouts', 'Globe Artichoke', 'Ginger', 'Turmeric', 'Lemongrass', 'Collard Greens'], 'directSow': ['Radishes', 'Chard', 'Beets', 'Carrots', 'Turnips', 'Green Onions', 'Fennel'], 'transplant': ['Onions', 'Broccoli', 'Lettuce', 'Shallots', 'Cauliflower', 'Asparagus', 'Rhubarb', 'Strawberries', 'Celeriac', 'Endive'], 'harvest': ['Lettuce', 'Spinach', 'Kale', 'Peas', 'Arugula', 'Mâche', 'Fava Beans', 'Watercress']}, 3: {'startIndoors': ['Squash', 'Cucumbers', 'Melons', 'Kohlrabi', 'Bok Choy'], 'directSow': ['Beans', 'Corn', 'Potatoes', 'Parsnips', 'Dill', 'Cilantro', 'Mustard Greens', 'Edamame'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Celery', 'Chives', 'Sage', 'Thyme', 'Mint', 'Collard Greens'], 'harvest': ['Broccoli', 'Cauliflower', 'Radishes', 'Lettuce', 'Peas', 'Turnips', 'Kohlrabi', 'Bok Choy', 'Fennel', 'Endive']}, 4: {'directSow': ['Squash', 'Cucumbers', 'Sweet Potatoes', 'Okra', 'Peanuts'], 'transplant': ['Basil', 'Squash', 'Cucumbers', 'Melons', 'Tomatillos', 'Globe Artichoke', 'Ginger', 'Turmeric', 'Lemongrass', 'Rosemary', 'Oregano'], 'harvest': ['Lettuce', 'Spinach', 'Beets', 'Carrots', 'Kale', 'Bok Choy', 'Arugula', 'Green Onions', 'Strawberries', 'Fava Beans', 'Watercress', 'Celeriac']}, 5: {'directSow': ['Beans', 'Okra'], 'harvest': ['Tomatoes', 'Beans', 'Cucumbers', 'Squash', 'Potatoes', 'Tomatillos', 'Edamame']}, 6: {'startIndoors': ['Broccoli', 'Kale', 'Cabbage'], 'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Okra', 'Corn', 'Squash', 'Melons', 'Peanuts', 'Collard Greens']}, 7: {'startIndoors': ['Brussels Sprouts', 'Cauliflower'], 'directSow': ['Beans', 'Carrots', 'Beets'], 'transplant': ['Broccoli', 'Kale', 'Cabbage'], 'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Squash', 'Melons', 'Celeriac']}, 8: {'startIndoors': ['Kohlrabi', 'Bok Choy'], 'directSow': ['Spinach', 'Lettuce', 'Kale', 'Radishes', 'Peas', 'Arugula', 'Turnips', 'Cilantro', 'Watercress', 'Endive'], 'transplant': ['Brussels Sprouts', 'Cauliflower', 'Collard Greens'], 'harvest': ['Tomatoes', 'Peppers', 'Sweet Potatoes', 'Corn', 'Okra']}, 9: {'directSow': ['Peas', 'Chard', 'Carrots', 'Beets', 'Broccoli', 'Mâche', 'Mustard Greens', 'Green Onions', 'Fennel', 'Fava Beans'], 'transplant': ['Strawberries'], 'harvest': ['Squash', 'Pumpkins', 'Peppers', 'Eggplant', 'Beans', 'Kohlrabi', 'Bok Choy', 'Ginger', 'Turmeric', 'Watercress', 'Endive']}, 10: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Garlic', 'Onions', 'Shallots', 'Cilantro'], 'transplant': ['Broccoli'], 'harvest': ['Broccoli', 'Kale', 'Carrots', 'Beets', 'Cabbage', 'Brussels Sprouts', 'Cauliflower', 'Collard Greens', 'Fennel', 'Celeriac']}, 11: {'directSow': ['Spinach', 'Lettuce', 'Peas', 'Fava Beans'], 'harvest': ['Kale', 'Carrots', 'Beets', 'Broccoli', 'Lettuce', 'Cauliflower', 'Parsnips', 'Mâche', 'Collard Greens']}, 12: {'startIndoors': ['Onions', 'Leeks', 'Celeriac'], 'directSow': ['Spinach', 'Kale'], 'harvest': ['Kale', 'Carrots', 'Spinach', 'Broccoli', 'Lemongrass']}}, 'Zone 9b': {1: {'startIndoors': ['Tomatoes', 'Peppers', 'Eggplant', 'Basil', 'Cauliflower', 'Brussels Sprouts', 'Tomatillos', 'Shallots', 'Celeriac'], 'directSow': ['Peas', 'Spinach', 'Kale', 'Lettuce', 'Carrots', 'Beets', 'Arugula', 'Mâche', 'Cilantro', 'Turnips', 'Bok Choy', 'Fava Beans', 'Watercress', 'Endive'], 'harvest': ['Kale', 'Spinach', 'Broccoli', 'Carrots', 'Lettuce']}, 2: {'startIndoors': ['Squash', 'Cucumbers', 'Melons', 'Ginger', 'Turmeric', 'Lemongrass', 'Collard Greens'], 'directSow': ['Radishes', 'Chard', 'Broccoli', 'Green Onions', 'Dill', 'Mustard Greens', 'Potatoes', 'Fennel'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Basil', 'Cauliflower', 'Asparagus', 'Rhubarb', 'Strawberries', 'Celeriac', 'Endive'], 'harvest': ['Peas', 'Lettuce', 'Spinach', 'Broccoli', 'Radishes', 'Arugula', 'Bok Choy', 'Turnips', 'Fava Beans', 'Watercress']}, 3: {'directSow': ['Beans', 'Corn', 'Squash', 'Cucumbers', 'Okra', 'Parsnips', 'Peanuts', 'Edamame'], 'transplant': ['Squash', 'Cucumbers', 'Melons', 'Ginger', 'Turmeric', 'Lemongrass', 'Chives', 'Sage', 'Thyme', 'Mint', 'Rosemary', 'Oregano', 'Collard Greens'], 'harvest': ['Lettuce', 'Kale', 'Beets', 'Carrots', 'Peas', 'Bok Choy', 'Kohlrabi', 'Potatoes', 'Cauliflower', 'Fennel', 'Endive', 'Watercress']}, 4: {'directSow': ['Sweet Potatoes', 'Okra'], 'transplant': ['Globe Artichoke', 'Tomatillos'], 'harvest': ['Tomatoes', 'Beans', 'Cucumbers', 'Squash', 'Green Onions', 'Strawberries', 'Arugula', 'Fava Beans', 'Collard Greens', 'Celeriac']}, 5: {'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Okra', 'Corn', 'Peanuts', 'Edamame']}, 6: {'startIndoors': ['Broccoli', 'Kale', 'Cabbage', 'Onions'], 'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Okra', 'Sweet Potatoes', 'Melons', 'Tomatillos', 'Collard Greens']}, 7: {'startIndoors': ['Cauliflower', 'Brussels Sprouts', 'Kohlrabi', 'Bok Choy'], 'directSow': ['Beans', 'Squash', 'Cucumbers'], 'transplant': ['Broccoli', 'Kale', 'Cabbage'], 'harvest': ['Peppers', 'Eggplant', 'Okra', 'Ginger', 'Turmeric']}, 8: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Radishes', 'Carrots', 'Beets', 'Peas', 'Arugula', 'Turnips', 'Mâche', 'Cilantro', 'Mustard Greens', 'Fava Beans', 'Watercress'], 'transplant': ['Cauliflower', 'Brussels Sprouts', 'Kohlrabi', 'Bok Choy', 'Strawberries', 'Collard Greens'], 'harvest': ['Beans', 'Squash', 'Sweet Potatoes', 'Lemongrass']}, 9: {'directSow': ['Chard', 'Broccoli', 'Cabbage', 'Green Onions', 'Dill', 'Endive', 'Fennel'], 'transplant': ['Potatoes'], 'harvest': ['Peppers', 'Eggplant', 'Squash', 'Pumpkins', 'Kohlrabi', 'Bok Choy', 'Watercress']}, 10: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Garlic', 'Onions', 'Peas', 'Cilantro'], 'transplant': ['Broccoli', 'Cabbage', 'Cauliflower'], 'harvest': ['Broccoli', 'Kale', 'Carrots', 'Beets', 'Brussels Sprouts', 'Parsnips', 'Endive', 'Celeriac']}, 11: {'startIndoors': ['Tomatoes', 'Peppers'], 'directSow': ['Spinach', 'Lettuce', 'Arugula', 'Turnips', 'Bok Choy', 'Mâche', 'Fava Beans'], 'harvest': ['Kale', 'Carrots', 'Beets', 'Broccoli', 'Lettuce', 'Cauliflower', 'Potatoes', 'Collard Greens', 'Fennel']}, 12: {'startIndoors': ['Tomatoes', 'Peppers', 'Eggplant', 'Celeriac'], 'directSow': ['Spinach', 'Kale', 'Carrots', 'Peas', 'Watercress'], 'harvest': ['Kale', 'Carrots', 'Spinach', 'Broccoli', 'Lettuce', 'Brussels Sprouts', 'Mâche', 'Fava Beans']}}, 'Zone 10a': {1: {'directSow': ['Tomatoes', 'Peppers', 'Eggplant', 'Beans', 'Corn', 'Squash', 'Cucumbers', 'Peas', 'Lettuce', 'Kale', 'Spinach', 'Carrots', 'Beets', 'Arugula', 'Bok Choy', 'Turnips', 'Cilantro', 'Mâche', 'Fava Beans', 'Watercress', 'Endive', 'Fennel'], 'harvest': ['Kale', 'Spinach', 'Broccoli', 'Carrots', 'Lettuce', 'Tomatoes', 'Cauliflower', 'Collard Greens', 'Celeriac']}, 2: {'startIndoors': ['Ginger', 'Turmeric', 'Lemongrass'], 'directSow': ['Melons', 'Okra', 'Sweet Potatoes', 'Basil', 'Potatoes', 'Peanuts', 'Green Onions', 'Dill', 'Mustard Greens', 'Edamame'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Asparagus', 'Rhubarb', 'Strawberries', 'Endive'], 'harvest': ['Peas', 'Lettuce', 'Spinach', 'Broccoli', 'Beans', 'Arugula', 'Bok Choy', 'Fava Beans', 'Watercress', 'Fennel']}, 3: {'directSow': ['Beans', 'Corn', 'Squash', 'Cucumbers', 'Okra'], 'transplant': ['Squash', 'Cucumbers', 'Melons', 'Basil', 'Ginger', 'Turmeric', 'Lemongrass', 'Chives', 'Sage', 'Thyme', 'Mint', 'Rosemary', 'Oregano', 'Collard Greens'], 'harvest': ['Tomatoes', 'Beans', 'Cucumbers', 'Squash', 'Kale', 'Cauliflower', 'Broccoli', 'Turnips', 'Kohlrabi', 'Fava Beans', 'Celeriac']}, 4: {'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Okra', 'Corn', 'Melons', 'Strawberries', 'Bok Choy', 'Peas', 'Edamame', 'Collard Greens']}, 5: {'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Okra', 'Sweet Potatoes', 'Peanuts', 'Edamame']}, 6: {'startIndoors': ['Broccoli', 'Kale', 'Cabbage', 'Onions'], 'harvest': ['Peppers', 'Eggplant', 'Okra', 'Sweet Potatoes', 'Melons', 'Ginger', 'Turmeric', 'Collard Greens']}, 7: {'directSow': ['Beans', 'Squash', 'Cucumbers'], 'transplant': ['Broccoli', 'Kale', 'Cabbage'], 'harvest': ['Peppers', 'Eggplant', 'Okra', 'Lemongrass', 'Collard Greens']}, 8: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Carrots', 'Beets', 'Peas', 'Broccoli', 'Arugula', 'Turnips', 'Cilantro', 'Mâche', 'Mustard Greens', 'Bok Choy', 'Fava Beans', 'Watercress', 'Endive', 'Fennel'], 'transplant': ['Strawberries'], 'harvest': ['Beans', 'Squash', 'Sweet Potatoes']}, 9: {'directSow': ['Chard', 'Cabbage', 'Tomatoes', 'Peppers', 'Green Onions', 'Dill', 'Edamame'], 'transplant': ['Potatoes'], 'harvest': ['Peppers', 'Eggplant', 'Squash', 'Pumpkins', 'Bok Choy', 'Arugula', 'Turnips']}, 10: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Garlic', 'Onions', 'Carrots', 'Beets', 'Cilantro', 'Mâche', 'Peas', 'Fava Beans', 'Watercress'], 'transplant': ['Broccoli', 'Cabbage', 'Tomatoes', 'Peppers', 'Cauliflower', 'Collard Greens'], 'harvest': ['Broccoli', 'Kale', 'Carrots', 'Beets', 'Tomatoes', 'Cauliflower', 'Potatoes', 'Endive', 'Fennel']}, 11: {'directSow': ['Tomatoes', 'Beans', 'Corn', 'Squash', 'Cucumbers', 'Arugula', 'Turnips', 'Bok Choy', 'Green Onions', 'Edamame'], 'harvest': ['Kale', 'Carrots', 'Beets', 'Broccoli', 'Lettuce', 'Tomatoes', 'Cauliflower', 'Collard Greens', 'Celeriac']}, 12: {'directSow': ['Tomatoes', 'Peppers', 'Eggplant', 'Spinach', 'Kale', 'Carrots', 'Peas', 'Beans', 'Cilantro', 'Mâche', 'Fava Beans', 'Watercress', 'Fennel', 'Endive'], 'harvest': ['Kale', 'Carrots', 'Spinach', 'Broccoli', 'Lettuce', 'Tomatoes', 'Collard Greens']}}, 'Zone 11a': {1: {'directSow': ['Tomatoes', 'Peppers', 'Eggplant', 'Beans', 'Corn', 'Squash', 'Cucumbers', 'Melons', 'Okra', 'Basil', 'Lettuce', 'Kale', 'Arugula', 'Bok Choy', 'Turnips', 'Green Onions', 'Cilantro', 'Fava Beans', 'Watercress', 'Endive', 'Fennel'], 'harvest': ['Tomatoes', 'Peppers', 'Beans', 'Cucumbers', 'Squash', 'Lettuce', 'Cauliflower', 'Collard Greens', 'Celeriac']}, 2: {'directSow': ['Sweet Potatoes', 'Pumpkins', 'Peanuts', 'Potatoes', 'Edamame'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Basil', 'Ginger', 'Turmeric', 'Lemongrass', 'Collard Greens'], 'harvest': ['Tomatoes', 'Peppers', 'Beans', 'Cucumbers', 'Squash', 'Bok Choy', 'Arugula', 'Fava Beans', 'Watercress', 'Endive']}, 3: {'directSow': ['Beans', 'Corn', 'Squash', 'Cucumbers', 'Okra', 'Green Onions', 'Dill'], 'transplant': ['Asparagus', 'Rhubarb', 'Strawberries', 'Chives', 'Sage', 'Thyme', 'Mint', 'Rosemary', 'Oregano', 'Celeriac'], 'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Okra', 'Corn', 'Melons', 'Cauliflower', 'Broccoli', 'Fava Beans', 'Fennel']}, 4: {'harvest': ['Tomatoes', 'Peppers', 'Eggplant', 'Okra', 'Sweet Potatoes', 'Mangoes', 'Peanuts', 'Strawberries', 'Potatoes', 'Edamame', 'Collard Greens', 'Celeriac']}, 5: {'harvest': ['Peppers', 'Eggplant', 'Okra', 'Sweet Potatoes', 'Mangoes', 'Avocados', 'Ginger', 'Turmeric', 'Edamame']}, 6: {'harvest': ['Peppers', 'Eggplant', 'Okra', 'Sweet Potatoes', 'Avocados', 'Lemongrass', 'Collard Greens']}, 7: {'directSow': ['Beans', 'Squash', 'Cucumbers', 'Corn', 'Edamame'], 'harvest': ['Peppers', 'Eggplant', 'Okra', 'Avocados']}, 8: {'directSow': ['Tomatoes', 'Peppers', 'Eggplant', 'Lettuce', 'Kale', 'Spinach', 'Carrots', 'Beets', 'Arugula', 'Bok Choy', 'Turnips', 'Cilantro', 'Mustard Greens', 'Fava Beans', 'Watercress', 'Endive', 'Fennel'], 'harvest': ['Beans', 'Squash', 'Sweet Potatoes', 'Edamame']}, 9: {'startIndoors': ['Cauliflower', 'Broccoli'], 'directSow': ['Broccoli', 'Cabbage', 'Chard', 'Basil', 'Green Onions', 'Dill', 'Collard Greens'], 'transplant': ['Tomatoes', 'Peppers', 'Eggplant', 'Ginger', 'Turmeric', 'Lemongrass'], 'harvest': ['Squash', 'Pumpkins', 'Beans', 'Bok Choy', 'Arugula', 'Watercress', 'Fennel']}, 10: {'directSow': ['Spinach', 'Lettuce', 'Kale', 'Garlic', 'Onions', 'Carrots', 'Beets', 'Beans', 'Corn', 'Peas', 'Cilantro', 'Mâche', 'Fava Beans', 'Endive'], 'transplant': ['Broccoli', 'Cabbage', 'Cauliflower', 'Collard Greens', 'Celeriac'], 'harvest': ['Tomatoes', 'Peppers', 'Carrots', 'Beets', 'Ginger', 'Turmeric', 'Edamame']}, 11: {'directSow': ['Tomatoes', 'Peppers', 'Beans', 'Squash', 'Cucumbers', 'Arugula', 'Turnips', 'Bok Choy', 'Green Onions', 'Watercress'], 'harvest': ['Kale', 'Carrots', 'Beets', 'Broccoli', 'Lettuce', 'Tomatoes', 'Peppers', 'Cauliflower', 'Collard Greens', 'Fennel', 'Celeriac']}, 12: {'directSow': ['Tomatoes', 'Peppers', 'Eggplant', 'Beans', 'Corn', 'Squash', 'Cucumbers', 'Melons', 'Okra', 'Peas', 'Cilantro', 'Fava Beans', 'Watercress', 'Fennel', 'Endive'], 'harvest': ['Tomatoes', 'Peppers', 'Beans', 'Cucumbers', 'Squash', 'Kale', 'Carrots', 'Lettuce', 'Collard Greens']}}}


def build_planting_json(raw):
    result = {}
    for zone_key, months in raw.items():
        # Normalize: strip "Zone " prefix so keys are "3a", "4a", etc.
        zone = zone_key.replace("Zone ", "").strip()
        result[zone] = {}
        for m in range(1, 13):
            entry = months.get(m, {})
            result[zone][str(m)] = {
                "startIndoors": entry.get("startIndoors", []),
                "directSow":    entry.get("directSow", []),
                "transplant":   entry.get("transplant", []),
                "harvest":      entry.get("harvest", []),
            }
    return result


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    crops_path = os.path.join(data_dir, "crops.json")
    with open(crops_path, "w", encoding="utf-8") as f:
        json.dump(CROPS, f, indent=2, ensure_ascii=False)

    planting_data = build_planting_json(PLANTING_RAW)
    planting_path = os.path.join(data_dir, "planting.json")
    with open(planting_path, "w", encoding="utf-8") as f:
        json.dump(planting_data, f, indent=2, ensure_ascii=False)

    zones = list(planting_data.keys())
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print(f"✓ {len(CROPS)} crops → crops.json")
    print(f"✓ {len(zones)} zones → planting.json")
