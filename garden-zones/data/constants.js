// ── data/constants.js ─────────────────────────
// Pure data constants — no side effects, no DOM, no state.

// ── WMO weather code → emoji ───────────────────
export const WMO_ICONS = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
  45:'🌫️', 48:'🌫️',
  51:'🌦️', 53:'🌦️', 55:'🌧️',
  61:'🌧️', 63:'🌧️', 65:'🌧️',
  71:'🌨️', 73:'🌨️', 75:'❄️', 77:'❄️',
  80:'🌦️', 81:'🌦️', 82:'🌧️',
  85:'🌨️', 86:'🌨️',
  95:'⛈️', 96:'⛈️', 99:'⛈️',
};

// ── Phase 54: Crop family → rotation group ─────
export const CROP_FAMILIES = {
  'Tomatoes':'Solanaceae','Peppers':'Solanaceae','Eggplant':'Solanaceae',
  'Tomatillos':'Solanaceae','Ground Cherries':'Solanaceae','Potatoes':'Solanaceae',
  'Cabbage':'Brassicaceae','Broccoli':'Brassicaceae','Cauliflower':'Brassicaceae',
  'Kale':'Brassicaceae','Brussels Sprouts':'Brassicaceae','Kohlrabi':'Brassicaceae',
  'Turnips':'Brassicaceae','Radishes':'Brassicaceae','Arugula':'Brassicaceae',
  'Asian Greens':'Brassicaceae',
  'Beans':'Legume','Peas':'Legume','Edamame':'Legume','Peanuts':'Legume',
  'Runner Beans':'Legume','Sugar Snap Peas':'Legume','Snow Peas':'Legume','Lima Beans':'Legume','Fava Beans':'Legume',
  'Cucumbers':'Cucurbit','Squash':'Cucurbit','Pumpkins':'Cucurbit',
  'Melons':'Cucurbit','Zucchini':'Cucurbit','Watermelon':'Cucurbit','Butternut Squash':'Cucurbit',
  'Onions':'Allium','Garlic':'Allium','Leeks':'Allium','Shallots':'Allium','Chives':'Allium',
  'Carrots':'Apiaceae','Parsnips':'Apiaceae','Celery':'Apiaceae',
  'Dill':'Apiaceae','Fennel':'Apiaceae','Coriander':'Apiaceae',
  'Lettuce':'Asteraceae','Endive':'Asteraceae','Artichokes':'Asteraceae',
  'Corn':'Grass',
  'Beets':'Chenopodiaceae','Spinach':'Chenopodiaceae','Swiss Chard':'Chenopodiaceae',
  'Raspberries':'Rosaceae','Blackberries':'Rosaceae','Gooseberries':'Grossulariaceae',
  'Redcurrants':'Grossulariaceae','Blackcurrants':'Grossulariaceae','Blueberries':'Ericaceae',
  'Strawberries':'Rosaceae',
  'Nasturtium':'Tropaeolaceae','Borage':'Boraginaceae','Calendula':'Asteraceae',
  'Lavender':'Lamiaceae','Sunflowers':'Asteraceae',
  'Lemon Balm':'Lamiaceae','Tarragon':'Asteraceae','Sorrel':'Polygonaceae','Chervil':'Apiaceae',
  'Bay Leaf':'Lauraceae',
  'Broccoli Rabe':'Brassicaceae','Napa Cabbage':'Brassicaceae',
  'Daikon':'Brassicaceae',
  'Watermelon':'Cucurbit','Cherry Tomatoes':'Solanaceae','Jalapeño':'Solanaceae',
  'Sweet Corn':'Grass',
  // Phase 91: herbs & others
  'Basil':'Lamiaceae','Mint':'Lamiaceae','Thyme':'Lamiaceae','Rosemary':'Lamiaceae',
  'Oregano':'Lamiaceae','Sage':'Lamiaceae','Parsley':'Apiaceae','Marjoram':'Lamiaceae',
  'Sweet Potatoes':'Convolvulaceae','Asparagus':'Asparagaceae','Rhubarb':'Polygonaceae',
  'Okra':'Malvaceae','Ginger':'Zingiberaceae','Lemongrass':'Poaceae',
  'Chard':'Chenopodiaceae','Pak Choi':'Brassicaceae','Mizuna':'Brassicaceae',
  'Mustard Greens':'Brassicaceae','Collard Greens':'Brassicaceae',
  'Tatsoi':'Brassicaceae','Bok Choy':'Brassicaceae',
  'Salsify':'Asteraceae','Jerusalem Artichoke':'Asteraceae',
  'Watercress':'Brassicaceae','Cress':'Brassicaceae',
  'Savory':'Lamiaceae','Hyssop':'Lamiaceae',
};

