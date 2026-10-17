*Last updated 18 October 2026. Live results may still change. Views are my own, not my employer's.*

> **In short:** Decision models answer typed questions with probabilities instead of writing text, which suits the small judgements inside automation. I tested one in four places in my pipelines: two checks went live and two failed. The cost saving was small, and the real win was pulling decisions out of agents that hold tools, so code can enforce them.

I'm an automation addict. About forty n8n workflows and eleven large language model (LLM) agents vet my email, send my kids their homework reminders, write my morning brief and keep my calendar in order.

Over time I noticed how often a heavy model was doing light work. An agent would read a whole email with a general-purpose LLM just to answer "is this a newsletter?" I wanted to stop using a big model where a small decision would do, get output my pipelines could rely on, and save some money if I could. Decision models, which arrived in September, promise all three.

## What a decision model is

A decision model is a stripped-down cousin of an LLM, typically built on one with the text generation taken out.[^1] You give it some input, such as an email, plus typed questions, and it answers each with probabilities attached, without writing a response or explaining itself.[^2] TypeSafe AI, which launched Jev on 15 September, calls it "unstructured state in, typed probabilistic decisions out".[^3]

There are three kinds of question:[^2]

- yes or no (a "noul"), answered with one probability;
- pick one (a "choice"), answered with an option and a probability for every option;
- place on a scale (a "score"), answered with a position on the scale and a probability for each level.

Microsoft's score is a probability-weighted average of the levels, so it can land between them, and it suggests offering an option such as "cannot tell" so the model isn't forced to guess.[^2]

## What a decision model's output looks like

Here's a request asking all three kinds of question about one email, in the format TypeSafe introduced and open models such as Kev match. Microsoft's takes the same state and questions.[^4][^2]

```json
{
  "state": {
    "from": "news@example.com",
    "subject": "Your weekly roundup",
    "text": "Here's your week in review..."
  },
  "questions": {
    "automated": {
      "type": "noul",
      "instructions": "Is this an automated email?"
    },
    "needs": {
      "type": "choice",
      "instructions": "What do I need to do?",
      "criteria": {
        "reply": "Someone is waiting on me",
        "fyi": "Worth knowing, nothing to do",
        "noise": "Marketing or notifications",
        "cannot_tell": "The email doesn't say"
      }
    },
    "urgency": {
      "type": "score",
      "instructions": "How urgent is it?",
      "criteria": [
        "Whenever", "This week", "Today"
      ]
    }
  }
}
```

And a trimmed response. The numbers are made up, but the shape is the point: each answer comes back under the name of its question, ready for code to check without parsing a word of prose.[^4]

```json
{
  "answers": {
    "automated": {
      "type": "noul",
      "noul": 0.97
    },
    "needs": {
      "type": "choice",
      "choice": "noise",
      "probabilities": {
        "reply": 0.01, "fyi": 0.07,
        "noise": 0.91, "cannot_tell": 0.01
      }
    },
    "urgency": {
      "type": "score",
      "score": 0.11,
      "probabilities": {
        "0": 0.90, "1": 0.09, "2": 0.01
      }
    }
  }
}
```

You can force an LLM into a similar shape with structured outputs,[^5] but any confidence it reports is just another field it fills in. TypeSafe says Jev "can't hallucinate".[^3] That's true in a narrow sense, because it can only pick from the options you supplied, but it can still pick the wrong one.

## What decision models are good for

Decision models earn their keep on repeated, bounded choices. Microsoft lists five patterns:[^2]

- gates and filters that check a condition before a workflow carries on;
- classification and routing to one of a known set of places;
- ranking and prioritisation on a scale you define;
- grading model output against a rubric;
- choosing which model, tool or agent handles a request.

Marc Brooker, whose homebrew project became Amazon's open decision model, put it more simply: they "make a perfect decider for a workflow step".[^1]

They're the wrong tool for creating, summarising, rewriting or explaining, though Microsoft suggests pairing them: route or gate a request first, then send the approved ones to a generative model.[^2]

They also do best on narrow questions. Vals AI's independent tests had Jev level with every system it tested on checking claims against a document, at a fraction of the cost, but last of twelve on a legal benchmark slice that Vals says isn't representative.[^6]

## Popular decision models and the alternatives

The market filled up fast. Within three weeks of Jev's launch, Amazon open-sourced Strands Decider 2B, small enough to run locally, in the same week OpenAI announced a similar offering.[^1] Liquid AI released d1 through its own API, Vercel and OpenRouter,[^7] and Microsoft offers Microsoft-Decision-1 in its Foundry platform.[^2]

Open models such as Kev match TypeSafe's API, so you can run your own.[^4] Jev costs about four US cents per million input tokens.[^3]

The older options haven't gone away. Fine-tuned small classifiers are competitive with, and often better than, prompted LLMs at standard classification, at one to two orders of magnitude lower cost and latency.[^8] Here's how I'd choose:

| Option | Reach for it when | Watch out for |
|---|---|---|
| Rules | The decision is fully specified | Exceptions piling up |
| Fine-tuned classifier | One stable question, lots of labels | Retraining when the question changes |
| Decision model | Several related questions that change | Calibration on your own data |
| LLM with structured outputs | It needs reasoning or a rationale | Cost, latency, self-reported confidence |

## Where a decision model fits in my pipelines

My pipelines have a house rule: code decides the facts, and a model only chooses between options code supplies, or words text. A decision model can only do the first, so I sorted every model call by what it does:

| Kind of call | Example | Decision model? |
|---|---|---|
| Writing | The morning brief, reminders | No, it writes no text |
| Acting | Working the inbox, updating calendars | No, the work is tool calls |
| Extracting with proof | Quoting facts from documents | Not well, it can't quote |
| Choosing | Is this email noise? Is this message off-limits? | Yes |

