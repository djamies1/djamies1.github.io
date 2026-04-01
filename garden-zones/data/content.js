// ── data/content.js ────────────────────────────
// Horticultural reference data — no side effects, no DOM, no state.

// ── Crop categories ────────────────────────────
export const CROP_CATEGORIES = {
  'Vegetables':  ['Celery','Cherry Tomatoes','Corn','Eggplant','Ground Cherries','Jalapeño','Microgreens','Okra','Peppers','Sweet Corn','Tomatillos','Tomatoes'],
  'Brassicas':   ['Bok Choy','Broccoli','Broccoli Rabe','Brussels Sprouts','Cabbage','Cauliflower','Collard Greens','Kale','Kohlrabi','Napa Cabbage'],
  'Root Veg':    ['Beets','Butternut Squash','Carrots','Celeriac','Daikon','Horseradish','Jerusalem Artichoke','Parsnips','Potatoes','Radishes','Rutabaga','Sweet Potatoes','Turnips'],
  'Greens':      ['Arugula','Chard','Endive','Lettuce','Mâche','Microgreens','Mustard Greens','Spinach','Watercress'],
  'Alliums':     ['Chives','Garlic','Green Onions','Leeks','Onions','Shallots'],
  'Legumes':     ['Beans','Edamame','Fava Beans','Lima Beans','Peanuts','Peas','Runner Beans','Snow Peas','Sugar Snap Peas'],
  'Cucurbits':   ['Butternut Squash','Cucumbers','Melons','Pumpkins','Squash','Watermelon','Zucchini'],
  'Herbs':       ['Basil','Bay Leaf','Chervil','Cilantro','Dill','Fennel','Lemon Balm','Mint','Oregano','Parsley','Rosemary','Sage','Sorrel','Tarragon','Thyme'],
  'Flowers':     ['Borage','Calendula','Chamomile','Echinacea','Lavender','Marigolds','Nasturtium','Sunflowers','Valerian','Viola','Yarrow'],
  'Fruits':      ['Blackberries','Blackcurrants','Blueberries','Gooseberries','Raspberries','Redcurrants'],
  'Perennials':  ['Asparagus','Globe Artichoke','Rhubarb','Strawberries'],
  'Tropical':    ['Avocados','Ginger','Lemongrass','Mangoes','Turmeric'],
  'Grains':      ['Amaranth','Corn','Quinoa','Sweet Corn'],
};

export const CROP_CATEGORY_MAP = Object.fromEntries(
  Object.entries(CROP_CATEGORIES).flatMap(([cat, crops]) => crops.map(crop => [crop, cat]))
);

