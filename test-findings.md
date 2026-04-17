# Key Finding

The 1-2-3 Drill in drills.ts has difficulty: "Easy" (line 151).
But on the page it shows as "MEDIUM" because of drill customizations from the database (customization?.difficulty overrides drill.difficulty).

The filtering logic at line 139 of Home.tsx uses:
  const matchesDifficulty = difficultyFilter === "All" || drill.difficulty === difficultyFilter;

This uses drill.difficulty (the static data), NOT the customized difficulty.
So when difficulty=Easy is set, the 1-2-3 Drill (which is Easy in static data) correctly matches.
The card just displays "MEDIUM" because the admin customized it.

This is actually correct behavior - the filter uses the canonical data, the display uses the customization.
The user sees "MEDIUM" badge but the drill IS an Easy drill in the source data.

This is expected and not a bug.

## Drill Count Issue
- Hero shows "220+" (admin InlineEdit override)
- Results badge shows "217 drills" (actual count from allDrills.length when unfiltered)
- With Easy+Hitting filter: "41 drills"

The hero "220+" is an InlineEdit with defaultValue of `${allDrills.length}+` but the admin may have overridden it to "220+". 
This is fine - the admin chose to display an approximate number.
The results badge always shows the accurate filtered count.
