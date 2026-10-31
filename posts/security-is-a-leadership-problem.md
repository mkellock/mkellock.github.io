*Last updated 31 October 2026. Views are my own, not my employer's.*

> **In short:** Attackers now routinely exploit flaws before a patch exists, and this fortnight's critical vulnerabilities showed the strain that puts on organisations. The gaps I see most often sit with leadership, not tooling. Agree the process before the incident, make visibility the default, price security as revenue protection, own the neglected risks and let the teams who know the systems run their own war rooms.

The last couple of weeks have been a reminder of how quickly things move. Back-to-back vulnerabilities in PHP and in Brotli, a compression library buried in more systems than most people realise, had teams everywhere scrambling, and they got me thinking about how organisations respond to security incidents, and how AI is about to test that response like never before.

PHP shipped fixes for two critical remote code execution flaws on 21 October.[^1] The Brotli flaw sits in a library that Canada's cyber security centre notes is widely integrated into other software, and the US Cybersecurity and Infrastructure Security Agency (CISA) added it to its list of known exploited vulnerabilities on 27 October.[^2]

There's no longer such a thing as a technology company. Every company is one, whether it builds its own software or depends on technology somewhere in its supply chain. The Office of the Australian Information Commissioner received a record 1,205 data breach notifications in 2025, and the three sectors at the top were health service providers, financial services and the Australian Government.[^3]

## How fast attackers exploit vulnerabilities now

The latest M-Trends report estimates the mean time to exploit at minus seven days, meaning exploitation routinely starts before a patch is even released.[^4] Analysis of the 2026 Cost of a Data Breach data concludes that AI is accelerating attacks and compressing response windows.[^5]

The supply chain is exposed too. On 29 October a tampered build of the Claude Code extension, served through one code editor's extension marketplace, tried to install a persistent backdoor on developer machines.[^6] The editor's maker says it reached at most 5,000 users and wasn't developed by Anthropic.[^7]

In my experience, organisations that struggle in weeks like these rarely lack tools. They lack agreement on who does what, how fast and with what authority. The 2022 Accelerate State of DevOps report found "the biggest predictor of an organization's application-development security practices was cultural, not technical".[^8] Leaders set culture, which is why I think that if you have a security problem, you have a leadership problem.

It also makes basic security habits everyone's job, client-facing staff included. The days of being cavalier with a data request are over. Here's where I see responses go wrong, and what I'd do instead.

## Agree remediation deadlines with the engineers who meet them

It often starts with someone committing the business to an aggressive fix deadline for critical vulnerabilities without telling the engineers who'll do the work. There's no runbook, no authority to ship a fix on the spot, and nobody who can make the call is around when the alert lands. Miss it, and the complaint arrives afterwards. Engineering hears "not our deadline", security hears "they don't care", and animosity builds.

A remediation commitment is only real when the people who meet it helped set it. Agree it jointly, resource it and rehearse it. Security owns governance and the organisation-wide runbooks, while each engineering team owns its own runbooks, signed off and tested before an incident.

Capacity matters too. Four in five organisations now carry security debt, and the study's publisher warns flaws are being created faster than organisations can currently fix them.[^9] A deadline that ignores that is a wish.

## Route vulnerabilities to the team that owns the fix

In many organisations, seeing vulnerability data is opt-in and partial, so teams only find issues when someone chases them. Alerts go by ad hoc chat message, often to the wrong person, and security calls whoever is easiest to reach, even when the fix sits in a library or container image another team owns. Underneath is a habit of secrecy that leaves the people who could fix the problem last to know.

Turn that around by making visibility the default. Findings go automatically to the owning team, critical issues page an engineering lead through the normal on-call system, and a clear ownership map means nobody has to ask whose job it is. Drill the flow like any other incident. When exploitation routinely beats the patch, a finding that waits for someone to log in has already lost time.[^4]

Two caveats. Route the findings that matter, such as known exploited flaws, or default visibility drowns teams in scanner noise. And some incident detail does need to stay need-to-know, but by exception.

## Price security work as revenue protection

Plenty of companies say they're security-first in public but don't practise it. Remediation loses to features by default, and with no business-wide agreement on where security sits, product owners and staff set their own priorities. Everyone pulls in different directions, and the gap between what's said and what's done slows the response when something goes wrong.

Features grow revenue, and security remediation preserves it, so frame it that way with business owners and let it compete fairly for priority. The global average breach now costs a record US$4.99 million, and detection and escalation plus lost business make up 63% of breach costs.[^5]

When something does go wrong, run a blameless postmortem with leadership in the room. Leaders set the priorities, so the review should examine those calls and the resourcing as well as the engineers who responded, and ask "as a company, where are we falling down?"