// ── Phase 70: Harvest-to-table ideas ──────────
export const HARVEST_TO_TABLE = {
  'Tomatoes':        ['Caprese with mozzarella & basil', 'Homemade pasta sauce (simmer 30 min)', 'Oven-roasted with garlic & olive oil', 'Bruschetta'],
  'Cherry Tomatoes': ['Blistered in a hot pan with garlic', 'Halved in pasta salads', 'Caprese skewers', 'Toss into frittatas'],
  'Basil':           ['Classic pesto (basil, pine nuts, parmesan, olive oil)', 'Scatter over pizza & pasta', 'Muddle into cocktails', 'Infuse into oil'],
  'Lettuce':         ['Mixed garden salad', 'Lettuce cups with Asian-style fillings', 'Blend into green smoothies'],
  'Cucumbers':       ['Tzatziki', 'Quick pickles with dill & vinegar', 'Greek salad', 'Chilled cucumber soup'],
  'Zucchini':        ['Fritters with herb yoghurt', 'Spiralized zoodles', 'Stuffed & baked with cheese', 'Grilled with lemon & herbs'],
  'Squash':          ['Roasted wedges with sage butter', 'Squash soup with coconut milk', 'Stuffed squash boats', 'Risotto'],
  'Butternut Squash':['Roasted soup with ginger & cream', 'Stuffed & baked with quinoa', 'Squash risotto', 'Curry'],
  'Peppers':         ['Stuffed peppers with rice & mince', 'Roasted pepper sauce', 'Fajita filling', 'Pickled peppers'],
  'Jalapeño':        ['Jalapeño poppers with cream cheese', 'Homemade hot sauce', 'Pickled slices', 'Fresh salsa'],
  'Beans':           ['Simple buttered beans', 'Bean salad with lemon', 'Add to minestrone', 'Stir-fry with garlic & soy'],
  'Peas':            ['Pea & mint soup', 'Pea risotto', 'Mushy peas', 'Pasta primavera'],
  'Carrots':         ['Honey-glazed roasted carrots', 'Carrot & ginger soup', 'Raw sticks with hummus', 'Carrot cake'],
  'Kale':            ['Kale chips (baked with olive oil)', 'Massaged kale salad', 'Stir-fry with garlic', 'Add to soups & stews'],
  'Spinach':         ['Sautéed with garlic & butter', 'Spinach & feta tart', 'Add raw to smoothies', 'Saag curry'],
  'Garlic':          ['Roasted garlic spread', 'Garlic butter', 'Pickled cloves', 'Aioli'],
  'Onions':          ['French onion soup', 'Caramelised onion tart', 'Pickled red onion', 'Onion jam'],
  'Potatoes':        ['Crispy roast potatoes', 'Potato & bacon soup', 'Gratin dauphinois', 'Homemade gnocchi'],
  'Broccoli':        ['Roasted with parmesan', 'Broccoli cheese soup', 'Stir-fry with oyster sauce', 'Pasta with anchovies'],
  'Cauliflower':     ['Cauliflower steaks with tahini', 'Buffalo cauliflower bites', 'Cauliflower rice', 'Aloo gobi'],
  'Chard':           ['Sautéed with raisins & pine nuts', 'Chard & chickpea stew', 'Wilted in soups', 'Add to frittatas'],
  'Beets':           ['Borscht (beetroot soup)', 'Roasted with goat cheese & walnuts', 'Pickled beets', 'Beet & orange salad'],
  'Radishes':        ['Quick-pickled with lime & chilli', 'Sliced over tacos', 'Butter & salt on crusty bread'],
  'Corn':            ['Grilled corn with herb butter', 'Corn chowder', 'Sweet corn fritters', 'Elote (Mexican street corn)'],
  'Sweet Corn':      ['Grilled corn with herb butter', 'Corn chowder', 'Sweet corn fritters', 'Elote (Mexican street corn)'],
  'Pumpkins':        ['Pumpkin soup', 'Pumpkin pie', 'Roasted with cinnamon & honey', 'Pumpkin risotto'],
  'Leeks':           ['Leek & potato soup', 'Creamed leeks', 'Leek & cheese quiche', 'Braised leeks with wine'],
  'Parsnips':        ['Honey-roasted parsnips', 'Parsnip & apple soup', 'Curried parsnip soup', 'Root veg mash'],
  'Herbs':           ['Herb-infused oils', 'Chimichurri sauce', 'Fresh herb butter', 'Bouquet garni for stocks'],
  'Artichokes':      ['Steamed with garlic butter', 'Grilled artichoke hearts', 'Stuffed artichokes', 'Artichoke dip'],
};

// ── Phase 76: Smart shopping list data ─────────
export const SUPPLY_SUGGESTIONS = {
  'Tomatoes':    ['Tomato cages or tall stakes (5ft+)', 'Calcium spray (blossom end rot)'],
  'Cherry Tomatoes': ['Tomato cages or stakes (3ft)'],
  'Peppers':     ['Short stakes (2ft)', 'Horticultural fleece for early season'],
  'Cucumbers':   ['Trellis or vertical frame (5ft+)'],
  'Beans':       ['Tall cane supports (6ft)', 'Twine or netting'],
  'Peas':        ['Pea sticks or mesh netting (4ft)'],
  'Squash':      ['Large bed space or grow bags'],
  'Zucchini':    ['Wide bed or 30L+ container'],
  'Raspberries': ['Training wires + posts', 'Bird netting'],
  'Blueberries': ['Ericaceous compost', 'Bird netting', 'Sulphur soil acidifier'],
  'Blackberries':['Training wires + posts', 'Thornless gloves'],
  'Gooseberries':['Netting frame', 'Pruning gloves'],
  'Redcurrants': ['Bird netting frame'],
  'Strawberries':['Straw mulch', 'Bird netting'],
  'Potatoes':    ['Potato grow bags or earthing-up hoe', 'Potato fertilizer'],
  'Corn':        ['Large block spacing min 4×4 for pollination'],
};

export const FERT_SUGGESTIONS = [
  { name: 'General purpose fertilizer (NPK 7-7-7)', for: ['Tomatoes','Peppers','Beans','Kale','Broccoli','Cauliflower'] },
  { name: 'High-potash tomato feed', for: ['Tomatoes','Cherry Tomatoes','Cucumbers','Peppers','Squash','Zucchini'] },
  { name: 'Ericaceous (acidic) fertilizer', for: ['Blueberries'] },
  { name: 'Bone meal (phosphorus boost)', for: ['Carrots','Parsnips','Beets','Garlic','Onions'] },
  { name: 'Seaweed or liquid fish emulsion', for: ['Lettuce','Spinach','Kale','Chard','Basil'] },
];

