# Repo rules

## Fix → report, no preview

Fix done → tell user. No browser preview needed (auth-gated, blocks preview anyway).

## "ดีพอยเลย" = full deploy, no ask

When user says deploy now:
1. Check work clean, ready
2. Commit + push
3. Deploy with: `wrangler pages deploy public --project-name mica-phase2-dashboard`
4. Watch deploy status till done
5. Report result only when finished

**Production URL: https://mica-phase2-dashboard.pages.dev**

NEVER report a preview/hash URL (e.g. `aeb81a51.mica-phase2-dashboard.pages.dev`).
Always report the real prod URL above.

## Ask only when unsure

Unsure → ask. Never guess, assume, overreach, or act before told. No exceptions.
