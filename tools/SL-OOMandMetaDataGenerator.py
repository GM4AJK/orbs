import csv
import os
import re
import json
from collections import defaultdict

# This script takes two input files and generates multiple output files.
# 
# Jonathan's Launch Log is teh first input file.
# https://planet4589.org/space/log/launchlog.txt
#
# The second file is teh full Starlink TLE catalog in JSON OOM format from celestrack.
#
# It scans the launch log looking for flight launches that are putting Starlink
# satellites into space. It then groups all the satellites, per flight, and writes
# out one file for each launch in JSON OOM format of all those satellites.
# Useful for loading into my Orbs tool or into Mick West's Sitrec tool.
#

# === CONFIG ===
#DATA_DIR = "data"
TSV_FILE = "data/launchlog.tsv"
OUTPUT_DIR = "../public/TLEs/json_by_flight"
OMM_FILE = "../public/TLEs/starlink.json"

# === UTILS ===
def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', '_', name).replace(" ", "_")

# === MAIN ===
def group_json_omm_by_flight(tsv_path, omm_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    # Load OMM JSON objects into a lookup by OBJECT_ID
    with open(omm_path, encoding="utf-8") as f:
        omm_data = json.load(f)
    omm_lookup = {obj["OBJECT_ID"]: obj for obj in omm_data if "OBJECT_ID" in obj}

    # Group by Flight_ID
    grouped = defaultdict(list)
    with open(tsv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            name = row.get("Name") or ""
            flight_id = row.get("Flight_ID") or ""
            piece = row.get("Piece") or ""
            if "Starlink" in name and flight_id.strip() and piece:
                piece_id = piece.strip()
                omm = omm_lookup.get(piece_id)
                if omm:
                    enriched = dict(omm)
                    enriched["FLIGHT_ID"] = flight_id.strip()
                    enriched["LAUNCH_DATE"] = row.get("Launch_Date", "").strip()
                    enriched["LAUNCH_TAG"] = row.get("#Launch_Tag", "").strip()
                    enriched["PIECE"] = row.get("Piece", "").strip()
                    enriched["JCAT"] = row.get("JCAT", "").strip()
                    grouped[flight_id.strip()].append(enriched)

    # Write grouped JSON files
    for flight_id, omms in grouped.items():
        safe_name = sanitize_filename(flight_id)
        out_path = os.path.join(output_dir, f"{safe_name}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(omms, f, indent=2)

    print(f"✅ Saved {len(grouped)} grouped OMM JSON files to '{output_dir}'")

# === RUN ===
if __name__ == "__main__":
    group_json_omm_by_flight(TSV_FILE, OMM_FILE, OUTPUT_DIR)