// ── Phase 68: Seed starting calendar ──────────
export const SEED_START_WEEKS = {
  'Tomatoes': 6, 'Cherry Tomatoes': 6, 'Peppers': 8, 'Jalapeño': 8, 'Eggplant': 8,
  'Broccoli': 5, 'Cabbage': 5, 'Cauliflower': 5, 'Brussels Sprouts': 5,
  'Kale': 4, 'Celery': 10, 'Celeriac': 10, 'Leeks': 10, 'Onions': 8,
  'Shallots': 8, 'Fennel': 4, 'Lettuce': 4, 'Chard': 4, 'Spinach': 3,
  'Basil': 4, 'Parsley': 8, 'Sweet Corn': 3, 'Squash': 3, 'Zucchini': 3,
  'Butternut Squash': 3, 'Pumpkins': 3, 'Cucumbers': 3, 'Melons': 4,
  'Watermelon': 4, 'Artichokes': 8, 'Lemongrass': 8,
};

// ── Phase 69: Fertilizer schedules ────────────
export const FERTILIZER_SCHEDULES = {
  fruiting: [
    { stage: 'Pre-plant',  when: 'Before planting',            icon: '🌍', tip: 'Work compost or balanced 10-10-10 into soil. Good prep = better yields.' },
    { stage: 'Seedling',   when: '2 wks after transplant',     icon: '🌱', tip: 'Light nitrogen — diluted fish emulsion or liquid seaweed.' },
    { stage: 'Vegetative', when: '4–5 wks after transplant',   icon: '🌿', tip: 'Balanced NPK supports rapid leafy growth before flowering.' },
    { stage: 'Flowering',  when: 'At first flower',            icon: '🌸', tip: 'Switch to higher phosphorus. Excess nitrogen reduces fruit set.' },
    { stage: 'Fruiting',   when: 'Every 2 wks while fruiting', icon: '🍅', tip: 'Potassium-rich feed improves fruit quality and shelf life.' },
  ],
  leafy: [
    { stage: 'Pre-plant', when: 'Before planting',    icon: '🌍', tip: 'Rich compost or nitrogen-forward fertilizer (5-3-3 or similar).' },
    { stage: 'Seedling',  when: '2–3 wks after sow',  icon: '🌱', tip: 'Diluted liquid fertilizer or compost tea.' },
    { stage: 'Growing',   when: 'Every 3 weeks',       icon: '🌿', tip: 'Nitrogen feed supports continuous leafy growth — reduce if bolting.' },
  ],
  root: [
    { stage: 'Pre-plant', when: 'Before planting',        icon: '🌍', tip: 'Low nitrogen; avoid fresh manure (causes forking). Bone meal for phosphorus.' },
    { stage: 'Seedling',  when: '3 wks after germination', icon: '🌱', tip: 'Light feed only — too much N = lush leaves, tiny roots.' },
    { stage: 'Swelling',  when: '6 wks after germination', icon: '🥕', tip: 'Potassium-rich feed supports root swelling and sweetness.' },
  ],
  legume: [
    { stage: 'Pre-plant', when: 'Before planting',  icon: '🌍', tip: 'Light compost only — legumes fix their own nitrogen from the air.' },
    { stage: 'Flowering', when: 'At first flower',  icon: '🌸', tip: 'Optional potassium boost improves pod fill and flavour.' },
  ],
  allium: [
    { stage: 'Pre-plant', when: 'Before planting',     icon: '🌍', tip: 'Well-rotted compost or balanced fertilizer.' },
    { stage: 'Seedling',  when: '3 wks after planting', icon: '🌱', tip: 'Nitrogen-forward feed for early bulb development.' },
    { stage: 'Bulbing',   when: '8 wks after planting', icon: '🧅', tip: 'Switch to lower N, higher potassium for bulb swelling.' },
    { stage: 'Stop',      when: '4 wks before harvest', icon: '🛑', tip: 'Stop feeding — leaves must yellow naturally for proper curing.' },
  ],
};

