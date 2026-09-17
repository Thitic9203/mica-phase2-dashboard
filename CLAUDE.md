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

<!-- rule:token-context-budget v1 · the same rule in every repo (Thai and English versions) · change one, change all -->
## Token and context budget (iron rule)

**Correctness and completeness come before saving tokens.** Never skip reading the spec, running tests, verifying, or collecting evidence to cut tokens. If the right path costs more, take it and find a cheaper way to walk it. A context window near full makes the model forget early instructions and make more mistakes, so the 70% ceiling protects quality as much as cost.

**Read only what the work needs, with the context-management skill that fits. Invoke skills on need, never in advance.**
- Output that may be large (logs, test runs, JSON, API responses, web pages, data files) goes through the `context-mode` skill (`ctx_execute`, `ctx_batch_execute`, or `ctx_fetch_and_index` then `ctx_search`), so only the derived answer enters context. Without that skill, filter before reading (`rtk`, `grep`, `jq`, `tail`).
- For code, locate before reading (Grep/Glob, or the `smart-explore` skill at symbol level), then Read only the needed range with offset/limit. Do not open a long file whole when a range will do.
- Broad exploration across many files or sources goes to a subagent, which returns conclusions with `path:line`. A lookup whose location is already known is cheaper done directly.
- Prefer page text or the accessibility tree over screenshots. Do not re-read a file you just wrote. Point to a path instead of pasting long file contents into chat.
- A skill already loaded this session needs no second invocation. Independent tool calls go out together in one round.

**Measure context at the end of every major step; never guess the number.**
- Add `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` from the latest assistant message in the session transcript `~/.claude/projects/*/<session-id>.jsonl` (the id is in `$CLAUDE_SESSION_ID` or `$CLAUDE_CODE_SESSION_ID`) and divide by the model's context window, or ask the user to run `/context`. If it cannot be measured or the window size is unknown, ask the user.
- At 60%, write a checkpoint file: what is done, the evidence, the next step, and what to read next.
- At 70%, stop pulling raw data into context, hand the remaining reading to subagents, and tell the user, proposing `/compact <what to keep>` or a fresh session that resumes from the checkpoint.

**CLAUDE.md loads in every session.** Add only rules needed every time, and keep them short. Move details, long procedures, and incident history into skills or documents read on demand, each with a line saying when to read it. Official guidance puts CLAUDE.md under 200 lines, and `@import`ed files still load at session start.
