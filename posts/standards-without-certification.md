*Last updated 8 November 2026. Views are my own, not my employer's.*

> **In short:** Standards have a reputation for being dry, expensive and mostly about passing an audit. Used well, they're a shortcut: a structure that thousands of practitioners have already argued over, which a business or a single team can borrow instead of inventing its own. You don't need a certificate to get the value, so pick the parts that match your risks, start small and get better on purpose.

The first risk register for the product I build came from a compliance platform's template. It had 18 risks, every one marked approved. When I looked properly, only 5 of the 18 were linked to a control, none of them named an approver, and every risk had the same owner, me.

That register sat inside an information security management system we'd built around ISO/IEC 27001:2022, with 28 policies and a Statement of Applicability. We've never booked an ISO audit. The structure still did most of the work, and it also showed me where the shortcuts bite. Both of those are the point of this post.

I'll admit standards are not the most exciting topic I could write about. Mention information security standards at a barbecue and watch the conversation move on. The Australian Computer Society (ACS) recently appointed me as one of its representatives to Standards Australia, and the reaction from friends has mostly been polite confusion. I sit on IT-012, Information Systems, Security and Identification Technology, the committee behind Australia's edition of the information security controls standard, AS/NZS ISO/IEC 27002:2022.[^1][^2]

The ACS describes its relationship with Standards Australia as complementary, and says the society "may actively participate in standards development activities led by Standards Australia".[^3] I put my hand up because I think standards are a lot less like rulebooks than people assume, and a lot more like a shared memory of what has worked. This post is the case I'd make to a business, or just a team, that has no plans to get certified: you can still borrow these frameworks, and you probably should.

## What a standard actually is

Standards Australia puts it plainly: "Standards are voluntary documents that set out specifications, procedures and guidelines".[^4] It also says "On their own, standards are voluntary." The catch is that governments often refer to Australian Standards in legislation, and "When this happens, these standards can become mandatory."[^4]

Most of the standards that matter for technology teams aren't written in Australia at all. Standards Australia says it "embraces the development and adoption of international standards", which is why so many local editions carry a number from the International Organization for Standardization (ISO) and the International Electrotechnical Commission (IEC) with AS (Australian Standard) or AS/NZS (joint Australian and New Zealand Standard) in front of it.[^4]

So a standard is a document a group of practitioners agreed on, usually internationally, after a lot of drafting and argument. That's the part people miss. Someone else has already done the hard thinking about what good looks like.

## Why going it alone is the expensive option

Every organisation I've worked with has had some home-grown version of security or technology governance. A risk spreadsheet someone started years ago. A change process that lives in one person's head. An access review that happens when an auditor asks.

Home-grown approaches aren't wrong, but they have three predictable problems. They reflect the experience of whoever wrote them, so they have blind spots exactly where that person did. They're hard to explain to anyone outside the team, whether that's a customer's security questionnaire, an insurer or a board. And they rarely say what "better" looks like, so improvement depends on someone caring enough to push.

A framework fixes most of that. It gives you a vocabulary that customers, auditors and new hires already know, a map of the areas you might be missing, and in the better ones, a way to describe where you are now and where you want to be. To me that last part is the most useful. Maturity is just knowing your current state, agreeing a target, and closing the gap on purpose.

## You don't need the certificate

The most common objection I hear is "we're not going for certification, so it doesn't apply to us". The standards bodies disagree. ISO's own page on ISO/IEC 27001 said companies implementing it "can decide whether they want to go through a certification process", and that "Some organizations choose to implement the standard in order to benefit from the best practice it contains".[^5] It also described the standard as relevant to "companies of any size and from all sectors of activity", applying "a risk management process that is adapted to their size and needs".[^5]

The same goes for artificial intelligence. Standards Australia notes that organisations "may adopt it for internal conformance" when describing AS ISO/IEC 42001:2023, the AI management system standard, and that certification arrangements are outside the standard's scope.[^6]

There's a caveat. ISO/IEC 27001 says that excluding any of the requirements in Clauses 4 to 10 "is not acceptable when an organization claims conformity to this document".[^7] So if you adopt part of it, you can't say you comply with it, and "ISO compliant" on a sales page is a claim a customer can hold you to.