export const CROP_FERT_CATEGORY = {
  'Tomatoes':'fruiting','Cherry Tomatoes':'fruiting','Peppers':'fruiting',
  'Jalapeño':'fruiting','Eggplant':'fruiting','Cucumbers':'fruiting',
  'Squash':'fruiting','Zucchini':'fruiting','Pumpkins':'fruiting',
  'Butternut Squash':'fruiting','Melons':'fruiting','Watermelon':'fruiting',
  'Corn':'fruiting','Sweet Corn':'fruiting',
  'Lettuce':'leafy','Spinach':'leafy','Kale':'leafy','Chard':'leafy',
  'Arugula':'leafy','Cabbage':'leafy','Broccoli':'leafy','Cauliflower':'leafy',
  'Brussels Sprouts':'leafy','Basil':'leafy','Microgreens':'leafy',
  'Parsley':'leafy','Celery':'leafy','Fennel':'leafy',
  'Carrots':'root','Beets':'root','Parsnips':'root','Radishes':'root',
  'Turnips':'root','Celeriac':'root','Potatoes':'root',
  'Beans':'legume','Peas':'legume',
  'Garlic':'allium','Onions':'allium','Leeks':'allium','Shallots':'allium',
};

export const FERT_DAY_OFFSETS = {
  fruiting: [0, 14, 35, 56, 70],
  leafy:    [0, 14, 35],
  root:     [0, 21, 42],
  legume:   [0, 56],
  allium:   [0, 21, 56, 84],
};

// ── Phase 78: Grow-by-recipe discovery ─────────
export const GROW_BY_RECIPE = [
  { name: 'Pizza',            icon: '🍕', crops: ['Tomatoes','Basil','Oregano','Garlic','Peppers','Onions'] },
  { name: 'Pasta sauce',      icon: '🍝', crops: ['Tomatoes','Basil','Garlic','Onions','Peppers','Fennel'] },
  { name: 'Fresh salad',      icon: '🥗', crops: ['Lettuce','Cucumbers','Tomatoes','Radishes','Chervil','Nasturtium','Sorrel'] },
  { name: 'Stir-fry',         icon: '🥢', crops: ['Garlic','Ginger','Bok Choy','Peas','Beans','Peppers','Corn'] },
  { name: 'Soup',             icon: '🍲', crops: ['Carrots','Celery','Leeks','Onions','Parsnips','Parsley','Kale'] },
  { name: 'Green smoothie',   icon: '🥤', crops: ['Kale','Spinach','Mint','Lemon Balm','Cucumbers','Ginger'] },
  { name: 'Curry',            icon: '🍛', crops: ['Tomatoes','Garlic','Ginger','Cilantro','Peppers','Turmeric','Spinach','Potatoes'] },
  { name: 'Pickles',          icon: '🫙', crops: ['Cucumbers','Beets','Carrots','Garlic','Dill','Tarragon','Nasturtium'] },
  { name: 'Herb garden',      icon: '🌿', crops: ['Basil','Parsley','Chives','Rosemary','Thyme','Sage','Oregano','Mint','Chervil','Tarragon','Lemon Balm'] },
  { name: 'Summer BBQ',       icon: '🔥', crops: ['Corn','Zucchini','Tomatoes','Peppers','Garlic','Beans','Potatoes'] },
  { name: 'Cocktail garden',  icon: '🍸', crops: ['Mint','Lemon Balm','Borage','Nasturtium','Cucumbers','Basil'] },
  { name: 'Jam & soft fruit', icon: '🍓', crops: ['Strawberries','Raspberries','Blackberries','Redcurrants','Gooseberries','Blueberries'] },
];

