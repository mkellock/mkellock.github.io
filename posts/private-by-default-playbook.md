*Companion to [The Agent That Wouldn't Take No for an Answer](/writing/agent-that-wouldnt-take-no/). Last updated 26 September 2026. Views are my own, not my employer's.*

In the companion post I argued that public services should expose only public data, from a tier that can't read or write anything else, and that everything else should be private by default. This post is the practical side: the steps I'd take, a 90-day starting plan, what to measure, and how it lines up with Australia's cyber strategy.

The number of public, unmonitored platforms companies run, putting convenience ahead of security, is staggering. Jira, Slack and Google Drive all hold deeply confidential company information. Observability tools such as Grafana, Datadog and New Relic often hold client personal information in their logs, directly or indirectly, and if they're set up badly, that data can leave its required jurisdiction or the protected environment altogether.

You don't need to remove every public endpoint at once. You need to know what's exposed and who owns it, and have a steady program for moving the wrong things behind private access.

## 1. Discover

Build a continuously updated inventory of everything reachable from the internet:

- DNS records and public IP addresses
- cloud load balancers and storage endpoints
- Kubernetes ingress and API gateways
- management interfaces
- development and pre-production environments
- vendor-hosted services

Check it from the outside. Your configuration database won't show everything the internet can see, so compare external attack-surface scans with your cloud accounts, certificate-transparency records, infrastructure-as-code and network flow logs. The US Cybersecurity and Infrastructure Security Agency's (CISA) *Internet Exposure Reduction Guidance* starts from the same place.[^1]

Include pre-production. In one case researchers examined, Cloudflare blocked the agents' requests to a data provider, but they still retrieved a public file from a pre-production server.[^2] The file was public, but it's a good prompt to ask whether your own pre-production servers need to be reachable at all.

Every endpoint needs an owner, a data classification, a business purpose and a written reason for being reachable. Treat unknown and ownerless assets as defects.

Pay particular attention to legacy systems. When a company moves on from a system, its platforms and libraries often stop being maintained. Keeping the lights on (KTLO) means no new feature development, not no development or maintenance at all.

## 2. Classify

| Classification | Default treatment |
|---|---|
| Public service | Serve only released data, from an isolated tier behind a hardened edge (web application firewall, rate limiting, bot management, monitoring). No route or credentials to non-public stores, and no write access to internal systems. |
| Workforce application | Behind zero-trust network access (ZTNA), an identity-aware proxy or a narrowly scoped VPN. |
| Administrative interface | Private. Managed devices, phishing-resistant multi-factor authentication (MFA) and privileged access controls. |
| Service-to-service endpoint | Private connectivity and workload identity. Never published for convenience. |
| Software-as-a-service (SaaS) application | Identity is the perimeter: conditional access tied to managed devices, tenant restrictions, no anonymous sharing links, and IP or private-connectivity allow-lists where the vendor offers them. |

Public exposure should need a positive business decision. "It was easier to deploy" and "nobody knows the URL" aren't reasons.

## 3. Separate the planes

For each public service, trace every path from the public tier to anything else.

- **Push, don't pull.** Get public data to the public tier by pushing it out to a dedicated publishing platform or read-only store, rather than letting the public tier reach into internal systems.
- **Live queries are fine, against the right data.** If users build their own reports, run those queries against a read-only store that holds only released data, in its own plane.
- **Remove write paths.** Take them out of public tiers entirely, or confine them to isolated, scanned and quarantined storage.
- **Keep unreleased data out of reach.** Store it where the public tier can't address it at all.

## 4. Remove exposure

Move internal workloads onto private subnets or private cloud endpoints, such as AWS PrivateLink, Azure Private Link or Google Cloud Private Service Connect. Then remove public IP addresses from origins, allow inbound traffic only from approved gateways, and retire obsolete DNS records, test systems and legacy routes.

For network design and zoning in Australia, the reference is the Australian Signals Directorate's (ASD) *Guidelines for networking*, part of its Information Security Manual.[^3]

## 5. Add independent, well-maintained access

Don't make each legacy application its own perimeter.

- **For people:** ZTNA, an identity-aware proxy or a per-application VPN, enforcing user identity, device health, phishing-resistant MFA and short sessions before any connection is made.
- **For workloads:** mutually authenticated service identities, private endpoints and explicit service-to-service policies.

Keep authentication and role-based access control in the application too. The gateway decides whether a connection can be made; the application decides what the person or service can do.

Treat the gateway as the most important thing you patch. Verizon's 2026 report puts the median time to fully fix a known-exploited vulnerability at 43 days,[^4] which is far too long for the system that guards everything else. Prefer outbound-only connectors, follow ASD's edge-device guidance,[^5] and collect the gateway's own logs.

Make the private path the easy one. If it's slow or painful, people will route around it. Templated, pre-approved patterns (a "paved road") help, and the number of exception requests is a useful measure of friction.

## 6. Implement the Essential Eight

ASD's Essential Eight is the baseline:[^6] patch applications, patch operating systems, multi-factor authentication, restrict administrative privileges, application control, restrict Microsoft Office macros, user application hardening and regular backups.[^8] The maturity model runs from Maturity Level Zero to Maturity Level Three,[^7] and ASD advises reaching the same level across all eight strategies before aiming higher.[^8]

Even government is some way off. Non-corporate Commonwealth entities have been required to reach Maturity Level Two since July 2022. In ASD's 2025 survey, 22% of Commonwealth entities had reached it, counting compensating controls, and 59% said legacy technology had affected their ability to implement the Essential Eight.[^7] The Medicare portal was that kind of legacy system.

The Essential Eight is a baseline, not an architecture. It doesn't replace exposure management, segmentation, secure gateways or threat modelling, which is why ASD also maintains the much broader Information Security Manual.[^9]

## 7. Segment

Assume prevention will sometimes fail. Separate user networks, production workloads, management planes, backups, security tooling, development systems and third-party connections, with deny-by-default rules and documented flows.

Segmentation is what stops an intruder who gets in from moving sideways. ASD's guide to implementing network segmentation and segregation is a good starting point.[^10]

## 8. Monitor and detect

Detection is the gap the Medicare incident exposed. Centralise logs from gateways, identity providers, DNS, cloud control planes, web application firewalls, endpoints and applications, and alert on:

- repeated refusals followed by new approaches
- enumeration of file names or routes
- access to dormant endpoints
- unexpected writes
- attempts to reach origins directly

Watch outbound traffic as well as inbound. A compromised workload shouldn't have open internet access or open paths to its neighbours. And make sure every alert reaches someone who will act on it.

Make it easy for outsiders to reach you, too. Publish a security.txt file,[^11] keep a monitored security contact, and give it a real triage process. Services Australia's disclosure inbox was checked once a day.[^12]

## 9. Test

Run external attack-surface reviews and internal segmentation tests. Confirm that private origins can't be reached directly, that authentication can't be bypassed through alternate routes, and that development deployments don't inherit public ingress.

The Australian Cyber Security Centre's alert on AI misalignment recommends testing "controls and incident response procedures against AI-enabled threat scenarios".[^13] Include AI-assisted reconnaissance in your testing. The point is to reproduce the persistence you should now expect from automated visitors, not to dramatise AI.

## A 90-day start

Ninety days is enough for visibility and guardrails. Migrating legacy workloads will take longer.

**Days 1–30**

- Inventory internet-facing assets and assign owners.
- Remove obviously abandoned endpoints.
- Require an explicit exception for any new public deployment.
- Baseline against the Essential Eight, starting with unsupported internet-facing software and edge devices.

**Days 31–60**

- Classify exposed workloads.
- For each public service, map its paths to non-public data and remove its write paths.
- Deploy a standard private-access pattern and close direct access to origins.
- Publish private-by-default infrastructure modules for cloud networks, load balancers, Kubernetes ingress and managed databases.

**Days 61–90**

- Segment high-value environments.
- Send gateway, identity and application logs to central monitoring, with alerts for refuse-then-retry patterns.
- Test backups by actually restoring them.
- Run an external validation exercise that includes AI-assisted reconnaissance.

## What to measure

- internet-facing assets, and the trend over time
- percentage with a named owner and an approved justification
- administrative and non-public services directly exposed
- public applications with any path to non-public data, or any write path to internal systems
- percentage of workloads on the approved private-access pattern
- Essential Eight maturity by strategy and environment
- time to patch edge devices and other internet-facing systems
- time to detect refuse-then-retry and enumeration patterns
- time to detect and remove an unauthorised public endpoint
- exception requests against the private-access standard

## How this lines up with Australia's cyber strategy

The 2023–2030 Australian Cyber Security Strategy sets out the government's vision of Australia becoming a world leader in cyber security by 2030. It's built on six "cyber shields", each providing an additional layer of defence: strong businesses, communities and citizens; secure technology; world-class threat sharing and blocking; protected critical infrastructure; sovereign capabilities; and resilient region and global leadership.[^14]

Horizon 2 of the strategy runs from 2026 to the end of 2028. Its program of work was announced on 11 June 2026, a week before the Medicare incident, with 19 actions and 64 initiatives. They include strengthening logging and monitoring standards across government and critical infrastructure, and preparing both for emerging technology, including AI.[^15]

Private by default is one way to turn that into engineering practice. It builds secure technology into platform templates, concentrates internet access through gateways where threats can be seen and blocked, and keeps critical systems and management planes in their own zones. The monitoring it depends on is what Horizon 2's logging standards are meant to drive.

---

## References

[^1]: CISA, *Internet Exposure Reduction Guidance*. https://www.cisa.gov/resources-tools/resources/exposure-reduction
[^2]: BleepingComputer, *OpenAI hacked Australian Medicare govt site, probed data providers*, 24 September 2026. https://www.bleepingcomputer.com/news/security/openai-hacked-australian-medicare-govt-site-probed-data-providers/
[^3]: Australian Signals Directorate, *Guidelines for networking* (Information Security Manual). https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/ism/cyber-security-guidelines/guidelines-for-networking
[^4]: Verizon, *2026 Data Breach Investigations Report*. https://www.verizon.com/business/resources/Td15/reports/2026-dbir-data-breach-investigations-report.pdf
[^5]: Australian Signals Directorate, *Securing edge devices*. https://www.cyber.gov.au/business-government/protecting-devices-systems/hardening-systems-applications/network-hardening/securing-edge-devices
[^6]: Australian Signals Directorate, *Essential Eight*. https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight
[^7]: Australian Signals Directorate, *The Commonwealth Cyber Security Posture in 2025*, https://www.cyber.gov.au/sites/default/files/2026-02/the_commonwealth_cyber_security_posture_in_2025.pdf; and *Progress ongoing to improve the Australian Government's cyber resilience*, 12 February 2026, https://www.cyber.gov.au/about-us/view-all-content/news/progress-ongoing-to-improve-the-australian-governments-cyber-resilience
[^8]: Australian Signals Directorate, *Essential Eight maturity model*. https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-maturity-model
[^9]: Australian Signals Directorate, *Information Security Manual*. https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/ism
[^10]: Australian Signals Directorate, *Implementing network segmentation and segregation*. https://www.cyber.gov.au/business-government/protecting-devices-systems/hardening-systems-applications/network-hardening/implementing-network-segmentation-and-segregation
[^11]: IETF, *RFC 9116: A File Format to Aid in Security Vulnerability Disclosure*, 2022. https://www.rfc-editor.org/rfc/rfc9116
[^12]: SBS News, *Medicare hack alert went to inbox checked once a day and took five days to be escalated*, 24 September 2026. https://www.sbs.com.au/news/article/openai-agent-hacked-medicare-albanese-reveals/qas79d9ta
[^13]: Australian Cyber Security Centre, *Risks of AI misalignment to Australian organisations*, 24 September 2026, https://www.cyber.gov.au/about-us/view-all-content/alerts-and-advisories/risks-of-ai-misalignment-to-australian-organisations; wording as quoted by Cyber Daily, https://www.cyberdaily.au/security/14225-alert-australian-cyber-security-centre-issues-warning-over-ai-misalignment-risks
[^14]: Department of Home Affairs, *2023–2030 Australian Cyber Security Strategy*. https://www.homeaffairs.gov.au/about-us/our-portfolios/cyber-security/strategy/2023-2030-australian-cyber-security-strategy
[^15]: Department of Home Affairs, *Horizon 2: Expanding our reach (2026–2028)*. https://www.homeaffairs.gov.au/about-us/our-portfolios/cyber-security/strategy/horizon-2
