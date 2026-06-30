#!/usr/bin/env python3
"""Compare epics from Google Sheet Progress Tracker against dashboard PT_SYSTEMS."""

import csv
import re
import os
import sys

SHEET_CSV = "/tmp/pt.csv"
DASHBOARD = "public/index.html"

SYSTEMS = {
    "ELMS": {"section_marker": "Extended Learning", "prefix": "NDLP68"},
    "CBMS": {"section_marker": "Credit Bank", "prefix": "NDLP68"},
    "EvMS": {"section_marker": "Evaluation", "prefix": "NDLP68"},
}


def parse_sheet_epics():
    with open(SHEET_CSV, encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    current_sys = None
    epics_by_sys = {s: set() for s in SYSTEMS}

    for row in rows:
        if len(row) < 2:
            continue
        module = row[0].strip()
        epic_raw = row[1].strip()

        for sys_id, cfg in SYSTEMS.items():
            if cfg["section_marker"] in module:
                current_sys = sys_id
                break

        if not current_sys or not epic_raw or epic_raw == "N/A":
            continue

        pattern = rf'{SYSTEMS[current_sys]["prefix"]}-(\d+)'
        m = re.match(pattern, epic_raw)
        if m:
            mica_key = f"MICA2-{m.group(1)}"
            epics_by_sys[current_sys].add(mica_key)

    return epics_by_sys


def parse_dashboard_epics():
    with open(DASHBOARD, encoding="utf-8") as f:
        content = f.read()

    pt_match = re.search(r"const PT_SYSTEMS\s*=\s*\[(.*?)\]", content, re.DOTALL)
    if not pt_match:
        print("ERROR: PT_SYSTEMS not found in dashboard")
        sys.exit(1)

    block = pt_match.group(1)
    epics_by_sys = {}

    for sys_id in SYSTEMS:
        sys_pattern = rf"id:\s*'{sys_id}'.*?parent\s+in\s+\(([^)]+)\)"
        m = re.search(sys_pattern, block, re.DOTALL)
        if m:
            keys = set(k.strip() for k in m.group(1).split(","))
            epics_by_sys[sys_id] = keys
        else:
            epics_by_sys[sys_id] = set()

    return epics_by_sys


def update_dashboard(sys_id, new_keys):
    with open(DASHBOARD, encoding="utf-8") as f:
        content = f.read()

    def add_keys_to_parent(match):
        existing = match.group(1)
        existing_keys = [k.strip() for k in existing.split(",")]
        for k in sorted(new_keys):
            if k not in existing_keys:
                existing_keys.append(k)
        return f"parent in ({','.join(existing_keys)})"

    sys_blocks = [
        (r"(id:\s*'" + sys_id + r"'.*?parent\s+in\s+\()([^)]+)(\))", re.DOTALL),
    ]

    updated = content
    pattern = rf"(parent\s+in\s+\()([^)]+)(\))"

    in_sys = False
    lines = updated.split("\n")
    new_lines = []
    for line in lines:
        if f"id: '{sys_id}'" in line:
            in_sys = True
        if in_sys and "parent in (" in line:
            m = re.search(r"parent in \(([^)]+)\)", line)
            if m:
                existing = [k.strip() for k in m.group(1).split(",")]
                for k in sorted(new_keys):
                    if k not in existing:
                        existing.append(k)
                line = line.replace(m.group(0), f"parent in ({','.join(existing)})")
        if in_sys and line.strip().startswith("}") and "," in line:
            in_sys = False
        new_lines.append(line)

    with open(DASHBOARD, "w", encoding="utf-8") as f:
        f.write("\n".join(new_lines))


def set_output(key, value):
    gh_output = os.environ.get("GITHUB_OUTPUT", "")
    if gh_output:
        with open(gh_output, "a") as f:
            f.write(f"{key}={value}\n")


def main():
    sheet = parse_sheet_epics()
    dashboard = parse_dashboard_epics()

    all_new = {}
    for sys_id in SYSTEMS:
        new_keys = sheet[sys_id] - dashboard[sys_id]
        if new_keys:
            all_new[sys_id] = new_keys
            print(f"{sys_id}: NEW epics found: {sorted(new_keys)}")
        else:
            print(f"{sys_id}: OK (sheet={len(sheet[sys_id])}, dashboard={len(dashboard[sys_id])})")

    if not all_new:
        print("\nAll epics match. No update needed.")
        set_output("changed", "false")
        return

    for sys_id, new_keys in all_new.items():
        print(f"\nUpdating {sys_id} with {sorted(new_keys)}...")
        update_dashboard(sys_id, new_keys)

    summary = ", ".join(f"{s}: +{','.join(sorted(k))}" for s, k in all_new.items())
    print(f"\nDone. Summary: {summary}")
    set_output("changed", "true")
    set_output("summary", summary)


if __name__ == "__main__":
    main()
