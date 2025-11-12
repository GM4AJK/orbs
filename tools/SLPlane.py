import os
from collections import defaultdict
from math import floor

# === CONFIG ===
INPUT_TLE_FILE = "../public/TLEs/starlink_all.txt"
OUTPUT_DIR = "../public/TLEs/starlink/grouped_planes"
RAAN_BIN_WIDTH = 2.0  # degrees — adjust for tighter/looser grouping

# === UTILS ===
def parse_tle_lines(lines):
    """Yield (name, line1, line2) tuples from a flat list of TLE lines."""
    for i in range(0, len(lines), 3):
        yield lines[i].strip(), lines[i+1].strip(), lines[i+2].strip()

def extract_raan(line2):
    """Extract RAAN from line 2 of TLE."""
    try:
        return float(line2.split()[3])
    except (IndexError, ValueError):
        return None

def extract_epoch(line1):
    """Extract Epoch from line 1 of TLE."""
    try:
        return line1.split()[3]
    except (IndexError, ValueError):
        return None

def bin_raan(raan, bin_width):
    """Assign RAAN to a bin for grouping."""
    return floor(raan / bin_width) * bin_width

# === MAIN ===
def group_tles_by_plane(input_file, output_dir, bin_width):
    with open(input_file, "r") as f:
        lines = f.readlines()

    grouped = defaultdict(list)

    for name, line1, line2 in parse_tle_lines(lines):
        raan = extract_raan(line2)
        epoch = extract_epoch(line1)
        if raan is None or epoch is None:
            continue
        bin_key = bin_raan(raan, bin_width)
        grouped[bin_key].append((name, line1, line2))

    os.makedirs(output_dir, exist_ok=True)

    for bin_key, tles in grouped.items():
        filename = os.path.join(output_dir, f"plane_{int(bin_key)}.tle")
        with open(filename, "w") as f:
            for name, line1, line2 in tles:
                f.write(f"{name}\n{line1}\n{line2}\n")

    print(f"✅ Grouped {len(lines)//3} TLEs into {len(grouped)} orbital planes.")

# === RUN ===
if __name__ == "__main__":
    group_tles_by_plane(INPUT_TLE_FILE, OUTPUT_DIR, RAAN_BIN_WIDTH)