Only the last row fits, and most of those choices were buried inside agents that also hold tools.

The cost case was weaker than I'd hoped. My stack costs around US$10 a day, and roughly nine-tenths of that is agents reading and acting. A decision model is about a hundred times cheaper per input token than my LLM, but the choices it could take over are a small slice of the bill, worth tens of dollars a month at most.

The real win is separating deciding from acting. When an agent holding tools also decides which messages it must leave alone, that rule is only as good as its judgement each time. Ask a decision model first and code acts before the agent sees anything, so a rule that lived in a prompt now holds by construction.

![Before: one agent decides what each message is and holds the tools, with rules only in its prompt. After: a decision model decides first, code acts when confident, and the rest reaches the agent.](/images/writing/deciding-vs-acting-v1.png)

Much of what my agents "classify" is really rules in disguise, like sender lists or seven tests on calendar fields. And where a model must prove each fact by quoting a line code can find, I kept that: a proof for every item beats a probability that's right on average.

Three principles came out of it. Use a decision model where a model already decides, never in place of a rule, as I argued in [the Shift Left vs AI debate](/writing/shift-left-vs-ai/). Let it add a "no" to deterministic checks, never remove one. And make the checker a different model from the writer.

## How I tested a decision model before trusting it

I picked four checks in three pipelines: sorting noise out of my email before the agent reads it, keeping one sensitive category of mail away from the agent, a second topic check on messages to my kids, and a check that reworded reminders keep their meaning. That last one matters because my existing checks compare numbers, length and banned words, and "No need to walk 20 minutes after dinner" passes all three as a rewrite of "Walk 20 minutes after dinner".

The model came from the cloud provider that already processes this mail, so there was no new vendor or data path. If a call fails, the pipeline falls back to what it did before.

Instead of a shadow period, I backtested on real history. My first plan used six weeks of mail, until the arithmetic showed that even zero mistakes on a sample that size couldn't prove the error rates I wanted. Eighteen weeks gave me about 5,100 messages.

I replayed my current approach over them as the reference, fitted thresholds on the earlier weeks and judged on the later ones. The kids' check had no history, so I used 220 constructed messages.

Every pass mark went down first. For the noise sort, under 1% of sorted mail could be mail that needed action, at a 95% upper bound. A fifth of cases were rerun with options reversed and questions reworded.

No test could message anyone. Passing checks switched on by themselves, watched for two weeks and re-measured weekly after that.

## What passed, what failed and what it cost

Two of the four checks passed:

| Check | Result | What decided it |
|---|---|---|
| Email noise sort | On | Sorted 46.5% of held-out mail; 3 of 951 sorted messages needed action |
| Kids' topic check | On | Held back all 36 off-limits test messages (keywords alone: 13) and 0 of 58 everyday ones |
| Sensitive mail hold | Off | Caught 9 of 17, against a 90% mark |
| Reminder meaning check | Off | Rejected 1 of 2 real rewrites, against a 10% limit |

The noise sort is the workhorse: on my saved real runs, it would have cut the agent's reading from 408 messages to 233, at the price of about 5% of sorted mail the agent would have flagged as worth knowing. The kids' check caught paraphrases a keyword list misses, and a false refusal is cheap: I'm told, and the message waits. The sensitive mail hold missed too much on too few examples, so it stays off.

The meaning check taught me the most. Its one rejection of a real rewrite was arguably right, because the LLM had added advice my rules forbid. But my reference counted every real rewrite as faithful, so a correct catch scored as an error, and with only two in the hold-out, one case decided the gate. A backtest can't beat its reference, and mine agreed with what the agent had actually done only about 80% of the time.

Cost surprised me the other way. All 5,112 email decisions in the backtest cost US$0.18. Replaying my current approach to build the reference cost about US$60, against my estimate of US$10 to US$25. Budget for the reference, not the model.

## What I'd do again

I came in wanting cheaper, more reliable pipelines, and got a little cheaper and a lot more reliable, because two decisions now happen where code can enforce them. If you try this, look at the shape of the bill before the price per token, start where a "no" is cheap, and write the pass marks down before you see a result. Two of my four checks failed, and I'm glad the process was strict enough to let them.

---

## References

[^1]: TechCrunch, *Amazon releases its own Jev clone as decision models flood the web*, 1 October 2026. https://techcrunch.com/2026/10/01/amazon-releases-its-own-jev-clone-as-decision-models-flood-the-web/
[^2]: Microsoft Learn, *Deploy and use Microsoft-Decision-1 in Microsoft Foundry*, 7 October 2026, updated 9 October 2026. https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-microsoft-decision
[^3]: TypeSafe AI, *Introducing System One Models & Jev*, 15 September 2026. https://typesafe.ai/blog/introducing-system-one-models-and-jev
[^4]: J. Palmer, *Kev*, GitHub, accessed 18 October 2026. https://github.com/jaredpalmer/kev
[^5]: Anthropic, *Structured outputs*, Claude Platform Docs, accessed 18 October 2026. https://platform.claude.com/docs/en/build-with-claude/structured-outputs
[^6]: Vals AI, *An Independent Evaluation of TypeSafe's Jev*, 6 October 2026. https://www.vals.ai/blogs/independent-evaluation-of-jev
[^7]: Liquid AI, *Introducing d1: The most capable decision model, now with vision*, 5 October 2026. https://www.liquid.ai/blog/d1-decision-model
[^8]: A. A. Valdes Gonzalez, *Cost-Aware Model Selection for Text Classification: Multi-Objective Trade-offs Between Fine-Tuned Encoders and LLM Prompting in Production*, arXiv:2602.06370, 6 February 2026. https://arxiv.org/abs/2602.06370