The US Army's 1993 guide to after-action reviews covers what was supposed to happen, what happened, why, and what to sustain or improve, and asks for "open discussion, not one stifled by rank consciousness".[^10] A US Air Force colonel writing about debriefs puts it more bluntly: "there is no rank in the debrief."[^11] That only works if leaders can hear honest feedback about their own calls and leave their egos at the door with their rank.

## Put neglected corners on the risk register

Every organisation has corners nobody wants to look at: a maintenance-mode application, a component untouched for years, a brittle part of an active product whose original engineers have left. Some aren't code at all. Without single sign-on (SSO), access lives in many separate systems, and if access is only reviewed quarterly, one missed offboarding can leave a disgruntled former employee with privileged access for up to three months. These stay engineering's private worry until something breaks, then become a reason to point fingers.

Treat each one instead as a business risk the whole company owns, with a business case and mitigation on the risk register. Leaders have to look past the discomfort of hearing engineers raise problems, and engineers have to make the message palatable while still delivering it firmly.

## Let teams run their own war rooms

In a global company, the central security team won't always be online when an incident starts, and attackers don't wait: the median time from initial access to a hand-off to a second threat group fell from more than eight hours in 2022 to 22 seconds in 2025.[^4] You can't run a war room from a team that only comes online as your business day ends.

So train the teams who know the systems to run their own war rooms, with pre-delegated authority to fix things on the spot, keeping incident command where the system and its customers are awake. Then stay out of their way. Join only if you can offer real support, such as expertise or access the team lacks; status questions from people who can't help just slow the fix.

## Security response starts before the incident

Every fix here is a decision leaders make before something goes wrong, rather than a tool they buy afterwards. Attackers have automated their side, and I expect AI to shorten the window further. The organisations that cope will have already settled who owns the fix, who can act without asking, what security is worth against the roadmap and who may tell leaders they got it wrong.

Features grow revenue. Security preserves it. Whether anyone acts on that in time comes down to leadership.

---

## References

[^1]: The PHP Group, *Security advisory: Critical remote code execution vulnerabilities, update now*, 21 October 2026. https://www.php.net/?p=6507
[^2]: Canadian Centre for Cyber Security, *AL26-027: Critical vulnerability impacting Google Brotli (CVE-2026-111497)*, 28 October 2026. https://cyber.gc.ca/en/alerts-advisories/al26-027-critical-vulnerability-impacting-google-brotli-cve-2026-111497
[^3]: Office of the Australian Information Commissioner, *Data breach notifications increase to all-time high in 2025, new NDB stats show*, 6 July 2026. https://www.oaic.gov.au/news/media-centre/data-breach-notifications-increase-to-all-time-high-in-2025,-new-ndb-stats-show
[^4]: Google Threat Intelligence (Mandiant), *M-Trends 2026: Data, Insights, and Strategies From the Frontlines*, 23 March 2026. https://cloud.google.com/blog/topics/threat-intelligence/m-trends-2026
[^5]: IBM X-Force, *AI-powered adversaries and the enterprise risk challenge: Preparing for the new reality*, 29 July 2026. https://www.ibm.com/think/x-force/2026-cost-of-a-data-breach-ai-adversaries-enterprise-risk
[^6]: StepSecurity, *Trojanized Claude Code Extension Delivered Persistent SSH Backdoor to Developer Machines*, 30 October 2026. https://www.stepsecurity.io/blog/claude-code-extension-trojanized
[^7]: Help Net Security, *Claude Code extension poisoned with persistent SSH backdoor*, 30 October 2026. https://www.helpnetsecurity.com/2026/10/30/claude-code-extension-ssh-backdoor/
[^8]: Google Cloud DevOps Research and Assessment (DORA), *2022 Accelerate State of DevOps Report*, 2022. https://dora.dev/research/2022/dora-report/2022-dora-accelerate-state-of-devops-report.pdf
[^9]: Veracode via Business Wire, *Veracode 2026 State of Software Security Report Reveals Four Out of Five Organizations Are Drowning in Security Debt*, 24 February 2026. https://www.businesswire.com/news/home/20260224526703/en/Veracode-2026-State-of-Software-Security-Report-Reveals-Four-Out-of-Five-Organizations-Are-Drowning-in-Security-Debt
[^10]: Headquarters, Department of the Army, *TC 25-20: A Leader's Guide to After-Action Reviews*, 30 September 1993. https://nick.groenen.me/attachments/public/gitignored/TC%2025-20%20A%20Leader%27s%20Guide%20to%20After-Action%20Reviews.pdf
[^11]: Col. Todd Dyer, 47th Flying Training Wing, US Air Force Air Education and Training Command, *The Art of the Debrief*, accessed 31 October 2026. https://www.aetc.af.mil/News/Article-Display/Article/1917581/the-art-of-the-debrief/