That's fine. The goal is a better-run organisation, and you can describe what you've done accurately: "we run our risk assessment and controls in line with ISO/IEC 27001", rather than "we're ISO compliant".

## How to borrow the parts of a framework that fit

The trick is to treat a framework as a menu, not a checklist. Here's how I'd approach four of the frameworks I find most useful, with the parts I'd take first.

### ISO/IEC 27001: borrow the risk assessment and the Statement of Applicability

The engine of ISO/IEC 27001 is risk. You assess your information security risks, decide how to treat them, then check the controls you've chosen against the list in Annex A so nothing necessary has been overlooked. The result is a Statement of Applicability: the controls you need, the justification for their inclusion, whether each is in place, and a justification for any Annex A control you've left out.[^8] The standard also says the controls in Annex A "are not exhaustive", and that organisations "can design controls as required, or identify them from any source."[^8]

ISO describes Annex A as covering organisational policies, physical security, technological safeguards and more.[^9] You don't need all of it to get value. A team running a single product could do this in a spreadsheet:

- list the handful of things that would genuinely hurt if they went wrong (customer data exposed, the platform down for a day, a supplier compromised);
- for each, note the controls already in place and the ones missing;
- walk through the Annex A headings and ask "does this apply to us, and if not, why not?";
- write the answers down, give each gap an owner and a date, and revisit it every quarter.

That last step is the one that matters. The spreadsheet is the Statement of Applicability in all but name, and the quarterly review is the continual improvement the standard is built around.

Our own Statement of Applicability excludes 15 Annex A controls, nearly all of them physical security, with the same justification each time: a third-party hosting provider runs the data centres. That's the standard working as designed. You say what doesn't apply, and why, in writing.

The risk register I opened with is the other half of the lesson. The template gave us the shape of a register and none of the substance, and the policies had the same trap: approving them all in one week meant almost all of them came up for renewal in the same month a year later. Linking each risk to a real control, spreading the ownership and staggering the reviews is what turned the template into governance.

### The Essential Eight: pick a maturity level and climb it

The Australian Signals Directorate (ASD) Essential Eight is the most practical framework I know for Australian organisations, because it's specific. Its eight mitigation strategies include patching applications and operating systems, multi-factor authentication (MFA), restricting administrative privileges and regular backups.[^10] It has four maturity levels, from Maturity Level Zero to Maturity Level Three, and ASD says organisations "should plan their implementation to achieve the same maturity level across all eight mitigation strategies" before moving up.[^10]

ASD doesn't expect everyone to aim for the top. Its frequently asked questions (FAQ) page says organisations "should identify and plan for a target maturity level suitable for their environment", and suggests "Maturity Level One may be suitable for small to medium enterprises", Maturity Level Two for large enterprises and Maturity Level Three for critical infrastructure providers and organisations in high-threat environments.[^11]

The practical move is a self-assessment against Maturity Level One: fix the gaps, then look up. Be aware of the scope: the FAQ says the Essential Eight "has been designed to protect organisations' internet-connected information technology networks", so it won't cover everything in a cloud-native or operational technology environment on its own.[^11]

### ASD Essentials: the next step for larger and cloud-only organisations

The framework is also moving. On 15 October 2026 ASD launched ASD Essentials, "an evolution of Australia's widely adopted Essential Eight framework", aimed at Commonwealth entities, critical infrastructure owners and operators, and large organisations.[^12] Its first three chapters cover enterprise IT, operational technology, and cloud, the last for organisations "whose technology environment is delivered entirely through software-as-a-service (SaaS) and platform-as-a-service (PaaS)."[^12]

ASD will maintain both frameworks during the transition, and says that until regulators communicate changes, organisations "should continue to meet their current regulatory obligations."[^12] For a small or medium business, I'd still start with Essential Eight Maturity Level One. If you're larger, or entirely on cloud services, read the Essentials chapter that matches you before planning next year's work.

### NIST CSF 2.0: use the Govern function to start the board conversation

