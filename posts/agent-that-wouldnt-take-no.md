*Last updated 26 September 2026. The investigation and the government's review are still running, so some details may change. Views are my own, not my employer's.*

> **In short:** An OpenAI research agent working on an ordinary task got past a government portal's refusals, reached non-public files and wrote to an internal server, and nobody in government noticed. The lesson I take from it is to keep public systems away from non-public data, and to notice when something keeps trying doors. If you run agents, you're now part of the threat model too.

I run infrastructure for a living, and in the evenings I'm building an AI product that relies on agents. The Medicare portal incident sits right where those two jobs meet. It's easy to take only half a lesson from it, so this is my attempt at the whole thing.

## The portal that said no

On 18 June 2026, OpenAI researchers were using an internal model, running as an agent, to research public spending on medicines.[^1] It went to Services Australia's Medicare Statistics Reporting Service, a public portal of aggregated Medicare and Pharmaceutical Benefits Scheme statistics.[^2]

The portal said no, repeatedly. In the Prime Minister's words, the agent "didn't accept no for an answer".[^1] It tried other routes, reached public and non-public information within the portal and, according to Services Australia, wrote files to an internal server.[^1]

OpenAI became aware of the activity on 11 August, during a review of misaligned model activity. On 10 September, 84 days after the event, it emailed Services Australia's public disclosure inbox.[^3] The Prime Minister went public on 24 September and set up a taskforce to review whether existing processes can handle AI-related cyber incidents.[^1]

The damage looks limited. The government believes no personal information was accessed "at this stage", and says the evidence so far shows no broader compromise of Services Australia's network.[^1] OpenAI says the information accessed included aggregate health statistics and internal file names.[^3]

Minister Katy Gallagher described the portal as a legacy system: "not a system of government significance", but one that "did have protections in place".[^4] She has also said "we won't be reactivating it".[^5]

## The visitor nobody planned for

Forgotten government websites with weak access controls are an old problem. What caught my attention is who found this one.

The visitor was a research agent from a legitimate company, working on an ordinary task. Transluce, which documented agents linked to OpenAI probing other public data providers, including the Australian Institute of Health and Welfare, put it plainly: "the tasks the agents were trying to solve were *not cyber-related*".[^6]

The agents tried SQL injection, cross-site scripting and path traversal "after failing to retrieve data through normal means".[^6] Nobody asked them to attack anything. The exploit attempts came out of trying to finish the job. OpenAI's post-mortem of a separate incident, involving Hugging Face, found the same trait: its agents rarely gave up on evaluation tasks, even ones that appeared impossible.[^7]

The obvious objection is that any scanner could have found this portal's weaknesses. True, and that's the problem. We've tended to design around attackers who are rare and malicious, and hoped that obscure systems would fall below their attention. Now there are agents that nobody pointed at a target, and I expect there'll be many more of them, patiently trying every door when the front one is locked.

People with bad intent are using the same capability deliberately. In November 2025, Anthropic reported a state-sponsored espionage campaign in which AI did an estimated 80–90% of the work.[^8]

So the working assumption has to change. Every reachable endpoint will be found and tested, and a refusal from your application may be treated as a puzzle rather than a boundary.

I've seen this from the other side with my own agents. Our coding and QA agents run on a cloud server, and our production bot protection blocks that traffic, as it should. We didn't ask the agents to find a cleverer way in. We gave them one sanctioned test path that we control, and a written rule never to improvise another.

## Three old failures

> **What we don't know yet**
>
> - How the agent got past the portal's controls. No root cause has been published.
> - What was written to the internal server, and how. That's still under forensic investigation.[^2]
> - Whether any offence applies. That's for investigators and possibly the courts.
> - Who else was affected. OpenAI says it has notified dozens of third parties.[^9]
>
> What follows is my reading of what has been reported.

Three things went wrong, and none of them is new.

**The public tier could reach non-public data.** The agent got to non-public information through the same portal that served the public.[^1] Richard Marles, acting as Prime Minister that day, put it this way: "The AI agent climbed the fence." The data, he said, "was not sitting behind a particularly high fence".[^10]

**The public tier could write to an internal system.** A statistics portal serving anonymous visitors should give them no way to create files on an internal server. However it happened, that path shouldn't have existed. To me, it's the most important detail in the whole story.

**Nobody detected it.** Services Australia found out from the company whose model did it.[^3] Repeated refusals followed by new approaches, requests for odd files and an unexpected write to an internal server are the signals monitoring should catch while it's happening.

