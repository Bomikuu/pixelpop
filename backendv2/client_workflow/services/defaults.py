STAGES = (
    ("inquiry", "Inquiry", "Understand the request before quoting."),
    ("discovery", "Discovery", "Map the real process and define success."),
    ("recap", "Recap", "Confirm what you heard with the client."),
    ("proposal", "Proposal", "Describe outcomes, scope, timing, and price."),
    ("agreement", "Agreement and deposit", "Agree on terms before starting work."),
    ("access", "Access and kickoff", "Gather safe access and sample data."),
    ("build", "Build and review", "Deliver in the open and manage changes."),
    ("handover", "Handover", "Make the work usable without you."),
    ("support", "Support and close", "Track the agreed support period."),
)

DEFAULT_CHECKLIST = {
    "inquiry": (
        "Record the request and main contact.",
        "Identify who approves the budget and work.",
        "Book a discovery call before quoting.",
    ),
    "discovery": (
        "Walk through the current process from start to finish.",
        "Record frequency, time per run, people, and existing tools.",
        "Ask what success looks like and what happens if the automation fails.",
        "Confirm decision-maker, dependencies, and open questions.",
    ),
    "recap": (
        "Write the current problem and desired outcome in the client's words.",
        "List assumptions, risks, and unresolved questions.",
        "Send the recap and record the client's corrections or confirmation.",
    ),
    "proposal": (
        "Define outcome, deliverables, and what is excluded.",
        "Set phased timing, dependencies, price, and proposed milestones.",
        "Send the proposal and record the response.",
    ),
    "agreement": (
        "Review the agreement draft for the client and jurisdiction.",
        "Confirm revisions, new-scope process, and third-party costs.",
        "Record signature status manually.",
        "Record the initial payment status manually before kickoff.",
    ),
    "access": (
        "Request a dedicated account or collaborator role.",
        "Confirm client ownership of required subscriptions.",
        "Arrange a secure way to provide API keys without storing them here.",
        "Request realistic sample data, one contact, and one approval channel.",
    ),
    "build": (
        "Send progress updates: done, next, and blocked.",
        "Run an intermediate demo and record feedback.",
        "Document any out-of-scope request before starting it.",
        "Review and test the agreed deliverables with the client.",
    ),
    "handover": (
        "Deliver user instructions and technical documentation.",
        "Hold and record a walkthrough with client consent.",
        "Send a completion report and record final invoice status.",
        "Record the agreed support start and end dates.",
    ),
    "support": (
        "Track reported issues against the agreed support terms.",
        "Confirm ownership and access handoff is complete.",
        "Close the project when the client confirms completion.",
    ),
}

