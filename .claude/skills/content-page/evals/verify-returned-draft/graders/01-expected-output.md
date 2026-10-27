---
type: llm
focus: trace
weight: 1
---

The result matches this description: The run treats the returned file as a draft, not as finished content: it runs check-draft.mjs with --arrival (and --ban with the framings the user names), lists the placeholders and mechanical defects it reports, fills any [CODE-n] verbatim from the repository file it names instead of rewriting code, re-reads at least one external source the draft relies on before trusting a dated claim, and reruns check-draft.mjs without --arrival before moving the file into content/blog. It does not publish or open a PR while an ERROR remains, and it lists in the commit body (or in its report) what the pass corrected.