// ── Phase 101: Avg retail price $/kg (organic) ─
export const CROP_VALUES = {
  'Arugula':10,'Asian Greens':8,'Asparagus':11,'Basil':28,'Bay Leaf':18,
  'Beans':6,'Beets':4,'Blackberries':11,'Blackcurrants':14,'Blueberries':10,
  'Borage':15,'Broccoli':5,'Broccoli Rabe':8,'Brussels Sprouts':6,'Butternut Squash':3,
  'Cabbage':2.5,'Calendula':12,'Carrots':3.5,'Cauliflower':4.5,'Celery':3,
  'Chervil':20,'Cherry Tomatoes':6,'Chives':18,'Coriander':18,'Corn':2,
  'Cucumbers':3.5,'Daikon':3,'Dill':16,'Edamame':7,'Eggplant':4.5,
  'Endive':7,'Fava Beans':7,'Fennel':6,'Garlic':12,'Gooseberries':14,
  'Ground Cherries':12,'Jalapeño':6,'Kale':6.5,'Kohlrabi':5,'Lavender':20,
  'Leeks':4.5,'Lemon Balm':20,'Lettuce':7,'Lima Beans':7,'Marjoram':18,
  'Melons':4,'Mint':24,'Nasturtium':18,'Napa Cabbage':3,'Onions':2.5,
  'Oregano':16,'Parsley':14,'Parsnips':4,'Peanuts':5,'Peas':7,
  'Peppers':5,'Potatoes':2,'Pumpkins':2,'Radishes':5,'Raspberries':12,
  'Redcurrants':14,'Rhubarb':5,'Rosemary':18,'Runner Beans':6,'Sage':18,
  'Shallots':8,'Snow Peas':8,'Sorrel':14,'Spinach':8,'Squash':3.5,
  'Strawberries':9,'Sugar Snap Peas':8,'Sunflowers':6,'Sweet Corn':2,
  'Sweet Potatoes':3,'Swiss Chard':7.5,'Tarragon':22,'Thyme':20,
  'Tomatillos':6,'Tomatoes':4.5,'Turnips':3,'Watermelon':2,'Zucchini':3,
};

// ── Frost-sensitive crops ──────────────────────
export const FROST_SENSITIVE = new Set([
  'Tomatoes','Cherry Tomatoes','Peppers','Jalapeño','Eggplant','Basil','Cucumbers',
  'Beans','Runner Beans','Lima Beans','Squash','Zucchini','Butternut Squash',
  'Corn','Sweet Corn','Melons','Watermelon','Pumpkins','Tomatillos','Ground Cherries','Edamame',
  'Sweet Potatoes','Ginger','Lemongrass','Okra','Peanuts',
]);

// Phase 135 — crops that bolt or suffer in heat
export const HEAT_SENSITIVE = new Set([
  'Lettuce','Spinach','Arugula','Cilantro','Peas','Kale','Broccoli','Cauliflower',
  'Radishes','Parsley','Bok Choy','Cabbage','Brussels Sprouts','Leeks','Swiss Chard',
]);