The US National Institute of Standards and Technology (NIST) released version 2.0 of its Cybersecurity Framework (CSF) on 26 February 2024.[^13] NIST pitched it at "all audiences, industry sectors and organization types", from "the smallest schools and nonprofits to the largest agencies and corporations", "regardless of their degree of cybersecurity sophistication".[^13] It's free to read, which removes the cost objection.

Version 2.0 added a sixth function, Govern, alongside Identify, Protect, Detect, Respond and Recover, with a new focus on governance that NIST says "encompasses how organizations make and carry out informed decisions on cybersecurity strategy".[^13] I think it's the most useful addition for directors and executives. It turns "is security being handled?" into concrete questions about who decides, what the risk appetite is and how suppliers are managed.

The approach I'd borrow is the current and target profile. Score yourself against the functions as you are today, decide where you want to be in twelve months, and the difference is your roadmap. A board can track that over time, which beats a single red, amber or green rating.

### ISO/IEC 42001 and the Guidance for AI Adoption: get AI governance in place early

Standards Australia adopted ISO/IEC 42001 as AS ISO/IEC 42001:2023 on 16 February 2024, and says it "can be used by any size or type of organisation that intends to make use of AI for developing or delivering its products and services."[^14] It sets requirements for "establishing, implementing, maintaining and continually improving an AI management system".[^6]

For most teams, I'd start with the Australian Government's Guidance for AI Adoption, released by the National AI Centre in October 2025.[^15] It is the first update to the Voluntary AI Safety Standard, and it condenses that standard's 10 guardrails into six essential practices.[^16] The six are: decide who is accountable, understand impacts and plan accordingly, measure and manage risks, share essential information, test and monitor, and maintain human control.[^17]

A practical first step is an AI register: every AI tool or feature in use, who owns it, what data it touches, how it's tested and where a human stays in the loop. That one list covers several of the six practices, and it's the foundation you'd need anyway if you later chose to align with ISO/IEC 42001.

The same habit works in a risk register. In the product I build, the register names the risk that the AI feature gives customers incorrect or misleading output, and links it to our change management controls. No generic template would have included that risk.

## Four objections to adopting standards, answered

**"Standards cost money."** The documents can. AS/NZS ISO/IEC 27002:2022 lists at a little under 250 dollars on Intertek Inform's Australian site.[^2] The Essential Eight, NIST CSF 2.0 and the Guidance for AI Adoption are free. The real cost is the time to keep a risk register alive and run the quarterly review, and that's time you'd spend anyway if you were designing your own control set, only without the map.

**"It turns into a box-ticking exercise."** It can, especially when the goal is passing an audit. That's an argument for adopting the parts that address your actual risks and measuring outcomes, not for ignoring the frameworks. A Statement of Applicability with honest exclusions is the opposite of box ticking.

**"Without the certificate, nobody will believe us."** Partly true. A customer's security questionnaire often asks "are you certified?", and "aligned with ISO/IEC 27001" is a claim you make about yourself. What partial adoption buys you is the evidence to answer the rest of the questionnaire well, and a short path to certification if a big customer or a regulator ever makes it a condition. What it doesn't buy you is the logo.

**"We're too small for this, we'll do it properly later."** I think small teams benefit most, because they have the least time to reinvent things, and later rarely comes. ASD suggests Maturity Level One may suit small to medium enterprises, and ISO frames 27001's risk process as adapted to an organisation's size and needs.[^11][^5] Starting with a partial adoption gives you the habits and the vocabulary now.

## Where to start on Monday

If I had to pick one action for each kind of reader, it'd be this. Directors and executives: ask management for a current and target profile against NIST CSF 2.0, and track it at each meeting. Technology leaders: run an Essential Eight Maturity Level One self-assessment, give every gap an owner, and check whether an ASD Essentials chapter fits your environment better. Teams: build a one-page Statement of Applicability for your product, and start an AI register while the list is still short.

Standards will probably never be the most exciting thing on the agenda. But they're one of the cheapest ways I know to mature an organisation, because the thinking has already been done and argued over by people who've seen more failure modes than any one of us will. My risk register had 18 of them written down before I'd checked a single one.

