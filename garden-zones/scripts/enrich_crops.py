#!/usr/bin/env python3
"""Stream A: Add 5 new structured fields to all crops in crops.json.

New fields:
  transplant_tolerance  "poor" | "moderate" | "good"
  frost_tolerance       "tender" | "light_frost" | "hard_frost"
  direct_sow_ok         boolean
  min_soil_temp_f       integer | null
  category              "vegetable" | "herb" | "fruit" | "flower" | "grain"
"""

import json
import re
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent
CROPS_FILE = ROOT / 'data' / 'crops.json'

# ── Constants ──────────────────────────────────────────────────────────

# From constants.js FROST_SENSITIVE
FROST_SENSITIVE = {
    'Tomatoes', 'Cherry Tomatoes', 'Peppers', 'Jalapeño', 'Eggplant',
    'Basil', 'Cucumbers', 'Beans', 'Runner Beans', 'Lima Beans',
    'Squash', 'Zucchini', 'Butternut Squash', 'Corn', 'Sweet Corn',
    'Melons', 'Watermelon', 'Pumpkins', 'Tomatillos', 'Ground Cherries',
    'Edamame', 'Sweet Potatoes', 'Ginger', 'Lemongrass', 'Okra', 'Peanuts',
}

ADDITIONAL_TENDER = {
    'Thai Basil', 'Turmeric', 'Galangal', 'Taro', 'Yam',
    'Bitter Melon', 'Luffa', 'Hyacinth Beans', 'Malabar Spinach',
    'Water Chestnut', 'Yacon', 'Yardlong Beans', 'Cape Gooseberry',
}
TENDER_NAMES = FROST_SENSITIVE | ADDITIONAL_TENDER

HARD_FROST_NAMES = {
    'Garlic', 'Onions', 'Leeks', 'Shallots', 'Parsnips', 'Kale',
    'Brussels Sprouts', 'Rhubarb', 'Asparagus', 'Horseradish',
    'Jerusalem Artichoke', 'Chives', 'Thyme', 'Sage', 'Winter Savory',
    'Purple Sprouting Broccoli', 'Walking Onions', 'Welsh Onion',
    'Overwintering Onions',
}

CUCURBIT_FAMILIES = {'Cucurbit', 'Cucurbitaceae'}
LEGUME_FAMILIES   = {'Legume', 'Fabaceae'}
ALLIUM_FAMILIES   = {'Alliaceae', 'Amaryllidaceae'}

HERB_NAMES = {
    'Dill', 'Fennel', 'Parsley', 'Coriander', 'Chervil', 'Lemongrass',
    'Ginger', 'Turmeric', 'Galangal', 'Horseradish', 'Wasabi', 'Lovage',
}
FRUIT_FAMILIES = {'Rosaceae', 'Ericaceae'}
FRUIT_NAMES = {
    'Strawberries', 'Raspberries', 'Blueberries', 'Blackberries',
    'Gooseberries', 'Grapes', 'Passionfruit', 'Cape Gooseberry',
    'Melons', 'Watermelon', 'Cantaloupe', 'Honeydew',
}
FLOWER_NAMES = {
    'Marigolds', 'Nasturtiums', 'Lavender', 'Viola', 'Echinacea', 'Yarrow',
    'Chamomile', 'Calendula', 'Sunflowers', 'Borage', 'Valerian',
}
GRAIN_NAMES = {'Corn', 'Amaranth', 'Quinoa', 'Oats', 'Wheat', 'Barley', 'Sweet Corn'}


# ── Field calculators ──────────────────────────────────────────────────

def get_transplant_tolerance(name, c):
    family = c.get('family', '')
    tip    = (c.get('tip') or '').lower()
    tw     = c.get('transplant_weeks') or 0

    # Poor: cucurbits, root legumes, taproots, sunflowers, explicit tips
    if family in CUCURBIT_FAMILIES:
        return 'poor'
    if family in LEGUME_FAMILIES and tw == 0:
        return 'poor'
    if family == 'Apiaceae' and tw == 0:
        return 'poor'
    if name in ('Sunflowers', 'Sunflower'):
        return 'poor'
    if any(kw in tip for kw in ('transplants poorly', 'direct sow only', 'do not start indoors')):
        return 'poor'

    # Good: solanaceae, brassicaceae, alliums, long-season starters
    if family == 'Solanaceae':
        return 'good'
    if family == 'Brassicaceae':
        return 'good'
    if family in ALLIUM_FAMILIES:
        return 'good'
    if name in ('Celery', 'Celeriac', 'Leeks'):
        return 'good'

    return 'moderate'


def get_frost_tolerance(name, c):
    family = c.get('family', '')

    if name in TENDER_NAMES:
        return 'tender'
    # All cucurbits are frost-tender
    if family in CUCURBIT_FAMILIES:
        return 'tender'

    if name in HARD_FROST_NAMES:
        return 'hard_frost'

    return 'light_frost'


def get_direct_sow_ok(name, c):
    tw = c.get('transplant_weeks') or 0
    return tw < 10


def get_min_soil_temp_f(name, c):
    germ = c.get('germ_temp') or ''
    if not germ or germ.upper().startswith('N/A'):
        return None
    m = re.search(r'(\d+)', germ)
    return int(m.group(1)) if m else None


def get_category(name, c):
    family = c.get('family', '')

    # Check in order: herb > flower > grain > fruit > vegetable
    if family == 'Lamiaceae' or name in HERB_NAMES:
        return 'herb'
    if name in FLOWER_NAMES:
        return 'flower'
    if name in GRAIN_NAMES:
        return 'grain'
    if family in FRUIT_FAMILIES or name in FRUIT_NAMES:
        return 'fruit'
    return 'vegetable'


# ── Main ───────────────────────────────────────────────────────────────

def main():
    with open(CROPS_FILE, 'r', encoding='utf-8') as f:
        crops = json.load(f)

    print(f'Loaded {len(crops)} crops')

    counts = {
        'transplant_tolerance': {'poor': 0, 'moderate': 0, 'good': 0},
        'frost_tolerance': {'tender': 0, 'light_frost': 0, 'hard_frost': 0},
        'category': {'vegetable': 0, 'herb': 0, 'fruit': 0, 'flower': 0, 'grain': 0},
        'direct_sow_ok': {'true': 0, 'false': 0},
    }

    for name, c in crops.items():
        if c.get('custom'):
            continue

        tt  = get_transplant_tolerance(name, c)
        ft  = get_frost_tolerance(name, c)
        ds  = get_direct_sow_ok(name, c)
        ms  = get_min_soil_temp_f(name, c)
        cat = get_category(name, c)

        c['transplant_tolerance'] = tt
        c['frost_tolerance']      = ft
        c['direct_sow_ok']        = ds
        c['min_soil_temp_f']      = ms
        c['category']             = cat

        counts['transplant_tolerance'][tt] += 1
        counts['frost_tolerance'][ft]      += 1
        counts['category'][cat]            += 1
        counts['direct_sow_ok']['true' if ds else 'false'] += 1

    with open(CROPS_FILE, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(crops, f, indent=2, ensure_ascii=False)

    print('\nDistribution:')
    print('transplant_tolerance:', counts['transplant_tolerance'])
    print('frost_tolerance:     ', counts['frost_tolerance'])
    print('category:            ', counts['category'])
    print('direct_sow_ok:       ', counts['direct_sow_ok'])
    print(f'\nDone. Wrote {CROPS_FILE}')


if __name__ == '__main__':
    main()
