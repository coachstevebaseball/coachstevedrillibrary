import json
import time

journal_path = "drizzle/meta/_journal.json"

with open(journal_path) as f:
    journal = json.load(f)

# Add the new entry
new_entry = {
    "idx": 52,
    "version": "5",
    "when": int(time.time() * 1000),
    "tag": "0052_add_drills_table",
    "breakpoints": True
}

# Check if already added
existing_tags = [e["tag"] for e in journal["entries"]]
if "0052_add_drills_table" not in existing_tags:
    journal["entries"].append(new_entry)
    with open(journal_path, "w") as f:
        json.dump(journal, f, indent=2)
    print("Journal updated with entry idx=52")
else:
    print("Entry already exists, skipping")
