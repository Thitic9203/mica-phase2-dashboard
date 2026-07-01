# Repo rules

## Fix → report, no preview

Fix done → tell user. No browser preview needed (auth-gated, blocks preview anyway).

## "ดีพอยเลย" = full deploy, no ask

When user says deploy now:
1. Check work clean, ready
2. Commit + push
3. Deploy (staging first if applicable, per global rule)
4. Watch deploy status till done
5. Report result only when finished

Deploy = go to real production URL, not local/self-made preview URL.

## Ask only when unsure

Unsure → ask. Never guess, assume, overreach, or act before told. No exceptions.