That's what I hope to bring to IT-012: practicality. I want organisations to see compliance as something that enables and protects a business, not something that restricts it. And I want Australia's computing sector to have a clear voice internationally when these standards are written, so the processes we all end up following get better for everyone.

---

## References

[^1]: Standards Australia and Standards New Zealand, *AS/NZS ISO/IEC 17799:2001 Information technology, Code of practice for information security management*, 2001. https://policy.federation.edu.au/forms/AS_NZS%20ISO_IEC%2017799%202001.pdf
[^2]: Intertek Inform, *AS/NZS ISO/IEC 27002:2022 Information security, cybersecurity and privacy protection - Information security controls*, accessed 8 November 2026. https://www.intertekinform.com/en-au/standards/as-nzs-iso-iec-27002-2022-130177_saig_as_as_3207807/
[^3]: Australian Computer Society, *Standards Australia Working Group*, accessed 8 November 2026. https://www.acs.org.au/governance/standards-australia-working-group/standards-australia-working-group-extended.html
[^4]: Standards Australia, *What is a Standard?*, accessed 8 November 2026. https://standards.org.au/standards-development/what-is-standard
[^5]: International Organization for Standardization, *ISO/IEC 27001 Information security management systems* (archived 31 May 2023). https://webcf.waybackmachine.org/web/20230531192221/https://www.iso.org/isoiec-27001-information-security.html
[^6]: Standards Australia, *Spotlight on: AS ISO/IEC 42001:2023, Artificial intelligence, Management system*, 5 September 2025. https://www.standards.org.au/blog/spotlight-on-as-iso-iec-42001-2023
[^7]: Standards Council of Canada, *ISO/IEC 27001:2022*, accessed 8 November 2026. https://scc-ccn.ca/standardsdb/standards/8185153
[^8]: ANSI National Accreditation Board, *ISO/IEC 27001:2013 & ISO/IEC 27001:2022 Comparison*, accessed 8 November 2026. https://blog.ansi.org/anab/iso-iec-27001-2013-2022-comparison/
[^9]: International Organization for Standardization, *ISO/IEC 27001: Information Security Management Systems*, 31 July 2025. https://help.iso.org/en/articles/376290-iso-iec-27001-information-security-management-systems
[^10]: Australian Signals Directorate, *Essential Eight maturity model* (November 2023), accessed 8 November 2026. https://cyber.gov.au/sites/default/files/2025-03/Essential%20Eight%20maturity%20model%20%28November%202023%29.pdf
[^11]: Australian Signals Directorate, *Essential Eight maturity model FAQ*, accessed 8 November 2026. https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-maturity-model-faq
[^12]: Australian Signals Directorate, *ASD Essentials: evolving our approach to cyber security resilience*, 15 October 2026. https://www.cyber.gov.au/news/asd-essentials-evolving-our-approach-to-cyber-security-resilience
[^13]: National Institute of Standards and Technology, *NIST Releases Version 2.0 of Landmark Cybersecurity Framework*, 26 February 2024. https://www.nist.gov/news-events/news/2024/02/nist-releases-version-20-landmark-cybersecurity-framework
[^14]: Standards Australia, *Standards Australia adopts the international standard for AI management system, AS ISO/IEC 42001:2023*, 16 February 2024. https://www.standards.org.au/news/standards-australia-adopts-the-international-standard-for-ai-management-system-as-iso-iec-42001-2023
[^15]: business.gov.au, *New guidance helps Australian businesses adopt AI safely and responsibly*, 23 October 2025. https://business.gov.au/news/new-guidance-helps-australian-businesses-adopt-ai-safely-and-responsibly
[^16]: Department of Industry, Science and Resources, *Guidance for AI Adoption: Foundations* (version 1.0), October 2025. https://www.industry.gov.au/sites/default/files/2025-10/guidance-for-ai-adoption-foundations.pdf
[^17]: Department of Industry, Science and Resources, *Guidance for AI Adoption: Foundations*, accessed 8 November 2026. https://www.industry.gov.au/publications/guidance-for-ai-adoption/guidance-ai-adoption-foundations
