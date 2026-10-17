*Last updated 18 October 2026. Live results may still change. Views are my own, not my employer's.*

> **In short:** Decision models answer typed questions with probabilities instead of text. I tested one in four places in my automation: two checks went live, two failed, and the real gain was taking choices away from agents that hold tools. Use one where a model already decides, with pass marks set first.

I lead infrastructure and security for a living. At home, about forty n8n workflows and eleven large language model (LLM) agents vet my email, send my kids homework reminders and write my morning brief. When decision models arrived in September, I wanted to know where they belonged.

## What a decision model is

A decision model takes some text, such as an email, plus typed questions, and returns typed answers with probabilities instead of a free-form response or rationale.[^1] TypeSafe AI, which launched Jev on 15 September, calls it "unstructured state in, typed probabilistic decisions out".[^2] Each question type returns a fixed shape:[^1]

| Question | Type | Returns |
|---|---|---|
| Is this automated? | Yes or no | One probability |
| What does it need? | Pick one | An option, with a probability for each |
| How urgent is it? | Scale | A value on the scale, with a probability for each level |

So code only compares a number with a threshold. An LLM can be forced into the same shape, but its confidence is a field it fills in like any other.[^3] The probabilities still need checking: Microsoft advises validating on representative data, setting thresholds by the cost of each kind of error, and testing whether reordering options changes answers.[^1]

## Popular decision models and the alternatives

Rivals arrived within weeks. Amazon open-sourced Strands Decider 2B, small enough to run locally, the same week OpenAI announced a similar offering.[^4] Liquid AI released d1,[^5] Microsoft offers Microsoft-Decision-1,[^1] and open models such as Kev match TypeSafe's API.[^6] Jev costs about four US cents per million input tokens.[^2]

Vals AI's independent tests had Jev matching frontier models on checking claims against a document at a fraction of the cost, but last of twelve on a small legal benchmark slice that Vals says isn't representative of the full benchmark.[^7] Fine-tuned small classifiers remain competitive with, and often better than, prompted LLMs at standard classification, at one to two orders of magnitude lower cost and latency.[^8]

## Where a decision model fits in a pipeline

My stack's house rule is that code decides the facts, and a model only chooses between options code supplies or words text. Most model calls write or act through tools, which a decision model can't do, and the few that choose were mostly buried inside agents holding tools.

Cost was the weak argument: at my volumes, a model a hundred times cheaper per input token saves tens of dollars a month at most.

Separating deciding from acting was the strong one. If an agent holding tools also decides which messages it must leave alone, that rule is only as good as each judgement. Ask a decision model first, and code acts before the agent sees anything: a rule that lived in a prompt now holds by construction.

![Before: one agent decides what each message is and holds the tools, with rules only in its prompt. After: a decision model decides first, code acts when confident, and the rest reaches the agent.](/images/writing/deciding-vs-acting-v1.png)

Two principles followed: use a decision model where a model already decides, never in place of a rule (as I argued in [the Shift Left vs AI debate](/writing/shift-left-vs-ai/)), and let it add a "no" to deterministic checks, never remove one.

## How I tested a decision model

I tested four checks: sorting noise from my email, keeping one sensitive category of mail from the agent, a topic check on messages to my kids, and a check that reworded reminders keep their meaning. The model runs where this mail is already processed, so there's no new vendor or data path.

Instead of a shadow period, I backtested on about 5,100 real messages, most from the last 18 weeks, replaying my current approach as the reference. I fitted thresholds on the earlier weeks and judged on the later ones. The kids' check, lacking history, used 220 constructed messages.

Pass marks came first, such as under 1% of sorted mail needing action at a 95% upper bound. A fifth of cases were rerun with options reversed and questions reworded. No test could message anyone, and passing checks switched on by themselves under a two-week watch.

## What passed, what failed and what it cost

Two of the four passed:

| Check | Result | What decided it |
|---|---|---|
| Email noise sort | On | Sorted 46.5% of held-out mail; 3 of 951 sorted messages needed action |
| Kids' topic check | On | Held back all 36 off-limits test messages (keywords alone: 13) and 0 of 58 everyday ones |
| Sensitive mail hold | Off | Caught 9 of 17, against a 90% mark |
| Reminder meaning check | Off | Rejected 1 of 2 real rewrites, against a 10% limit |

The meaning check's one rejection was arguably right: the LLM had added advice my rules forbid. But my reference counted every real rewrite as faithful, so one correct catch among two examples failed the gate. A backtest can't beat its reference, and mine matched what the agent did only about 80% of the time.

Decisions cost fractions of a cent, but replaying my current approach for the reference cost about US$60, against my US$10 to US$25 estimate. Budget for the reference, not the model.

## The lesson for engineering leaders

For me, the value came from moving a decision to where code can enforce it, and from writing pass marks down early enough that two of four checks could fail without argument.

---

## References

[^1]: Microsoft Learn, *Deploy and use Microsoft-Decision-1 in Microsoft Foundry*, 7 October 2026, updated 9 October 2026. https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-microsoft-decision
[^2]: TypeSafe AI, *Introducing System One Models & Jev*, 15 September 2026. https://typesafe.ai/blog/introducing-system-one-models-and-jev
[^3]: Anthropic, *Structured outputs*, Claude Platform Docs, accessed 18 October 2026. https://platform.claude.com/docs/en/build-with-claude/structured-outputs
[^4]: TechCrunch, *Amazon releases its own Jev clone as decision models flood the web*, 1 October 2026. https://techcrunch.com/2026/10/01/amazon-releases-its-own-jev-clone-as-decision-models-flood-the-web/
[^5]: Liquid AI, *Introducing d1: The most capable decision model, now with vision*, 5 October 2026. https://www.liquid.ai/blog/d1-decision-model
[^6]: J. Palmer, *Kev*, GitHub, accessed 18 October 2026. https://github.com/jaredpalmer/kev
[^7]: Vals AI, *An Independent Evaluation of TypeSafe's Jev*, 6 October 2026. https://www.vals.ai/blogs/independent-evaluation-of-jev
[^8]: A. A. Valdes Gonzalez, *Cost-Aware Model Selection for Text Classification: Multi-Objective Trade-offs Between Fine-Tuned Encoders and LLM Prompting in Production*, arXiv:2602.06370, 6 February 2026. https://arxiv.org/abs/2602.06370
