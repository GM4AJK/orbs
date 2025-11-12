import os
from collections import defaultdict
from math import floor, pi

# === CONFIG ===
INPUT_TLE_FILE = "../public/TLEs/starlink_all.txt"
OUTPUT_DIR = "../public/TLEs/starlink/grouped_shells"
RAAN_BIN_WIDTH = 10.0       # degrees
ALTITUDE_BIN_WIDTH = 100.0  # km — adjust based on shell spacing

EARTH_RADIUS_KM = 6371.0
MU = 398600.4418  # Earth's gravitational parameter, km^3/s^2

# === UTILS ===
def parse_tle_lines(lines):
    for i in range(0, len(lines), 3):
        yield lines[i].strip(), lines[i+1].strip(), lines[i+2].strip()

def extract_raan(line2):
    try:
        return float(line2.split()[3])
    except (IndexError, ValueError):
        return None

def extract_mean_motion(line2):
    try:
        return float(line2.split()[7])
    except (IndexError, ValueError):
        return None

def mean_motion_to_altitude(mean_motion):
    """Convert mean motion (rev/day) to orbital altitude (km)."""
    n_rad_s = mean_motion * 2 * pi / 86400  # convert to rad/s
    a_km = (MU / n_rad_s**2)**(1/3)         # semi-major axis
    return a_km - EARTH_RADIUS_KM           # subtract Earth radius

def bin_altitude(alt_km, bin_width):
    return floor(alt_km / bin_width) * bin_width

def bin_raan(raan, bin_width):
    return floor(raan / bin_width) * bin_width

# === MAIN ===
def group_tles_by_shell_and_plane(input_file, output_dir, alt_bin_width, raan_bin_width):
    with open(input_file, "r") as f:
        lines = f.readlines()

    grouped = defaultdict(lambda: defaultdict(list))

    for name, line1, line2 in parse_tle_lines(lines):
        raan = extract_raan(line2)
        mm = extract_mean_motion(line2)
        if raan is None or mm is None:
            continue
        alt_km = mean_motion_to_altitude(mm)
        shell_key = bin_altitude(alt_km, alt_bin_width)
        plane_key = bin_raan(raan, raan_bin_width)
        grouped[shell_key][plane_key].append((name, line1, line2))

    for shell_key, planes in grouped.items():
        shell_dir = os.path.join(output_dir, f"shell_{int(shell_key)}km")
        os.makedirs(shell_dir, exist_ok=True)
        for plane_key, tles in planes.items():
            filename = os.path.join(shell_dir, f"plane_{int(plane_key)}.tle")
            with open(filename, "w") as f:
                for name, line1, line2 in tles:
                    f.write(f"{name}\n{line1}\n{line2}\n")

    print(f"✅ Grouped into {len(grouped)} shells and {sum(len(p) for p in grouped.values())} planes.")

# === RUN ===
if __name__ == "__main__":
    group_tles_by_shell_and_plane(INPUT_TLE_FILE, OUTPUT_DIR, ALTITUDE_BIN_WIDTH, RAAN_BIN_WIDTH)