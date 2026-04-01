#!/usr/bin/env python3
"""Stream B: Remove poor-transplant crops from startIndoors in zones 5+.

Rules:
  - POOR_TRANSPLANT_CROPS come from crops.json transplant_tolerance == "poor"
  - KEEP_INDOOR_ZONES = 3a, 3b, 4a, 4b  (short-season; indoor start genuinely needed)
  - For every other zone, remove poor-transplant crops from startIndoors
  - Log every removal to stdout
  - Warn (don't auto-remove) about never-indoor crops in startIndoors for any zone
"""

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent
CROPS_FILE   = ROOT / 'data' / 'crops.json'
PLANTING_FILE = ROOT / 'data' / 'planting.json'

KEEP_INDOOR_ZONES = {'3a', '3b', '4a', '4b'}

NEVER_INDOOR_CROPS = {
    'Beans', 'Corn', 'Carrots', 'Beets', 'Radishes',
    'Turnips', 'Parsnips', 'Dill', 'Coriander',
}


def main():
    with open(CROPS_FILE, 'r', encoding='utf-8') as f:
        crops = json.load(f)

    poor_transplant = {
        name for name, c in crops.items()
        if c.get('transplant_tolerance') == 'poor'
    }
    print(f'Poor-transplant crops ({len(poor_transplant)}):')
    for name in sorted(poor_transplant):
        print(f'  {name}')
    print()

    with open(PLANTING_FILE, 'r', encoding='utf-8') as f:
        planting = json.load(f)

    removal_count = 0
    warnings = []

    for zone in sorted(planting.keys()):
        months = planting[zone]
        for month in sorted(months.keys(), key=int):
            sections   = months[month]
            start_list = sections.get('startIndoors', [])

            for crop in start_list[:]:   # iterate copy
                # Remove poor-transplant crops from startIndoors (zones 5+)
                if crop in poor_transplant and zone not in KEEP_INDOOR_ZONES:
                    start_list.remove(crop)
                    print(f'Removed {crop} from startIndoors zone={zone} month={month}')
                    removal_count += 1

                # Flag never-indoor crops as warnings (any zone)
                if crop in NEVER_INDOOR_CROPS:
                    warnings.append(
                        f'WARNING: {crop} in startIndoors zone={zone} month={month}'
                    )

    print(f'\nTotal removals: {removal_count}')

    if warnings:
        print('\nNever-indoor crop warnings:')
        for w in warnings:
            print(w)
    else:
        print('No never-indoor crop warnings.')

    with open(PLANTING_FILE, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(planting, f, indent=2, ensure_ascii=False)

    print(f'\nDone. Wrote {PLANTING_FILE}')


if __name__ == '__main__':
    main()