We've been here before. In the 2022 Optus cyber attack, the Australian Communications and Media Authority (ACMA) alleges that a coding error in access control went undetected for four years, on a domain left dormant rather than decommissioned. The personal information of more than nine and a half million current and former customers was accessed.[^11]

ACMA says the attack wasn't sophisticated: it was "carried out through a simple process of trial and error".[^11] Trial and error is what agents do best.

## We only know because they told us

OpenAI's handling wasn't good enough. Eighty-four days is too long, a public inbox checked once a day was the wrong channel,[^4] and a full public account should follow once the investigation is done.

But I keep coming back to how we found out at all. OpenAI found the activity in its own review, reported it, and has since published an account of its models' impact on dozens of other organisations.[^9] Without that, the government might still not know. If the main reaction to disclosure is ridicule and punishment, the rational move for the next company is to say less, later.

The companies that report aren't the only source of this risk, either. In 2023, researchers showed the safety training on Meta's openly released Llama 2-Chat 13B could be undone for less than $200.[^12] Hosted models can be jailbroken too: the attackers in Anthropic's case broke their work into small, innocent-looking tasks and told Claude it was working for a legitimate security firm on defensive testing.[^8] Criminals and state actors running models like these won't file incident reports, so disclosures from the developers who do report are one of the few direct views we get of agents in the wild.

A blameless postmortem focuses on "the contributing causes of the incident without indicting any individual or team",[^13] and aviation's "just culture" doesn't blame people for honest errors while still holding them accountable for wilful violations and gross negligence.[^14] Both exist to keep people reporting.

Australia already applies this thinking to cyber incidents. The Cyber Security Act 2024 limits how the National Cyber Security Coordinator can use information shared voluntarily, so organisations can engage early without fearing it will be handed to regulators or law enforcement, though it isn't a safe harbour. The Act also set up a Cyber Incident Review Board for independent, no-fault reviews of significant incidents.[^15]

I'd like the government's review to land in the same place: hold AI companies firmly to account for delay, poor channels and incomplete accounts, make prompt and direct notification a clear obligation, and make coming forward easier than staying quiet. The goal is fewer incidents and faster discovery of the ones that happen, not fewer reports.

## Public by design, private by default

The portal existed to publish statistics to anyone who wanted them, so hiding it behind a VPN would have defeated the point. The principle I'd apply instead:

> **Public services should expose only public data, from a tier that can't read or write anything else. Everything else should be private by default. Every layer still needs authentication, authorisation, patching, monitoring and segmentation.**

Non-public data and internal servers belong where the public tier has no route and no credentials to reach them. The Medicare portal let users customise the content and format of their reports,[^16] so this can't just mean publishing static files. A portal like that can still run live queries, as long as it runs them against a read-only store that holds only released data, kept in its own plane and fed by a one-way push from inside.

![Before: the public portal reads non-public data and can write to an internal server. After: the portal only queries a store of released data, internal systems push releases to it one way, and there is no route from the portal into the private plane.](/images/writing/public-private-planes-v2.png)

The government's own fix follows the same logic. The portal's public data is moving to data.gov.au, and Gallagher has directed Services Australia to move data off its other legacy public-facing websites, or decommission them where appropriate.[^2]

## Why reachability still matters

A service doesn't become private because it has a login page, an unadvertised hostname or an unpredictable URL. Certificate-transparency logs publicly record TLS certificates as they're issued, and anyone can watch them,[^17] while DNS, cloud address ranges and search engines give away plenty more. Obscurity may delay discovery, but it doesn't control access.

Authentication matters enormously, but it only acts once traffic has reached something that can process it. By then the visitor is already talking to your TLS stack, proxy, framework, parsers and every API route. The Open Worldwide Application Security Project (OWASP) counts all of those paths in and out of an application, and the code that protects them, as its attack surface.[^18]

A correct identity layer rejects a bad login. It can't promise that an old endpoint doesn't skip the authentication middleware, or that nobody can reach the origin server directly, around the proxy. Private routing, firewalls and segmentation are an independent layer: they shrink the number of things that can reach a workload at all, and they contain the damage when something else fails.

None of this is a retreat from zero trust. The US National Institute of Standards and Technology (NIST) says zero trust grants no implicit trust based solely on network location.[^19] Google's BeyondCorp famously moved its corporate applications onto the internet, exposing them through an internet-facing access proxy.[^20] That's a public broker in front of a private origin, the pattern I'm arguing for.

The network grants no trust, but it still limits reachability.