// ── Phase 67: Companion reasons ────────────────
export const COMPANION_REASONS = {
  'Tomatoes|Basil':'Basil repels aphids and thrips; traditionally said to improve tomato flavour.',
  'Tomatoes|Marigolds':'Marigold root secretions deter nematodes, aphids, and whitefly.',
  'Tomatoes|Carrots':'Carrots loosen soil around tomato roots; efficient use of vertical space.',
  'Tomatoes|Garlic':'Garlic deters aphids, spider mites, and other fungal pathogens.',
  'Basil|Tomatoes':'Tomatoes provide dappled shade; basil deters pests mutually.',
  'Basil|Peppers':'Repels aphids and spider mites; both thrive in heat.',
  'Carrots|Onions':'Onion scent deters carrot fly; carrot scent confuses onion fly.',
  'Carrots|Chives':'Chives repel carrot rust fly and aphids with their scent.',
  'Corn|Beans':'Three Sisters: beans fix nitrogen that feeds heavy-feeding corn.',
  'Corn|Squash':'Three Sisters: squash leaves shade weeds and retain soil moisture.',
  'Beans|Corn':'Beans fix atmospheric nitrogen; corn benefits as a heavy feeder.',
  'Beans|Squash':'Ground-covering squash shades weeds; all three benefit in Three Sisters.',
  'Squash|Corn':'Squash leaves mulch the soil; Three Sisters combination.',
  'Squash|Nasturtiums':'Nasturtiums are a trap crop that lures aphids away from squash.',
  'Cucumbers|Nasturtiums':'Nasturtiums repel aphids, cucumber beetles, and squash bugs.',
  'Cucumbers|Beans':'Beans fix nitrogen; cucumbers benefit from improved soil fertility.',
  'Peppers|Basil':'Basil repels aphids and spider mites; both love warm conditions.',
  'Peppers|Tomatoes':'Similar nutrient needs; companion planting maximises space use.',
  'Lettuce|Radishes':'Radishes deter leaf miners; lettuce provides shade that slows radish bolting.',
  'Onions|Carrots':'Mutual pest deterrence — each confuses the other\'s main fly pest.',
  'Garlic|Tomatoes':'Garlic sulphur compounds repel aphids, spider mites, and blight.',
  'Marigolds|Tomatoes':'Root secretions deter soil nematodes; above-ground deters whitefly.',
  'Nasturtiums|Cucumbers':'Trap crop for aphids and cucumber beetles; edible flowers.',
  'Spinach|Strawberries':'Spinach shades strawberry roots; ground cover suppresses weeds.',
  'Radishes|Lettuce':'Acts as a trap crop for flea beetles, protecting lettuce.',
  'Chives|Carrots':'Chive scent deters carrot rust fly and root aphids.',
  'Chives|Tomatoes':'Repels aphids; companion studies suggest improved growth rate.',
  'Marigolds|Beans':'Root secretions deter bean weevils and nematodes in soil.',
  'Borage|Tomatoes':'Borage deters tomato hornworm and improves overall plant vigour.',
  'Borage|Strawberries':'Borage repels aphids and attracts pollinators; improves fruit set.',
  'Nasturtiums|Beans':'Trap crop for aphids and blackfly; also attracts predatory insects.',
  'Mint|Brassicas':'Mint scent confuses cabbage white butterfly and deters aphids.',
  'Rosemary|Beans':'Strong scent deters bean beetles and Mexican bean beetle.',
  'Rosemary|Brassicas':'Deters cabbage moth, carrot fly, and bean beetles.',
  'Sage|Brassicas':'Deters cabbage moth, cabbage looper, and carrot fly.',
  'Thyme|Brassicas':'Repels cabbage worm and whitefly; attracts beneficial insects.',
  'Lavender|Brassicas':'Lavender scent repels cabbage moth; attracts bees for pollination.',
  'Garlic|Roses':'Sulphur compounds in garlic deter aphids, black spot, and rust.',
  'Dill|Brassicas':'Attracts parasitic wasps and hoverflies that prey on caterpillars.',
  'Fennel|Dill':'Fennel cross-pollinates with dill readily — both flavours are altered.',
  'Calendula|Tomatoes':'Trap crop for aphids; attracts pollinators and predatory hoverflies.',
  'Sunflowers|Cucumbers':'Cucumbers can climb sunflowers; sunflowers attract pollinators.',
  'Asparagus|Tomatoes':'Classic companion: tomatoes deter asparagus beetle; asparagus repels nematodes.',
  'Strawberries|Borage':'Borage repels pests and attracts pollinators; improves berry flavour.',
  'Peas|Carrots':'Peas fix nitrogen that benefits carrots; both prefer cool weather.',
  'Lettuce|Tall Crops':'Shade from taller neighbours slows lettuce bolting in summer.',
  // Beans/peas extended
  'Beans|Potatoes':'Mutual pest deterrence — beans repel Colorado potato beetle; potatoes repel Mexican bean beetle.',
  'Beans|Carrots':'Beans fix nitrogen; different root depths avoid competition for moisture.',
  'Peas|Radishes':'Radishes deter pea aphids and open up soil for pea roots.',
  'Peas|Mint':'Mint scent repels aphids and pea weevil.',
  'Peas|Lettuce':'Cool-season companions that share space and season efficiently.',
  // Brassicas extended
  'Cabbage|Onions':'Onion scent confuses cabbage white butterfly and repels aphids.',
  'Broccoli|Celery':'Celery scent repels cabbage white butterfly from nearby brassicas.',
  'Kale|Chamomile':'Chamomile said to improve brassica vigour and attracts hoverfly predators.',
  'Cauliflower|Dill':'Dill attracts parasitic wasps that prey on caterpillars attacking brassicas.',
  // Solanaceae extended
  'Tomatoes|Parsley':'Parsley attracts hoverflies whose larvae prey on aphids on tomatoes.',
  'Tomatoes|Borage':'Borage deters tomato hornworm and is said to improve tomato vigour.',
  'Peppers|Marigolds':'Marigolds deter aphids, spider mites, and soil nematodes near peppers.',
  // Cucurbitaceae extended
  'Cucumbers|Marigolds':'Marigolds deter cucumber beetle and aphids; attract pollinating bees.',
  'Melons|Marigolds':'Marigolds deter cucumber beetles and soil nematodes near melons.',
  'Watermelon|Marigolds':'Marigolds deter cucumber beetles and squash vine borers.',
  'Pumpkins|Corn':'Three Sisters companion: corn provides a trellis; pumpkin shades out weeds.',
  'Zucchini|Beans':'Beans fix nitrogen for heavy-feeding zucchini; different root depths.',
  'Zucchini|Nasturtiums':'Nasturtiums trap aphids and cucumber beetles away from zucchini.',
  // Root veg extended
  'Beets|Onions':'Onion scent deters beet leaf miners and other flying pests.',
  'Beets|Garlic':'Garlic repels soil pests and aphids that target beet foliage.',
  'Potatoes|Beans':'Mutual deterrence: bean scent repels Colorado potato beetle.',
  'Potatoes|Marigolds':'Marigold root secretions deter Colorado potato beetle and nematodes.',
  'Potatoes|Horseradish':'Horseradish planted at bed corners traditionally deters potato pests.',
  // Alliums extended
  'Chives|Roses':'Chives deter aphids and are said to improve rose disease resistance.',
  // Berries / fruit
  'Strawberries|Garlic':'Garlic deters aphids and fungal disease; improves strawberry health.',
  'Strawberries|Thyme':'Thyme repels worm pests and attracts pollinators to improve fruit set.',
  'Raspberries|Garlic':'Garlic repels aphids, raspberry beetle, and helps prevent fungal issues.',
  // Flowers/herbs as companions
  'Yarrow|Vegetables':'Yarrow attracts ladybirds, lacewings, and hoverflies — key aphid predators.',
  'Chamomile|Brassicas':'Chamomile said to improve brassica health and attract beneficial hoverflies.',
  'Nasturtiums|Tomatoes':'Acts as a trap crop luring aphids and whitefly away from tomatoes.',
  'Parsley|Tomatoes':'Attracts hoverflies and parasitic wasps that prey on tomato pests.',
  'Calendula|Beans':'Attracts pollinators and deters aphids and other bean pests.',
  'Sunflowers|Beans':'Sunflowers attract pollinators; different root depths avoid competition.',
  'Lavender|Roses':'Lavender deters aphids, repels deer, and draws pollinators to roses.',
  'Marigolds|Cucumbers':'Deters cucumber beetle and aphids; attracts pollinating bees.',
  'Marigolds|Potatoes':'Deters Colorado potato beetle and soil nematodes.',
  'Marigolds|Peppers':'Deters aphids, spider mites, and nematodes near peppers.',
  'Comfrey|Fruit trees':'Comfrey deep-mined minerals are released as mulch; feeds tree roots.',
};

