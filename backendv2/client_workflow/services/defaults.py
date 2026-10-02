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
        """Proposal for {{client_name}}: {{project_title}}

The problem in your words
{{problem}}

Expected outcome
{{outcome}}

Deliverables
{{deliverables}}

Not included
{{exclusions}}

Phased timeline and dependencies
{{phases_and_client_dependencies}}

Price and proposed payment milestones
{{currency}} {{project_price}}
{{payment_milestones}}

Assumptions and decision needed
{{assumptions_and_approval}}""",
    ),
    "agreement": (
        "Services agreement draft",
        """DRAFT FOR PROFESSIONAL REVIEW. Replace every {{placeholder}} and review the terms for the parties and chosen jurisdiction before signing.

SERVICES AGREEMENT

Parties and effective date
This draft is between {{provider_legal_name}} and {{client_legal_name}}, effective {{effective_date}}.

Scope and deliverables
{{scope_and_deliverables}}

Excluded work and change requests
{{exclusions_and_written_change_process}}

Fees, invoices, and payment schedule
{{currency}} {{fees_and_payment_terms}}

Review, revisions, and acceptance
{{revision_allowance_and_acceptance_process}}

Client responsibilities and dependencies
{{access_data_approvals_and_delay_handling}}

Third-party tools and charges
{{subscriptions_and_usage_costs}}

Ownership, background materials, and licences
{{ownership_and_licence_terms}}

Confidentiality and handling of client data
{{confidentiality_and_data_handling}}

Support and external-service changes
{{support_window_and_external_dependencies}}

Liability and termination
{{liability_terms}}
{{termination_terms}}

Governing law and dispute process
{{governing_law_and_disputes}}

Signatures
{{provider_signature_and_date}}
{{client_signature_and_date}}""",
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