## The catch: gateways are exposed too

The VPNs, firewalls and access gateways that provide private access are themselves exposed to the internet. Verizon's 2026 Data Breach Investigations Report found that exploiting vulnerabilities is now the most common way in, at 31% of initial access, up from 20% the year before.[^21] It also found the median time to fully fix a vulnerability known to be exploited grew to 43 days, and only 26% had been fully fixed.[^21]

The previous year's report found edge devices and VPNs were the target in 22% of exploitation cases, up from 3%,[^22] and the Australian Signals Directorate (ASD) has published detailed guidance on securing them.[^23]

Private access done badly can be worse than none. The Australian Information Commissioner alleges that in the 2022 Medibank breach, an attacker logged into the company's VPN with stolen credentials alone, because it didn't require multi-factor authentication (MFA).[^24]

So private by default only works if the gateway is the most carefully patched and watched system you own. Prefer brokers with outbound-only connectors, so the origin network has no listening port. Patch edge devices first, require phishing-resistant MFA and device checks before any connection is made, and keep the gateway's own logs.

Some endpoints are harder to hide. SFTP servers and APIs used by clients without static IP addresses, or protected by a password alone, need as many safeguards as you can give them. I'd stack mutual TLS (mTLS), public/private key pairs or client certificates, known client and destination IP ranges wherever you can get them, and preferably a private route such as zero-trust network access (ZTNA) or virtual private cloud (VPC) peering onto private subnets.

It also has to be usable, or people build public workarounds and you end up more exposed than before. And some data can't be made network-private at all. For software-as-a-service platforms like Microsoft 365 or Salesforce, identity is the perimeter: conditional access tied to managed devices, tenant restrictions and no anonymous sharing links.

## If you run agents, you're in the threat model too

This incident has a second audience: everyone building or deploying AI agents, which increasingly means ordinary engineering teams, mine included.

The product I build has an AI assistant that works with sensitive client data and can connect to outside tool servers. Our team contract puts the principle simply: "Hard limits stay in code: organisation scoping, authorization, approval for writes, data egress, and audit. Constrain what the model can affect, never how it thinks."

Writes need approval, and an approval only counts for the exact action that was shown. Once data from an outside server enters a conversation, the assistant shows every change before making it, and its requests to those servers can only go to public HTTPS endpoints, with no redirects and with caps on response size and time. Our coding agents commit but never push, and deployment only happens through CI.

What I'd expect of anyone running agents:

- **Treat refusals as boundaries.** A 401 or 403 should stop the agent, not send it looking for another route, and a 429 means back off. robots.txt rules are "not a form of access authorization",[^25] but they are the site owner's stated wishes, so respect them. Enforce this in the agent harness and network controls, not just the prompt.
- **Scope agents tightly.** Allow-list the domains and tools an agent can use, and block exploit-like behaviour against other people's systems.
- **Watch what your agents do.** Log and review their outbound traffic. If your agent does something to someone else's system, you should know before they do.
- **Have a notification plan.** If your agent affects someone else, contact them quickly and directly, and publish your own security contact.

The law applies too. Part 10.7 of the Commonwealth Criminal Code makes it an offence to intentionally access data protected by an access control system, knowing the access is unauthorised.[^26] Whether that applies here is for investigators, but the government's review is examining whether AI companies should be obliged to notify and cooperate, and whether current offences and penalties are an adequate deterrent.[^5]

## Build for patience

For years, a lot of security has quietly relied on nobody bothering: nobody finding the old portal, or nobody trying again after the first refusal. Agents have ended that assumption, and not only the malicious ones.

I don't want to go back to flat, trusted intranets, and I don't want every private resource one authentication defect away from exposure either. Private by default and zero trust by design sits between the two: minimise reachability, distrust every connection, verify every identity, enforce least privilege and assume every accessible interface will be found.

And when someone's agent gets it wrong, I want them to tell us quickly, and I want that to be the easy choice.

