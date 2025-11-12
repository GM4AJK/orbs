import os
import json
from math import floor, pi
from datetime import datetime, timedelta
from collections import defaultdict

# === CONFIG ===
INPUT_TLE_FILE = "../public/TLEs/starlink_all.txt"
OUTPUT_DIR = "../public/TLEs/starlink/grouped_shells_json"
RAAN_BIN_WIDTH = 10.0       # degrees
ALTITUDE_BIN_WIDTH = 100.0  # km

EARTH_RADIUS_KM = 6371.0
MU = 398600.4418  # km^3/s^2

# === UTILS ===
def parse_tle_lines(lines):
    for i in range(0, len(lines), 3):
        yield lines[i].strip(), lines[i+1].strip(), lines[i+2].strip()

def parse_epoch(epoch_str):
    year = int(epoch_str[:2])
    year += 2000 if year < 57 else 1900
    day_of_year = float(epoch_str[2:])
    day_int = int(day_of_year)
    frac_day = day_of_year - day_int
    dt = datetime(year, 1, 1) + timedelta(days=day_int - 1, seconds=frac_day * 86400)
    return dt.isoformat()

def parse_exponential(base_str, exp_str):
    try:
        base = float(f"0.{base_str}")
        exponent = int(exp_str.replace("+", "").replace("-", "-"))
        return base * (10 ** exponent)
    except:
        return 0.0

def extract_fields(name, line1, line2):
    try:
        epoch_raw = line1[18:32].strip()
        epoch_iso = parse_epoch(epoch_raw)

        bstar = parse_exponential(line1[53:59].strip(), line1[59:61].strip())
        mmddot = parse_exponential(line1[44:50].strip(), line1[50:52].strip())

        return {
            "OBJECT_NAME": name,
            "OBJECT_ID": line1[9:17].strip(),
            "EPOCH": epoch_iso,
            "MEAN_MOTION": float(line2[52:63]),
            "ECCENTRICITY": float("0." + line2[26:33].strip()),
            "INCLINATION": float(line2[8:16]),
            "RA_OF_ASC_NODE": float(line2[17:25]),
            "ARG_OF_PERICENTER": float(line2[34:42]),
            "MEAN_ANOMALY": float(line2[43:51]),
            "EPHEMERIS_TYPE": int(line1[62]),
            "CLASSIFICATION_TYPE": line1[7],
            "NORAD_CAT_ID": int(line1[2:7]),
            "ELEMENT_SET_NO": int(line1[64:68]),
            "REV_AT_EPOCH": int(line2[63:68]),
            "BSTAR": bstar,
            "MEAN_MOTION_DOT": float(line1[33:43].strip()),
            "MEAN_MOTION_DDOT": mmddot,
            "TLE_LINE1": line1,
            "TLE_LINE2": line2,
            "COMMENT": "Grouped by shell and plane from TLE"
        }
    except Exception as e:
        print(f"⚠️ Failed to parse TLE for {name}: {e}")
        return None

def mean_motion_to_altitude(mean_motion):
    n_rad_s = mean_motion * 2 * pi / 86400
    a_km = (MU / n_rad_s**2)**(1/3)
    return a_km - EARTH_RADIUS_KM

def bin_altitude(alt_km, bin_width):
    return floor(alt_km / bin_width) * bin_width

def bin_raan(raan, bin_width):
    return floor(raan / bin_width) * bin_width

# === MAIN ===
def group_tles_to_omm_json(input_file, output_dir, alt_bin_width, raan_bin_width):
    with open(input_file, "r") as f:
        lines = f.readlines()

    grouped = defaultdict(lambda: defaultdict(list))

    for name, line1, line2 in parse_tle_lines(lines):
        fields = extract_fields(name, line1, line2)
        if not fields:
            continue
        alt_km = mean_motion_to_altitude(fields["MEAN_MOTION"])
        shell_key = bin_altitude(alt_km, alt_bin_width)
        plane_key = bin_raan(fields["RA_OF_ASC_NODE"], raan_bin_width)
        grouped[shell_key][plane_key].append(fields)

    for shell_key, planes in grouped.items():
        shell_dir = os.path.join(output_dir, f"shell_{int(shell_key)}km")
        os.makedirs(shell_dir, exist_ok=True)
        for plane_key, omm_list in planes.items():
            filename = os.path.join(shell_dir, f"plane_{int(plane_key)}.json")
            with open(filename, "w") as f:
                json.dump(omm_list, f, indent=2)

    print(f"✅ Exported {sum(len(p) for p in grouped.values())} planes as full OMM JSON arrays.")

# === RUN ===
if __name__ == "__main__":
    group_tles_to_omm_json(INPUT_TLE_FILE, OUTPUT_DIR, ALTITUDE_BIN_WIDTH, RAAN_BIN_WIDTH)