// ── Phase 116: Expanded pest guide (55 entries) ─
export const NAMED_PEST_GUIDE = {
  // ── Insects ──────────────────────────────────
  'Aphids':              { emoji:'🦗', type:'insect', signs:'Sticky honeydew; curled/yellowed new growth; soft clusters on stems and buds.', organic:'Blast with water; neem oil; insecticidal soap. Plant nearby flowers to attract ladybirds.', conventional:'Pyrethrin spray; imidacloprid systemic drench for severe infestations.' },
  'Blackfly':            { emoji:'🪲', type:'insect', signs:'Dense black colonies on shoot tips; sticky honeydew; leaves curl downward.', organic:'Pinch out infested shoot tips; strong water blast; neem oil.', conventional:'Pyrethrin spray on colonies; imidacloprid systemic for persistent cases.' },
  'Whitefly':            { emoji:'🪰', type:'insect', signs:'Clouds of tiny white flies when plants are disturbed; yellow stippled leaves under.', organic:'Yellow sticky traps; insecticidal soap on undersides; neem oil.', conventional:'Imidacloprid systemic drench; bifenthrin spray on leaf undersides.' },
  'Spider Mites':        { emoji:'🕷️', type:'insect', signs:'Fine silky webbing on undersides; tiny moving specks; leaves bronze or silver-streaked.', organic:'Daily water misting on undersides; neem oil; predatory mites; raise humidity.', conventional:'Abamectin or spiromesifen miticide; repeat weekly for 3 weeks.' },
  'Thrips':              { emoji:'🪲', type:'insect', signs:'Silver-white streaking on leaves; tiny black droppings; distorted or scarred growth.', organic:'Blue sticky traps; neem oil; spinosad at dawn.', conventional:'Spinosad or imidacloprid; repeat every 5-7 days until clear.' },
  'Scale Insects':       { emoji:'🪲', type:'insect', signs:'Hard brown/white bumps fixed to stems; sticky honeydew; stunted growth.', organic:'Rub off with damp cloth; isopropyl alcohol wipes on stems; neem oil.', conventional:'Imidacloprid systemic drench; horticultural oil spray.' },
  'Mealybugs':           { emoji:'🪲', type:'insect', signs:'White cottony masses in leaf joints and under leaves; sticky residue below.', organic:'Isopropyl alcohol on cotton buds; neem oil spray; insecticidal soap.', conventional:'Imidacloprid systemic drench; bifenthrin spray.' },
  'Flea Beetles':        { emoji:'🪲', type:'insect', signs:'Many tiny round holes (shotgun pattern) in leaves; worst on young seedlings.', organic:'Row covers; diatomaceous earth around base; sticky yellow traps.', conventional:'Pyrethrin at dusk; spinosad spray; use transplants rather than direct sow.' },
  'Leaf Miners':         { emoji:'🪲', type:'insect', signs:'Winding white or silvery tunnels visible inside leaves; blisters on leaf surface.', organic:'Remove affected leaves; yellow sticky traps; neem oil spray.', conventional:'Spinosad or abamectin spray; remove affected leaves promptly.' },
  'Caterpillars':        { emoji:'🐛', type:'insect', signs:'Large ragged holes in leaves; droppings visible; caterpillars hide under leaves at night.', organic:'Hand-pick at night; Bt (Bacillus thuringiensis) spray in the morning.', conventional:'Spinosad or pyrethrin spray in the evening.' },
  'Cabbage Worm':        { emoji:'🐛', type:'insect', signs:'Large ragged holes in brassica leaves; green caterpillars and black droppings present.', organic:'Hand-pick eggs and caterpillars; Bt spray at first sign.', conventional:'Spinosad; check leaf undersides daily and spray pyrethrin at first sign.' },
  'Cabbage White':       { emoji:'🦋', type:'insect', signs:'Rows of pale yellow eggs under leaves; pale green caterpillars later; holes in leaves.', organic:'Row cover; hand-pick eggs; Bt spray when caterpillars appear.', conventional:'Spinosad spray; remove egg masses from leaf undersides promptly.' },
  'Cabbage Maggot':      { emoji:'🪰', type:'insect', signs:'Brassica plants wilt suddenly; white grubs at stem base; plant pulls up easily.', organic:'Row cover at transplanting; collar around stem base; sticky barrier.', conventional:'Diazinon or chlorpyrifos granules at planting; remove infested plants.' },
  'Hornworm':            { emoji:'🐛', type:'insect', signs:'Rapid large-scale defoliation; large green caterpillar with a horn; dark droppings.', organic:'Hand-pick (check undersides); Bt spray; parasitic wasps — look for white egg sacs.', conventional:'Spinosad or pyrethrin spray; hand removal most effective for large larvae.' },
  'Corn Earworm':        { emoji:'🐛', type:'insect', signs:'Fresh silky frass at corn ear tips; feeding damage inside ears; caterpillar at entry.', organic:'Mineral oil drops into ear tips at 50% silk stage; Bt spray; trichogramma wasps.', conventional:'Pyrethrin at silk emergence every 2 days; spinosad spray on silks.' },
  'Corn Borer':          { emoji:'🐛', type:'insect', signs:'Broken or shot tassels; sawdust-like frass at stem joints; larvae boring inside stalks.', organic:'Bt spray on silks and borers; remove and destroy affected stalks in autumn.', conventional:'Pyrethrin at first adult flight; spinosad spray on new growth.' },
  'Squash Bug':          { emoji:'🪲', type:'insect', signs:'Wilting vines despite moisture; flat dark-brown bugs and bronze egg clusters under leaves.', organic:'Hand-pick eggs, nymphs, and adults; row cover; boards as traps at night.', conventional:'Pyrethrin or carbaryl spray on undersides; remove boards with trapped bugs.' },
  'Squash Vine Borer':   { emoji:'🐛', type:'insect', signs:'Sudden vine wilt; sawdust-like frass near vine base; caterpillar boring inside stem.', organic:'Aluminium foil mulch; row cover in spring; inject Bt into borer entry hole.', conventional:'Pyrethrin on vine bases before egg-laying (early summer); repeat weekly.' },
  'Cucumber Beetle':     { emoji:'🪲', type:'insect', signs:'Yellowed/spotted leaves; bacterial wilt following feeding; striped/spotted beetles visible.', organic:'Row cover; kaolin clay coating; yellow sticky traps; beneficial nematodes in soil.', conventional:'Pyrethrin or carbaryl spray; treat soil around roots.' },
  'Japanese Beetle':     { emoji:'🪲', type:'insect', signs:'Skeletonised leaves (lacy appearance); metallic green/copper beetles feeding in groups on foliage.', organic:'Hand-pick in morning when sluggish; neem oil; milky spore for larvae in soil.', conventional:'Carbaryl or pyrethrin spray; imidacloprid soil drench for grubs.' },
  'Bean Beetle':         { emoji:'🪲', type:'insect', signs:'Round or irregular holes in bean leaves and pods; yellow/orange beetles with black spots.', organic:'Row cover; hand-pick adults and larvae; neem oil spray.', conventional:'Pyrethrin or spinosad spray; remove egg clusters from leaf undersides.' },
  'Asparagus Beetle':    { emoji:'🪲', type:'insect', signs:'Defoliation of asparagus fronds; grey-green larvae and red-orange eggs on stems.', organic:'Hand-pick adults and larvae; neem oil spray; keep bed weeded.', conventional:'Pyrethrin; spinosad spray on foliage.' },
  'Raspberry Beetle':    { emoji:'🪲', type:'insect', signs:'Maggots inside harvested fruit; white grubs found when berries split or pressed.', organic:'Cultivate soil shallowly after harvest to expose pupae; netting to exclude adults.', conventional:'Pyrethrin spray at 80% petal fall and 2 weeks later.' },
  'Cane Borer':          { emoji:'🪲', type:'insect', signs:'Wilting or dying fruiting canes; sawdust frass at base; grub boring inside lower cane.', organic:'Prune and destroy affected canes; remove debris; plant resistant varieties.', conventional:'Pyrethrin spray on new canes in spring before adults lay eggs.' },
  'Gooseberry Sawfly':   { emoji:'🐛', type:'insect', signs:'Rapid defoliation by green caterpillars from the centre of the bush outward.', organic:'Hand-pick caterpillars; insecticidal soap spray.', conventional:'Pyrethrin spray; spinosad on foliage as soon as damage appears.' },
  'Pea Moth':            { emoji:'🦋', type:'insect', signs:'Maggots inside pea pods; caterpillar feeding on developing seeds; damaged seeds.', organic:'Late or early sowings to avoid peak moth flight; fine row cover during flowering.', conventional:'Pyrethrin at petal fall; spray in evening to target egg-laying moths.' },
  'Pea Weevil':          { emoji:'🪲', type:'insect', signs:'Round holes in harvested dried peas; grubs found inside seeds when split.', organic:'Store peas in sealed containers; freeze seeds for 48 hrs to kill grubs.', conventional:'Treat grain stores; inspect seeds before planting next season.' },
  'Onion Maggot':        { emoji:'🪰', type:'insect', signs:'Yellowing/wilting tops despite watering; white maggots at bulb base; plants pull up easily.', organic:'Row cover; avoid companion planting of carrots/onions together; crush infested plants.', conventional:'Diazinon or chlorpyrifos in soil at planting; remove infested plants.' },
  'Onion Fly':           { emoji:'🪰', type:'insect', signs:'Wilting/yellowing outer leaves; similar to onion maggot — fly lays eggs at soil level.', organic:'Row cover; grow from sets not seed; avoid spring sowing if possible.', conventional:'Chlorpyrifos at planting; remove infested plants promptly.' },
  'Pepper Maggot':       { emoji:'🪰', type:'insect', signs:'Maggots inside ripened pepper fruit; white tunnelling larvae; fruit drops early.', organic:'Red sphere traps; row cover; remove fallen fruit promptly.', conventional:'Pyrethrin or spinosad spray at first adult flight (mid-summer).' },
  'Pepper Weevil':       { emoji:'🪲', type:'insect', signs:'Dropped flower buds with small exit holes; weevil grub inside fallen buds; pitted fruit.', organic:'Remove fallen buds; trap crops of susceptible varieties; neem oil spray.', conventional:'Pyrethrin or imidacloprid; spray at bud stage when weevils first appear.' },
  'Carrot Fly':          { emoji:'🪰', type:'insect', signs:'Red/bronze leaves; rusty surface tunnels on carrot roots; white larvae in soil.', organic:'70 cm solid barrier around crop; row cover; delay sowing to June.', conventional:'Seed treatment or soil insecticide at sowing.' },
  'Wireworm':            { emoji:'🪲', type:'insect', signs:'Plants wilt and die; slim, yellow-orange larvae tunnelling in roots and tubers.', organic:'Cultivate soil repeatedly to expose larvae; plant trap crops (wheat/mustard).', conventional:'Chlorpyrifos or imidacloprid granules worked into soil at planting.' },
  'Corn Rootworm':       { emoji:'🪲', type:'insect', signs:'Lodged/fallen corn stalks; damaged or pruned roots; yellow-green beetles on silks.', organic:'Crop rotation away from corn annually; beneficial nematodes in soil.', conventional:'Soil-applied insecticide granules at planting; seed treatment.' },
  'Tarnished Bug':       { emoji:'🪲', type:'insect', signs:'Distorted/blackened shoot tips; feeding scars on fruit; shield-shaped brown-green bugs.', organic:'Remove weeds (alternative hosts); row cover; sticky traps at field margins.', conventional:'Pyrethrin or spinosad early morning when bugs are sluggish.' },
  'Stink Bugs':          { emoji:'🪲', type:'insect', signs:'Dimpled, scarred, or corky spots in fruit flesh; shield-shaped brown marbled bugs visible.', organic:'Kaolin clay on fruit; row cover on young plants; hand-pick bugs into soapy water.', conventional:'Pyrethrin spray; bifenthrin on plant and fruit surfaces.' },
  'Vine Borer':          { emoji:'🐛', type:'insect', signs:'Sudden plant wilt; sawdust-like frass at vine base; caterpillar inside hollow stem.', organic:'Aluminium foil mulch at base; row cover in early spring; hand-remove larvae.', conventional:'Pyrethrin on vine bases before egg-laying (June-July).' },
  'Root Maggot':         { emoji:'🪰', type:'insect', signs:'Plants wilt then die; white maggots around roots and stem bases; worse in cool wet spring.', organic:'Row cover at sowing; sand collar around base; neem soil drench.', conventional:'Chlorpyrifos granules worked into soil at planting.' },
  'Bay Sucker':          { emoji:'🦟', type:'insect', signs:'Thickened, rolled or pale leaf margins in spring; jumping psyllid colonies inside.', organic:'Prune affected shoot tips in spring; remove curled leaves by hand.', conventional:'Systemic insecticide spray early in season before leaf curling begins.' },
  'Big Bud Mite':        { emoji:'🕷️', type:'insect', signs:'Abnormally round, swollen buds that fail to open; spread by contact and handling.', organic:'Remove and burn affected buds; plant resistant varieties (Ben Hope, etc.).', conventional:'No effective chemical — remove affected plants; replant with certified stock.' },
  'Birds':               { emoji:'🐦', type:'other', signs:'Pecked or missing fruit; seeds removed; entire seedlings pulled from soil.', organic:'Netting over crops; reflective tape or CDs; hawk/owl silhouettes.', conventional:'Same — physical exclusion is most effective method.' },
  'Squirrels':           { emoji:'🐿️', type:'other', signs:'Dug-up bulbs and tubers; gnawed roots; stolen nuts and ripe fruit overnight.', organic:'Wire cloche or mesh; cayenne pepper sprinkle; hardware cloth cage over roots.', conventional:'Same — physical exclusion only.' },
  // ── Diseases ─────────────────────────────────
  'Powdery Mildew':      { emoji:'🍄', type:'disease', signs:'White powdery coating on upper leaf surfaces; worse in warm dry spells with cool nights.', organic:'Baking soda spray (1 tsp/qt water); improve airflow; avoid overhead watering.', conventional:'Myclobutanil or trifloxystrobin fungicide at first sign.' },
  'Downy Mildew':        { emoji:'🍄', type:'disease', signs:'Yellow patches on upper leaves with grey-purple fuzzy growth underneath; in cool wet weather.', organic:'Copper fungicide; remove affected leaves; improve air circulation.', conventional:'Chlorothalonil or mancozeb; remove severely affected material.' },
  'Botrytis':            { emoji:'🍄', type:'disease', signs:'Grey fuzzy mould on leaves, stems, or fruit; especially in cool, humid, or crowded conditions.', organic:'Remove affected parts immediately; improve airflow urgently; reduce humidity.', conventional:'Iprodione or fludioxonil fungicide; avoid wounding plants.' },
  'Rust':                { emoji:'🍄', type:'disease', signs:'Orange or brown powdery pustules on leaf undersides; yellowing on the upper surface.', organic:'Remove infected leaves; copper fungicide; avoid wetting foliage when watering.', conventional:'Trifloxystrobin or mancozeb fungicide; repeat every 10-14 days.' },
  'Leek Rust':           { emoji:'🍄', type:'disease', signs:'Orange powdery stripes on outer allium leaves; starts lower, spreads upward.', organic:'Remove affected leaves; improve airflow; avoid overcrowding in bed.', conventional:'Propiconazole fungicide; remove worst affected plants.' },
  'Clubroot':            { emoji:'🍄', type:'disease', signs:'Wilting despite moist soil; swollen, distorted, club-like roots when plant is lifted.', organic:'Lime soil to pH 7.5+; long rotation (7+ yrs); improve drainage; use resistant varieties.', conventional:'No effective chemical cure — prevention via liming and rotation only.' },
  'Potato Blight':       { emoji:'🍄', type:'disease', signs:'Dark brown patches with yellow border; white mould on leaf undersides in wet weather; rapid spread.', organic:'Copper fungicide on a 7-10 day schedule; remove and burn tops at first sign.', conventional:'Chlorothalonil or mancozeb; spray preventatively in warm, wet weather.' },
  'Fusarium Wilt':       { emoji:'🍄', type:'disease', signs:'One-sided yellowing; brown discolouration inside stem when cut; soil-borne; wilts in heat.', organic:'Remove and destroy affected plants; solarise soil; rotate 4+ years.', conventional:'No chemical cure — remove plants; use resistant varieties; improve drainage.' },
  'Root Rot':            { emoji:'🍄', type:'disease', signs:'Wilting despite moist soil; dark, mushy roots when lifted; often from overwatering or poor drainage.', organic:'Improve drainage; reduce watering; apply beneficial mycorrhizal fungi to healthy plants.', conventional:'Metalaxyl or fosetyl-aluminium drench for pythium/phytophthora root rot.' },
  'Chocolate Spot':      { emoji:'🍄', type:'disease', signs:'Brown spots and streaks on bean stems and leaves; worse in cold, wet, or nitrogen-rich conditions.', organic:'Improve airflow; avoid overcrowding; reduce nitrogen; copper fungicide.', conventional:'Mancozeb or chlorothalonil fungicide at first sign.' },
};