export const AVOID_REASONS = {
  'Tomatoes|Fennel':'Fennel releases allelopathic chemicals that stunt tomato growth.',
  'Tomatoes|Brassicas':'Heavy nutrient competitors; may encourage shared fungal pathogens.',
  'Tomatoes|Corn':'Both attract the same hornworm and earworm pests.',
  'Peppers|Fennel':'Fennel inhibits growth of most vegetables including peppers.',
  'Peppers|Brassicas':'Compete for nutrients; brassica roots may inhibit pepper growth.',
  'Basil|Sage':'Sage produces allelopathic compounds that inhibit basil germination.',
  'Fennel|Tomatoes':'Fennel is allelopathic — best grown away from all vegetables.',
  'Onions|Beans':'Allium chemicals suppress legume nitrogen fixation and growth.',
  'Onions|Peas':'Same as beans — alliums inhibit legume growth and yields.',
  'Beans|Onions':'Onions inhibit bean growth; keep apart throughout season.',
  'Peas|Onions':'Allium chemicals stunt pea development; always separate these.',
  'Carrots|Dill':'Mature dill cross-pollinates with carrots, affecting root flavour.',
  'Brassicas|Tomatoes':'Tomatoes may inhibit brassica growth; both are heavy feeders.',
  'Potatoes|Tomatoes':'Same Solanaceae family — share blight and other diseases easily.',
  'Potatoes|Cucumbers':'Cucumbers can encourage potato blight; keep well apart.',
  'Corn|Tomatoes':'Both attract hornworms and earworms; double the pest pressure.',
  'Squash|Potatoes':'Potatoes harbour diseases that can spread to squash.',
  'Fennel|Basil':'Fennel releases allelopathic compounds that inhibit most nearby plants.',
  'Fennel|Beans':'Fennel allelopathy inhibits legume growth and nitrogen fixation.',
  'Fennel|Lettuce':'Fennel chemicals trigger premature bolting in lettuce.',
  'Garlic|Beans':'Garlic sulphur compounds inhibit nitrogen-fixing bacteria in legume roots.',
  'Garlic|Peas':'Allium chemicals inhibit pea nodule formation and overall growth.',
  'Onions|Asparagus':'Allium root exudates stunt asparagus growth; keep apart permanently.',
  'Potatoes|Pumpkins':'Both susceptible to blight; growing together doubles disease risk.',
  'Strawberries|Cabbage':'Brassicas may stunt strawberry growth and reduce fruit set.',
  'Rosemary|Cucumbers':'Rosemary prefers dry conditions; cucumber moisture needs may be inhibited.',
  'Sorrel|Beans':'Sorrel oxalic acid compounds inhibit nitrogen fixation in bean roots.',
  'Sorrel|Peas':'Same inhibitory effect on pea nodules as on beans.',
  'Good King Henry|Beets':'Same Amaranthaceae family — direct competition for identical nutrients.',
  'Good King Henry|Chard':'Closely related species; heavy nutrient competition in shared beds.',
};

