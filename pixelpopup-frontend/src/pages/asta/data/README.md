# ASTA content data

The homepage and team page read repeatable content from the JSON files in this directory.

- Replace the three clearly marked founder placeholders in `team.json` only after approved names, roles, biographies, portraits, and links are available.
- Client names, roles, organizations, and testimonial wording in `testimonials.json` are approved for publication. Do not add ratings or verification labels without evidence.
- The project-inquiry dialog records submissions through the Django inquiries API and sends a Resend notification.
- Activity entries use the supplied local ASTA photographs. Dates remain `null` because no verified dates were provided.
- The careers form uses the same Django inquiries API and Resend notification path. It does not accept file uploads.