// Alias map for pest name normalisation
export const PEST_ALIASES = {
  'aphid': 'Aphids',
  'spider mites': 'Spider Mites',
  'spider mite': 'Spider Mites',
  'flea beetle': 'Flea Beetles',
  'flea beetles': 'Flea Beetles',
  'powdery mildew': 'Powdery Mildew',
  'downy mildew': 'Downy Mildew',
  'japanese beetle': 'Japanese Beetle',
  'japanese beetles': 'Japanese Beetle',
  'scale': 'Scale Insects',
  'scale insects': 'Scale Insects',
  'colorado potato beetle': 'Colorado Beetle',
  'colorado beetle': 'Colorado Beetle',
  'squash vine borer': 'Squash Vine Borer',
  'vine borer': 'Squash Vine Borer',
  'root-knot nematode': 'Root Knot Nematode',
  'root knot nematode': 'Root Knot Nematode',
  'blackfly': 'Blackfly',
  'black fly': 'Blackfly',
  'rootworm': 'Corn Rootworm',
  'corn rootworm': 'Corn Rootworm',
  'fruit fly': 'Fruit Fly',
  'fusarium wilt': 'Fusarium Wilt',
  'fusarium crown rot': 'Fusarium Wilt',
  'rhizome rot': 'Root Rot',
  'root rot': 'Root Rot',
  'botrytis': 'Botrytis',
  'caterpillar': 'Caterpillars',
};