// ── Phase 64: Problem diagnosis data ───────────
export const PROBLEM_SYMPTOMS = [
  { id:'yellow', label:'Yellowing leaves', emoji:'💛' },
  { id:'wilt',   label:'Wilting / drooping', emoji:'😔' },
  { id:'holes',  label:'Holes in leaves', emoji:'🕳️' },
  { id:'spots',  label:'Spots or patches', emoji:'🟤' },
  { id:'slow',   label:'Slow / stunted growth', emoji:'📉' },
  { id:'pest',   label:'Pest visible', emoji:'🐛' },
];
export const PROBLEM_LOCATIONS = [
  { id:'new',   label:'New / top leaves' },
  { id:'old',   label:'Old / lower leaves' },
  { id:'whole', label:'Whole plant' },
  { id:'stems', label:'Stems / base' },
];
export const PROBLEM_DIAGNOSES = {
  'yellow|new':[
    { cause:'Iron or manganese deficiency', desc:'High pH locks out micronutrients — leaves yellow but veins stay green.', organic:'Acidify soil with sulphur; foliar spray with chelated iron or seaweed extract.', conventional:'Apply iron chelate; test and adjust soil pH below 7.0.' },
    { cause:'Overwatering / root rot', desc:'Waterlogged roots can\'t absorb nutrients, causing yellowing from new growth first.', organic:'Reduce watering; add perlite or grit for drainage; let soil dry out.', conventional:'Allow soil to dry; treat with fungicide drench if roots are brown and mushy.' },
  ],
  'yellow|old':[
    { cause:'Nitrogen deficiency', desc:'N is mobile — plant strips older leaves first. Pale yellow spreading upward from base.', organic:'Apply fish emulsion, blood meal, or compost tea immediately.', conventional:'Side-dress with ammonium nitrate or balanced NPK fertiliser.' },
    { cause:'Magnesium deficiency', desc:'Interveinal yellowing on old leaves; veins stay green. Common in sandy or acidic soils.', organic:'Drench with Epsom salts (1 tbsp per gallon water); apply weekly.', conventional:'Apply magnesium sulphate; ensure soil pH is 6.0–7.0.' },
  ],
  'yellow|whole':[
    { cause:'Overwatering / waterlogged soil', desc:'Roots suffocate in saturated soil, causing rapid whole-plant yellowing and wilting.', organic:'Stop watering; lift and inspect roots; repot with fresh grit-mixed compost.', conventional:'Improve drainage urgently; apply systemic fungicide if root rot present.' },
    { cause:'Severe nitrogen deficiency', desc:'Uniform pale yellowing across entire plant — soil is exhausted of nitrogen.', organic:'Urgent: water with fish emulsion or diluted chicken manure liquid.', conventional:'Apply liquid high-nitrogen fertiliser immediately.' },
  ],
  'yellow|stems':[
    { cause:'Fusarium wilt or stem rot', desc:'Yellowing from the base upward with stem discolouration — soil-borne fungal disease.', organic:'Remove affected plants; solarise soil; don\'t replant same family for 3 years.', conventional:'Apply copper fungicide; practice strict 3–4 year crop rotation.' },
  ],
  'wilt|new':[
    { cause:'Heat or drought stress', desc:'Afternoon wilt on young leaves is usually heat stress — check soil moisture first.', organic:'Water deeply at the base; apply 2–3 inches of mulch to retain moisture.', conventional:'Deep, consistent watering; use shade cloth in extreme heat (>35°C/95°F).' },
  ],
  'wilt|old':[
    { cause:'Root rot (overwatering)', desc:'Established plants wilting despite moist soil points to root damage from excess water.', organic:'Reduce watering; check roots (brown/mushy = rot); add grit for drainage.', conventional:'Apply fungicide root drench; add drainage holes to containers.' },
  ],
  'wilt|whole':[
    { cause:'Drought stress', desc:'Soil dry 2+ inches down — most common cause. Plant prioritises roots over leaves.', organic:'Water deeply and slowly at base; apply thick mulch layer 3–4 inches.', conventional:'Deep watering; consider drip irrigation for consistency.' },
    { cause:'Fusarium or verticillium wilt', desc:'Wilts despite moist soil; brown streaking visible inside stem when cut. Soil-borne.', organic:'Remove and destroy plant; solarise soil; rotate crops 4+ years.', conventional:'No chemical cure — remove plants; use resistant varieties next season.' },
    { cause:'Root rot (Pythium/Phytophthora)', desc:'Soil stays wet; roots are brown and smell musty. Plant can\'t take up water or nutrients.', organic:'Stop watering; allow soil to dry; repot in fresh grit-mixed compost.', conventional:'Apply systemic fungicide drench; improve bed drainage urgently.' },
  ],
  'wilt|stems':[
    { cause:'Stem borer larvae', desc:'Larvae tunnel inside stems causing sudden collapse — especially squash and corn.', organic:'Slice stem, remove larva; bury exposed stem section to encourage re-rooting.', conventional:'Preventative: pyrethrin on stems early season; use row cover for young plants.' },
    { cause:'Sclerotinia stem rot', desc:'Fluffy white mould at stem base with wilting above — favours cool, wet, humid conditions.', organic:'Remove affected plants; improve air circulation; avoid overhead watering.', conventional:'Apply iprodione or procymidone fungicide; rotate crops away from this bed.' },
  ],
  'holes|new':[
    { cause:'Flea beetles', desc:'Tiny shot-hole damage on young leaves — small shiny beetles that jump when disturbed.', organic:'Row covers; sticky traps; diatomaceous earth around stem base.', conventional:'Pyrethrin spray; spinosad applied at dusk when bees are inactive.' },
    { cause:'Caterpillars (young stage)', desc:'Irregular holes from small caterpillars hiding on leaf undersides.', organic:'Hand-pick at night; Bt (Bacillus thuringiensis) spray in morning.', conventional:'Spinosad or pyrethrin spray in evening; check undersides daily.' },
  ],
  'holes|old':[
    { cause:'Slugs or snails', desc:'Irregular holes with slime trails — most active at night or after rain.', organic:'Beer traps; copper tape; crushed eggshells; torch hunt after dark.', conventional:'Iron phosphate bait (Sluggo) — safe around pets and wildlife; reapply after rain.' },
    { cause:'Caterpillars', desc:'Cabbage worms, hornworms, or armyworms eat large ragged holes in older leaves.', organic:'Hand-pick; Bt spray (Bacillus thuringiensis) in morning.', conventional:'Spinosad or bifenthrin; inspect daily during active feeding months.' },
  ],
  'holes|whole':[
    { cause:'Grasshoppers', desc:'Widespread damage across whole plant — more common during hot, dry summers.', organic:'Row covers; Nosema locustae biological bait applied early in the season.', conventional:'Carbaryl or permethrin spray; best applied in morning when insects are feeding.' },
    { cause:'Multiple pests', desc:'Different pests feeding at different levels simultaneously — check undersides at night.', organic:'Bt for caterpillars + beer traps for slugs + neem oil for aphids.', conventional:'Broad-spectrum insecticide; hand-pick at night with a torch.' },
  ],
  'spots|new':[
    { cause:'Powdery mildew', desc:'White powdery coating on new leaves — favoured by warm days, cool nights, low humidity.', organic:'Diluted baking soda spray (1 tsp/quart); improve air circulation; prune crowded growth.', conventional:'Myclobutanil or trifloxystrobin fungicide; apply at very first sign.' },
    { cause:'Downy mildew', desc:'Yellow patches on top surface, grey-purple fuzz underneath — cool wet conditions.', organic:'Copper fungicide; improve air circulation; avoid all overhead watering.', conventional:'Chlorothalonil or mancozeb fungicide; remove severely affected leaves.' },
  ],
  'spots|old':[
    { cause:'Early blight (Alternaria)', desc:'Brown spots with yellow halo and concentric rings — starts on oldest leaves and moves upward.', organic:'Remove affected leaves; copper fungicide; mulch to prevent soil splash onto leaves.', conventional:'Chlorothalonil fungicide every 7–10 days; stake plants to improve airflow.' },
    { cause:'Septoria leaf spot', desc:'Small circular spots with dark border and tan centre — common on tomatoes mid-season.', organic:'Copper spray; remove affected leaves; mulch around base to stop soil splash.', conventional:'Chlorothalonil or mancozeb; remove lower leaves to improve airflow significantly.' },
  ],
  'spots|whole':[
    { cause:'Bacterial speck or spot', desc:'Water-soaked dark spots, often with yellow halo — spreads rapidly in warm, wet weather.', organic:'Copper-based bactericide; avoid all overhead watering; sanitise tools between plants.', conventional:'Fixed copper spray; remove all affected leaves; improve air circulation.' },
    { cause:'Anthracnose', desc:'Sunken dark spots on fruit and leaves — most common in warm, wet humid conditions.', organic:'Copper fungicide; improve drainage; avoid wetting foliage when watering.', conventional:'Mancozeb or chlorothalonil fungicide from early in the season.' },
  ],
  'spots|stems':[
    { cause:'Botrytis grey mould', desc:'Grey fuzzy mould on stems — thrives in cool, humid, crowded or damaged plant conditions.', organic:'Remove all affected parts; improve air circulation urgently; reduce overhead watering.', conventional:'Iprodione or fludioxonil fungicide; avoid plant damage that creates entry points.' },
  ],
  'slow|whole':[
    { cause:'Nutrient deficiency', desc:'Poor, compacted, or exhausted soil lacking N, P, or K slows growth at all stages.', organic:'Compost top-dress; fish emulsion; worm castings application this week.', conventional:'Balanced granular fertiliser (10-10-10); soil test to identify specific deficit.' },
    { cause:'Temperature stress', desc:'Most crops slow dramatically outside their optimal temperature range — be patient.', organic:'Row covers for cold; shade cloth for heat; mulch to moderate soil temperature.', conventional:'Frost blankets; no chemical fix — adjust the growing environment.' },
    { cause:'Root restriction or compaction', desc:'Roots can\'t expand, so the plant stalls despite adequate water and nutrients.', organic:'Loosen soil around base; repot if container-grown; thin crowded plantings.', conventional:'Aerate soil; consider raised bed with fresh loose compost-rich mix.' },
  ],
  'slow|stems':[
    { cause:'Root-bound container plant', desc:'Circling roots in a too-small container can\'t take up nutrients or water efficiently.', organic:'Transplant to a container 1–2 sizes larger; tease out circling roots gently.', conventional:'Same approach — this is a physical constraint, not a nutritional problem.' },
  ],
  'pest|new':[
    { cause:'Aphids', desc:'Soft-bodied insects in clusters on new growth and buds — green, black, white, or woolly.', organic:'Strong water blast; neem oil spray; insecticidal soap; encourage ladybirds.', conventional:'Imidacloprid systemic drench; pyrethrin spray on colonies.' },
    { cause:'Thrips', desc:'Tiny slender insects causing silvery streaks and distorted, curled new growth.', organic:'Blue sticky traps; neem oil; spinosad spray applied in early morning.', conventional:'Spinosad or imidacloprid; repeat every 5–7 days until clear.' },
  ],
  'pest|old':[
    { cause:'Whitefly', desc:'Tiny white flies on leaf undersides — a white cloud erupts when plant is shaken.', organic:'Yellow sticky traps; insecticidal soap; neem oil spray on undersides.', conventional:'Imidacloprid systemic drench; bifenthrin spray targeting undersides.' },
    { cause:'Spider mites', desc:'Fine webbing on leaf undersides; tiny red/yellow dots — worse in hot, dry conditions.', organic:'Predatory mites; strong daily water spray; neem oil; increase humidity around plant.', conventional:'Abamectin or spiromesifen miticide; repeat weekly for 3 weeks.' },
  ],
  'pest|whole':[
    { cause:'Aphids', desc:'Sticky honeydew residue, distorted growth, and trails of ants are tell-tale signs.', organic:'Neem oil; insecticidal soap; attract ladybirds with companion flowers.', conventional:'Pyrethrin or imidacloprid; check undersides thoroughly for active colonies.' },
    { cause:'Scale insects', desc:'Hard or soft bumps on stems — often overlooked as part of the plant structure.', organic:'Rubbing alcohol on cotton bud; neem oil; horticultural oil spray.', conventional:'Systemic imidacloprid; horticultural oil at the crawler (juvenile) stage.' },
  ],
  'pest|stems':[
    { cause:'Stem borer larvae', desc:'Entry holes at stem base with powdery frass (sawdust-like droppings) — squash and corn most affected.', organic:'Insert wire to kill larva; wrap stems in foil to deter egg-laying.', conventional:'Preventative: bifenthrin spray on stems before main egg-laying period.' },
    { cause:'Cutworms', desc:'Seedlings cut off at soil level overnight — fat C-shaped larvae hide in soil by day.', organic:'Cardboard collar around stem base; diatomaceous earth; Bt kurstaki in soil.', conventional:'Bifenthrin granules in soil; spinosad drench around base.' },
  ],
};