DEFAULT_TEMPLATES = {
    "discovery": (
        "Discovery questions",
        """Client: {{client_name}}
Project: {{project_title}}

1. Please walk me through how this works today, from start to finish.
2. How often does it happen, and how long does one run take?
3. Who does the work, reviews it, and approves changes?
4. Which tools, accounts, and subscriptions are involved?
5. What should improve, and how will we know the result works?
6. What happens if the new process makes a mistake?
7. Who must approve the budget and project before work begins?

Notes and open questions:
{{discovery_notes}}""",
    ),
    "recap": (
        "Discovery recap email",
        """Subject: Recap of {{project_title}}

Hi {{contact_name}},

Thank you for walking me through your process. Here is my understanding:

Current process and problem
{{current_process_and_problem}}

Desired outcome and how we will measure it
{{desired_outcome_and_measure}}

Known constraints and open questions
{{constraints_and_questions}}

Please correct anything I missed before I prepare a proposal.

Best,
{{provider_name}}""",
    ),
    "proposal": (
        "Project proposal",
        """# PROJECT PROPOSAL

**Prepared for:** {{client_name}}  
**Project:** {{project_title}}  
**Prepared by:** {{provider_name}}  
**Date:** {{proposal_date}}

---

## 1. The opportunity

Your team currently manages {{current_process}}. This creates {{current_problem}}. The proposed project will replace the repeated manual steps with a reliable, documented workflow that your team can operate after handover.

## 2. Proposed outcome

The completed solution will allow the agreed users to {{desired_outcome}}. We will consider the project successful when {{success_measure}}.

## 3. Scope and deliverables

The fixed project scope includes:

1. A kickoff session to confirm the workflow, access, and acceptance criteria.
2. Design and implementation of {{primary_deliverable}}.
3. One working review demonstration and up to {{revision_rounds}} consolidated revision rounds within the agreed scope.
4. Testing against the agreed acceptance criteria, a short user guide, and a handover walkthrough.

**Not included:** new features outside this list, ongoing content entry, third-party subscription charges, and maintenance after the support window unless separately agreed in writing.

## 4. Schedule and what we need from you

| Phase | Expected result | Target |
| --- | --- | --- |
| Discovery and kickoff | Approved scope and access | {{kickoff_date}} |
| Build and review | Working demonstration and consolidated feedback | {{review_date}} |
| Handover | Accepted deliverables and documentation | {{handover_date}} |

Please provide one decision-maker, timely feedback, relevant sample data, and client-owned access. We will confirm revised dates if a dependency is delayed.

## 5. Investment

**Project fee:** {{currency}} {{project_price}}, excluding any applicable taxes and third-party charges. Suggested payment milestones: {{payment_milestones}}. Work outside the agreed scope will be estimated and approved before it starts.

## 6. Approval and next steps

If this approach works for you, reply with your approval by {{decision_date}}. We will then finalize the services agreement, confirm the initial payment, and schedule kickoff. This proposal describes the intended work; the signed agreement will control if its terms differ.

**Client notes or requested changes:** {{client_notes}}""",
    ),
    "agreement": (
        "Services agreement",
        """# SERVICES AGREEMENT

This Services Agreement (the **“Agreement”**) is effective **{{effective_date}}** and is made between:

|  |  |
| --- | --- |
| **PROVIDER** | **{{provider_legal_name}}**, of {{provider_address}} (the “Provider”) |
| **CLIENT** | **{{client_legal_name}}**, of {{client_address}} (the “Client”) |

The Provider and the Client are each a “Party” and together the “Parties.” The Client wishes to engage the Provider for the project described below, and the Parties agree as follows.

## 1. Services and scope

The Provider will perform the services and deliver the work described in **Schedule A: Statement of Work** (the “Services”). Schedule A identifies the project outcome, deliverables, exclusions, timetable, and acceptance criteria. The Provider controls how the Services are performed, subject to the agreed deliverables, reasonable security requirements, and applicable law. Neither Party may change the scope by an informal conversation alone.

## 2. Project timing and cooperation

Work begins once this Agreement is signed, the initial payment is received, and the Client has provided the access and materials listed in Schedule A. The target handover date is **{{target_date}}**. The Client will appoint one decision-maker, provide accurate materials and necessary access, and give consolidated feedback within **five business days** of each review request. If a dependency is delayed, the Parties will document a reasonable revised schedule.

## 3. Fees, invoices, and expenses

The fixed fee for the agreed Services is **{{currency}} {{project_fee}}**, exclusive of applicable taxes. The payment schedule is:

| Milestone | Amount | Due |
| --- | ---: | --- |
| On signing, before kickoff | 40% of the project fee | On signing |
| On approved review demonstration | 30% of the project fee | On approval |
| On handover | 30% of the project fee | On handover |

The initial payment is due on signing; subsequent invoices are payable within **14 calendar days** after receipt by the method stated on the invoice. The Client pays for third-party subscriptions, hosting, transaction fees, and usage charges only if listed in Schedule A or approved in writing beforehand. The Provider will not incur another reimbursable expense without written Client approval. If an undisputed invoice remains overdue, the Provider may pause work after giving **seven days’ written notice**, and the schedule will be adjusted accordingly.

## 4. Changes and additional work

Either Party may propose a change. Before the Provider starts changed work, the Parties will approve a written change record describing the new or removed deliverables, fee impact, and timetable impact. Until that approval, the existing scope and price remain in effect. A request for a new integration, workflow, or substantial redesign is not included merely because it relates to the same project.

## 5. Review, revisions, and acceptance

The fee includes **two** consolidated revision rounds for work that remains within Schedule A. The Provider will present each deliverable for review. Within **five business days**, the Client will either accept it in writing or identify specific failures against the acceptance criteria in Schedule A. The Provider will correct confirmed failures within a reasonable period and resubmit the affected work. Silence alone does not constitute acceptance.

## 6. Client materials, access, and third parties

The Client is responsible for the accuracy of information and materials it supplies and confirms it has the right to let the Provider use them for this project. Accounts and subscriptions intended for long-term Client use should be owned by the Client. Credentials will be exchanged through an agreed secure method, not inserted into this document. Third-party products remain subject to their own terms and may change independently of the Provider.

## 7. Intellectual property

Each Party keeps ownership of material it owned or developed independently before this Agreement. Once the Provider has received all fees due for the relevant deliverable, the Provider grants the Client a perpetual, worldwide, non-exclusive licence to use, operate, and modify the specifically identified final deliverables in Schedule A for the Client’s business purposes, to the extent the Provider has the right to grant that licence. The Provider retains its pre-existing tools, reusable components, know-how, and general techniques, while granting the Client the same licence to any such material embedded in the paid deliverables so the Client can use them as intended. Open-source and third-party material remains subject to its applicable licence. **This example uses a licence, not an ownership transfer; review the ownership model and wording before signing.**

## 8. Confidentiality and data handling

Each Party will use the other Party’s non-public information only to perform or receive the Services, protect it with reasonable care, and share it only with people who need it and are bound to protect it. This duty does not apply to information that becomes public without breach, was independently developed, or was lawfully received from another source. A Party may disclose information where law requires it, after giving notice where legally permitted. The Provider will return or securely delete Client confidential information on request, except material it must retain by law or ordinary backup rotation. **If personal data is processed, add a separate data-processing agreement appropriate to the Parties and locations before access is granted.**

## 9. Warranty and support

For **30 days** after written acceptance, the Provider will correct reproducible defects that cause the delivered work to fail the acceptance criteria, at no additional service fee. This does not include new features, changes to third-party services, or problems caused by Client changes after handover. Additional support or maintenance requires a separate written agreement. The Parties should review any other warranties required by the chosen law.

## 10. Liability and termination

Neither Party is responsible for indirect or consequential loss to the extent permitted by applicable law. Subject to liabilities that cannot legally be limited, each Party’s total liability under this Agreement is limited to the fees paid or payable under this Agreement. **The cap, exclusions, and any exceptions must be reviewed for the chosen jurisdiction before signing.** Either Party may terminate for a material breach if the other Party does not remedy it within **14 days** after written notice. The Client may also terminate for convenience on **14 days’ written notice**; in that case it pays for Services performed and approved non-cancellable costs through the termination date, and the Provider refunds any unused prepaid amount within **30 days**. On termination, the Provider will deliver paid-for completed work in its then-current state and each Party will return or delete the other’s confidential information as described above.

## 11. Disputes, governing law, and notices

The Parties will first try to resolve a dispute through a good-faith meeting between authorized representatives within **14 days** after written notice. If unresolved, the dispute will be handled by **{{court_or_arbitration_and_venue}}** under the laws of **{{governing_law}}**, excluding conflict-of-law rules where permitted. Notices under this Agreement must be sent to **{{provider_notice_email}}** for the Provider and **{{client_notice_email}}** for the Client, or to a replacement address later given in writing.

## 12. General terms

The Provider acts as an independent contractor, not an employee or partner of the Client. Neither Party may assign this Agreement without the other’s written consent. If a provision is unenforceable, the remainder remains in effect to the extent permitted by law. This Agreement, including approved changes and Schedule A, is the entire agreement about these Services. Any amendment must be recorded in writing and approved by both Parties. Electronic signatures and counterparts may be used where legally valid.

## Signatures

By signing, each person confirms that they are authorized to bind the Party named below.

| Provider | Client |
| --- | --- |
| **{{provider_legal_name}}** | **{{client_legal_name}}** |
| Signature: ____________________ | Signature: ____________________ |
| Name and title: {{provider_signer}} | Name and title: {{client_signer}} |
| Date: _________________________ | Date: _________________________ |

---

## Schedule A — Statement of Work

**Project:** {{project_title}}  
**Objective:** {{project_outcome}}

### Deliverables

1. A working software workflow for {{workflow_to_automate}}, including the agreed input, processing, and output steps.
2. Configuration for the agreed deployment environment, plus a review demonstration using representative Client-provided data.
3. User instructions and a handover walkthrough.

### Exclusions and client dependencies

The Services do not include {{specific_exclusions}}. The Client will provide {{required_access_and_materials}} before kickoff.

### Acceptance criteria

The work will be assessed against these observable results: {{acceptance_criteria}}. Reviews will use the Client-provided sample data and agreed environment.

### Milestones and third-party costs

Review demonstration: {{review_date}}. Target handover: {{target_date}}. Client-owned subscriptions or estimated usage charges: {{approved_third_party_costs_or_none}}.

*Working template — replace every `{{placeholder}}`, reconcile amounts and dates, and obtain legal review for the applicable jurisdictions before signing.*""",
    ),
    "access": (
        "Access request",
        """Subject: Access needed for {{project_title}}

Hi {{contact_name}},

To begin, please arrange:
- A dedicated account or collaborator role for {{provider_name}} (not your personal login).
- Client-owned subscriptions for the tools in scope.
- Access to realistic sample records with permission to use them for testing.
- One person who can approve decisions and one project communication channel.

Please share API keys through an agreed secure method. Do not paste them in chat or in this workflow page.

We can confirm the start date once the required access is ready.

Best,
{{provider_name}}""",
    ),
    "update": (
        "Progress update",
        """Subject: {{project_title}} progress update

Completed
{{completed_work}}

Next
{{next_work}}

Waiting on you / decisions needed
{{blockers_or_none}}

Target for the next update: {{next_update_date}}""",
    ),
    "handover": (
        "Handover checklist",
        """Handover for {{project_title}}

[ ] Deliver the user guide and operating instructions.
[ ] Deliver the technical overview and integration map.
[ ] Show how to pause, troubleshoot, or request changes.
[ ] Walk through the work together and share the recording if agreed.
[ ] Confirm client-owned accounts and access roles.
[ ] Record final invoice status manually.
[ ] Confirm support terms and dates: {{support_terms_and_dates}}.
[ ] Record client acceptance or remaining questions.

Notes: {{handover_notes}}""",
    ),
}