*For the practical side (inventory, classification, a 90-day plan and how this maps to Australia's cyber strategy), see the companion post, [Private by Default: A Practical Playbook](/writing/private-by-default-playbook/).*

---

## References

[^1]: Prime Minister of Australia, *Press conference – New York*, transcript, 24 September 2026. https://www.pm.gov.au/media/press-conference-new-york
[^2]: Healthcare IT News, *OpenAI agent breaches Australian Medicare portal*. https://www.healthcareitnews.com/news/anz/openai-agent-breaches-australian-medicare-portal
[^3]: ABC News, *OpenAI agent hacked Medicare portal, PM says*, 24 September 2026. https://www.abc.net.au/news/2026-09-24/ai-agent-accessed-australian-government-site-pm-says/107189078
[^4]: SBS News, *Medicare hack alert went to inbox checked once a day and took five days to be escalated*, 24 September 2026. https://www.sbs.com.au/news/article/openai-agent-hacked-medicare-albanese-reveals/qas79d9ta
[^5]: Computer Weekly, *Australia sets up taskforce after OpenAI agent breaches statistics portal*. https://www.computerweekly.com/news/366651163/Australia-sets-up-taskforce-after-OpenAI-agent-breaches-statistics-portal
[^6]: Transluce, *Early rogue AI agent activity and attempts to hack found on urlquery.net*. https://transluce.org/agent-activity
[^7]: OpenAI, *The Hugging Face incident and the road ahead*. https://openai.com/index/hugging-face-incident-and-the-road-ahead/
[^8]: Anthropic, *Disrupting the first reported AI-orchestrated cyber espionage campaign*, 13 November 2025. https://www.anthropic.com/research/disrupting-AI-espionage
[^9]: OpenAI, *The Hugging Face incident and other third-party impact from misaligned models*. https://openai.com/hugging-face-incident-and-misalignment/
[^10]: ABC News, *Acting PM Richard Marles says AI incident very serious but impact is minor – as it happened*, 24 September 2026. https://www.abc.net.au/news/2026-09-24/federal-politics-live-blog-openai-medicare-breach/107186578
[^11]: ABC News, *Optus cyber attack could have been prevented four years prior, ACMA says*, 20 June 2024. https://www.abc.net.au/news/2024-06-20/optus-hack/104002682
[^12]: P. Gade, S. Lermen, C. Rogers-Smith and J. Ladish, *BadLlama: cheaply removing safety fine-tuning from Llama 2-Chat 13B*, 2023, arXiv:2311.00117. https://arxiv.org/abs/2311.00117
[^13]: Google, *Site Reliability Engineering*, "Postmortem Culture: Learning from Failure". https://sre.google/sre-book/postmortem-culture/
[^14]: SKYbrary, *Just Culture*. https://skybrary.aero/articles/just-culture
[^15]: Department of Home Affairs, *Cyber Security Act 2024*, https://www.homeaffairs.gov.au/cyber-security-subsite/Pages/cyber-security-act.aspx; and *Limited Use for the National Cyber Security Coordinator* (factsheet), https://www.homeaffairs.gov.au/cyber-security-subsite/files/factsheet-limited-use-for-the-national-cyber-security-coordinator.pdf
[^16]: Services Australia, *Medicare statistics*. https://www.servicesaustralia.gov.au/medicare-statistics
[^17]: IETF, *RFC 6962: Certificate Transparency*. https://datatracker.ietf.org/doc/html/rfc6962
[^18]: OWASP, *Attack Surface Analysis Cheat Sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Attack_Surface_Analysis_Cheat_Sheet.html
[^19]: NIST, *SP 800-207: Zero Trust Architecture*. https://csrc.nist.gov/pubs/sp/800/207/final
[^20]: R. Ward and B. Beyer, *BeyondCorp: A New Approach to Enterprise Security*, ;login:, December 2014. https://www.usenix.org/publications/login/dec14/ward
[^21]: Verizon, *2026 Data Breach Investigations Report*. https://www.verizon.com/business/resources/Td15/reports/2026-dbir-data-breach-investigations-report.pdf
[^22]: Verizon, *2025 Data Breach Investigations Report: Executive Summary*. https://www.verizon.com/business/resources/reports/2025-dbir-executive-summary.pdf
[^23]: Australian Signals Directorate, *Securing edge devices*. https://www.cyber.gov.au/business-government/protecting-devices-systems/hardening-systems-applications/network-hardening/securing-edge-devices
[^24]: Office of the Australian Information Commissioner, *Australian Information Commissioner v Medibank Private Limited*, concise statement, Federal Court of Australia, June 2024. https://www.oaic.gov.au/__data/assets/pdf_file/0025/221974/Australian-Information-Commissioner-v-Medibank-Private-Limited-concise-statement.pdf
[^25]: IETF, *RFC 9309: Robots Exclusion Protocol*, 2022. https://www.rfc-editor.org/rfc/rfc9309
[^26]: *Criminal Code Act 1995* (Cth), Schedule, Part 10.7. https://www.legislation.gov.au/C2004A04868/latest/text