// Phase 93 — Feature Flags
export const DEFAULT_FEATURES = {
  seeds: true, startIndoors: true, beds: true, succession: true,
  companionPlanting: true, harvestTracking: true, weatherForecast: true,
};

// ── Gardening tips ─────────────────────────────
export const TIPS = [
  'Plant tomatoes deep — buried stems develop extra roots, producing stronger plants.',
  'Marigolds repel aphids, nematodes, and whiteflies. Scatter them throughout your garden.',
  'Water in the morning so leaves dry before evening, reducing fungal disease risk.',
  'Succession-sow lettuce every 2 weeks for a continuous harvest all season long.',
  'A 2–3 inch layer of mulch suppresses weeds and keeps soil moisture even.',
  'Pinch off the first flowers on peppers to redirect energy into bigger yields later.',
  'Rotate crop families each year to prevent soil-borne disease and pest buildup.',
  'Corn, beans, and squash — the Three Sisters — grow better together than apart.',
  'Never compost diseased plant material. Pathogens can survive and spread next season.',
  'Harvest herbs in the morning after dew dries for the most intense essential oils.',
  'Garlic planted in autumn produces the largest bulbs the following summer.',
  'Water deeply and infrequently. Shallow watering encourages shallow, weak roots.',
  'Baking soda spray (1 tsp per quart of water) prevents powdery mildew on squash.',
  'Radishes sown alongside carrots break up soil and mark slow-germinating rows.',
  'A soil thermometer is more useful than air temperature for deciding when to plant.',
  'Hardening off is essential — move seedlings outside for 1 more hour per day over 7–10 days.',
  'Parsnips get sweeter after the first frost converts their starches to sugar.',
  'Floating row cover keeps most pests out while letting light through — remove during pollination.',
  'Test your soil pH before planting. Most vegetables prefer a range of 6.0–7.0.',
  'Snap peas taste sweetest when picked young, before seeds bulge through the pod.',
  'Cold frames extend your growing season by 4–6 weeks in both spring and autumn.',
  'Kale and Brussels sprouts taste better after a frost — wait for it.',
  'Tomatoes need consistent moisture to prevent blossom end rot. Mulch keeps it even.',
  'Legumes like beans and peas fix nitrogen from the air into your soil for future crops.',
  'Growing vertically on trellises saves space, improves airflow, and simplifies harvesting.',
  'Asparagus is a 20-year crop — prepare its permanent bed deeply and well.',
  'Interplanting fast and slow crops (lettuce under tomatoes) maximises every square foot.',
  'Watering at the base of plants rather than overhead prevents many leaf diseases.',
  'Earthworms are a sign of healthy soil. Their castings are the finest natural fertiliser.',
  'Borage flowers are edible and attract pollinators to your vegetable beds.',
  'Pinching basil flowers as they appear keeps leaves flavorful and prolific.',
  'Neem oil spray is effective against aphids, mites, and whiteflies — apply at dusk.',
  'Hilling potatoes every 2 weeks as they grow dramatically increases your yield.',
  'Save seeds from your best-performing plants each year for locally adapted varieties.',
  'Green tomatoes will ripen off the vine — store stem-side down at room temperature.',
  'Dill attracts beneficial insects that prey on aphids and caterpillars.',
  'Planting onions near carrots helps deter carrot fly.',
  'Fennel is allelopathic — most vegetables grow poorly near it. Grow it in isolation.',
  'Squash vine borer damage can be prevented by wrapping stem bases with foil or fabric.',
  'Cilantro bolts quickly in heat. Use slow-bolt varieties and sow a new batch monthly.',
  'Cold stratification (a week in the fridge) improves germination of many perennial seeds.',
  'Deadheading herbs that flower encourages bushy, productive regrowth.',
  'Coffee grounds improve drainage and add nitrogen — work them into soil in moderation.',
  'Eggshells around seedling bases can deter slugs and add slow-release calcium.',
  'Hand-pick hornworms at dusk with a torch — they glow under UV light.',
  'Planting basil near tomatoes may improve their flavour and deter certain pests.',
  'A thin layer of compost applied each spring feeds soil life and slowly releases nutrients.',
  'Leeks can be blanched by mounding soil around the stems as they grow.',
  'Rhubarb leaves are toxic — harvest stems only, and never eat the leaves.',
  'Soak large seeds like beans and squash overnight before planting for faster germination.',
  'Companion-plant nasturtiums as a trap crop — aphids prefer them over your vegetables.',
  'Over-watering is the most common cause of seedling death — let soil dry slightly between waterings.',
  'Chives repel aphids and Japanese beetles. Their flowers are also edible.',
  'Hardneck garlic produces edible scapes in early summer — harvest them to boost bulb size.',
  'Plant a cover crop of crimson clover or winter rye in empty beds to feed the soil.',
  'Mint spreads aggressively — grow it in a container buried in the bed to contain roots.',
  'Cucumber beetles can be deterred by planting radishes as a companion.',
  'Direct-sow root vegetables like carrots and parsnips — they dislike transplanting.',
  'The best time to plant a tree was 20 years ago. The second best time is now.',
];

// ── Phase 9: Achievements ──────────────────────
export const ACHIEVEMENTS = [
  { id: 'first-seed',    icon: '🌱', name: 'First Seed',      desc: 'Add your first crop to My Garden' },
  { id: 'planner',       icon: '📅', name: 'Planner',         desc: 'Log a planting date for a crop' },
  { id: 'first-harvest', icon: '🌾', name: 'First Harvest',   desc: 'Log your first harvest' },
  { id: 'growing-5',     icon: '🌿', name: 'Growing Strong',  desc: 'Grow 5 or more crops at once' },
  { id: 'growing-10',    icon: '🌻', name: 'Green Thumb',     desc: 'Grow 10 or more crops at once' },
  { id: 'journaler',     icon: '✍️', name: 'Journaler',       desc: 'Write your first garden journal entry' },
  { id: 'critic',        icon: '⭐', name: 'Critic',          desc: 'Rate a crop after growing it' },
  { id: 'companion',     icon: '🤝', name: 'Good Neighbours', desc: 'Add a companion crop recommendation' },
  { id: 'custom-crop',   icon: '🔬', name: 'Experimenter',    desc: 'Add a custom crop of your own' },
];

// ── Phase 129: XP level titles ─────────────────
export const LEVEL_TITLES = [
  '', // 0 unused
  'Seedling', 'Sprout', 'Grower', 'Gardener', 'Cultivator',
  'Horticulturist', 'Master Gardener', 'Garden Sage', 'Garden Legend',
];

// ── Phase 125: Milestone type icons ───────────
export const MILESTONE_ICONS = {
  planted:  '🌱',
  harvest:  '🌾',
  stage:    '📈',
  problem:  '⚠️',
  removed:  '🗑️',
};

// ── Phase 58: Hardening-off schedule ──────────
export const HARDENING_STEPS = [
  { day: 1,  desc: '1h outside in sheltered, shady spot' },
  { day: 2,  desc: '2h outside, partial shade' },
  { day: 3,  desc: '3h outside, morning sun OK' },
  { day: 4,  desc: '4h outside, some direct sun' },
  { day: 5,  desc: '5h outside, dappled sun' },
  { day: 6,  desc: '6h outside, more sun exposure' },
  { day: 7,  desc: 'Rest day indoors if cool weather expected' },
  { day: 8,  desc: '6h, full morning sun' },
  { day: 9,  desc: '7h, light breeze OK' },
  { day: 10, desc: '8h outside, check soil moisture carefully' },
  { day: 11, desc: '9h, overnight in cold frame if available' },
  { day: 12, desc: 'Overnight outside if no frost forecast' },
  { day: 13, desc: 'Full day and night outside' },
  { day: 14, desc: 'Ready to transplant! 🌱' },
];

// ── Phase 47: Seasonal nudge triggers ─────────
export const NUDGE_TRIGGERS = [
  { key: 'spring-start-warm',  daysBefore: 42, frost: 'last',
    title: '🌱 Start warm-season seeds indoors',
    body: 'Last frost is ~6 weeks away — prime time to start tomatoes, peppers, and eggplant.' },
  { key: 'spring-start-slow',  daysBefore: 56, frost: 'last',
    title: '🌱 Start slow-growing seedlings',
    body: 'Celery, leeks, and celeriac need 8+ weeks indoors before transplanting.' },
  { key: 'spring-sow-cold',    daysBefore: 21, frost: 'last',
    title: '🥬 Direct sow cold-tolerant crops',
    body: 'Peas, spinach, lettuce, and radishes can handle light frost — sow outdoors now.' },
  { key: 'spring-transplant',  daysAfter:   7, frost: 'last',
    title: '✅ Last frost has passed',
    body: 'Harden off seedlings and get warm-season crops in the ground.' },
  { key: 'autumn-start',       daysBefore: 56, frost: 'first',
    title: '🍂 Start fall crops indoors',
    body: 'First frost is ~8 weeks away. Start brassicas and root veg for a fall harvest.' },
  { key: 'autumn-harvest',     daysBefore: 14, frost: 'first',
    title: '⚠️ First frost in ~2 weeks',
    body: 'Harvest tomatoes, cucumbers, and peppers soon before frost hits.' },
];

// ── Phase 126: Crop rotation rules ────────────
export const ROTATION_RULES = {
  Solanaceae:    { warn: 'Blight & nematodes build up rapidly', next: ['Legume','Apiaceae','Allium'] },
  Brassicaceae:  { warn: 'Clubroot & cabbage root fly persist in soil', next: ['Allium','Legume','Chenopodiaceae'] },
  Cucurbit:      { warn: 'Powdery mildew spores & vine borers overwinter', next: ['Legume','Allium','Apiaceae'] },
  Apiaceae:      { warn: 'Carrot fly larvae overwinter', next: ['Legume','Solanaceae','Brassicaceae'] },
  Chenopodiaceae:{ warn: 'Beet cyst nematode & leaf miners accumulate', next: ['Legume','Allium','Cucurbit'] },
  Asteraceae:    { warn: 'Sclerotinia & aphid colonies can persist', next: ['Legume','Allium'] },
};
export const ROTATION_SAFE = new Set(['Legume','Allium','Lamiaceae','Tropaeolaceae','Boraginaceae','Grass','Rosaceae','Ericaceae','Grossulariaceae']);

// ── Family emoji map ───────────────────────────
export const FAMILY_EMOJI = {
  Solanaceae:'🍅', Brassicaceae:'🥦', Legume:'🫘', Cucurbit:'🥒',
  Allium:'🧅', Apiaceae:'🥕', Chenopodiaceae:'🥬', Asteraceae:'🌼',
  Lamiaceae:'🌿', Grass:'🌽',
};

// ── Phase 134: Care action types ───────────────
export const CARE_TYPES = [
  { id: 'fertilise', icon: '🧪', label: 'Fertilise'  },
  { id: 'prune',     icon: '✂️', label: 'Prune'      },
  { id: 'spray',     icon: '💦', label: 'Pest Spray' },
  { id: 'stake',     icon: '🪝', label: 'Stake'      },
];
