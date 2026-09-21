from django.db import migrations
from django.utils import timezone


ARTICLES = [
    {
        "title": "Frontend Architecture That Keeps Product Teams Moving",
        "slug": "frontend-architecture-that-keeps-teams-moving",
        "excerpt": (
            "A practical approach to frontend architecture that protects product quality "
            "without slowing down the people building it."
        ),
        "category": {
            "name": "Frontend Engineering",
            "slug": "frontend-engineering",
            "description": "Architecture, interface systems, and sustainable frontend delivery.",
            "order": 10,
        },
        "tags": [
            ("Frontend Architecture", "frontend-architecture"),
            ("Technical Leadership", "technical-leadership"),
            ("Design Systems", "design-systems"),
        ],
        "is_featured": True,
        "seo_title": "Frontend Architecture That Keeps Product Teams Moving",
        "seo_description": (
            "How clear boundaries, reusable UI foundations, and practical technical leadership "
            "help frontend teams deliver confidently."
        ),
        "content": """## Architecture should make change safer

Good frontend architecture is not measured by how many abstractions it introduces. It is measured by how confidently a team can change the product.

As products grow, frontend code absorbs pressure from every direction: new workflows, changing business rules, design revisions, analytics requirements, accessibility improvements, and backend contracts that continue to evolve. The goal is not to predict every future requirement. The goal is to create boundaries that keep those changes understandable.

## Start with responsibility, not folder names

I organize frontend systems around clear ownership:

- **UI primitives** own repeatable visual behavior and accessibility.
- **Feature components** own a user workflow or product capability.
- **Data adapters** translate API responses into stable frontend shapes.
- **Page-level composition** decides how features work together.

This separation prevents a visual component from quietly becoming responsible for API calls, permissions, validation, analytics, and business rules at the same time.

## Build a small, useful design system

A design system should solve repeated decisions, not create ceremony. I begin with the pieces that carry the most product risk: typography, spacing, buttons, form fields, feedback states, dialogs, tables, and responsive containers.

The important part is the contract. A shared component should provide sensible defaults, accessible behavior, and a controlled way to extend it. Teams move faster when they do not need to rediscover focus states, loading behavior, or mobile spacing on every screen.

## Keep state close to the problem

Not every value belongs in global state. Local interface state should stay near the component that uses it. Server state should have clear loading, success, empty, and failure behavior. Shared workflow state should become global only when multiple parts of the application genuinely coordinate around it.

That discipline makes code easier to trace and reduces accidental coupling.

## Leadership means improving the path for the next change

Technical leadership is not only choosing tools or reviewing pull requests. It is making the system easier for other people to understand. That means documenting the decisions that matter, removing unnecessary complexity, and giving teammates patterns they can use without waiting for permission.

The best architecture is rarely the most impressive diagram. It is the one that lets a team ship the next important change with clarity, confidence, and fewer surprises.
""",
    },
    {
        "title": "Technical SEO Is Product Engineering, Not a Marketing Checklist",
        "slug": "technical-seo-is-product-engineering",
        "excerpt": (
            "Search visibility improves when discoverability, performance, content structure, "
            "and measurement are treated as product requirements."
        ),
        "category": {
            "name": "Performance and SEO",
            "slug": "performance-and-seo",
            "description": "Technical SEO, Core Web Vitals, discoverability, and measurable growth.",
            "order": 20,
        },
        "tags": [
            ("Technical SEO", "technical-seo"),
            ("Web Performance", "web-performance"),
            ("Product Growth", "product-growth"),
        ],
        "is_featured": False,
        "seo_title": "Technical SEO as Product Engineering",
        "seo_description": (
            "Why search visibility depends on frontend architecture, performance, structured "
            "content, and reliable product measurement."
        ),
        "content": """## Search performance begins inside the product

Technical SEO is often discussed as a list of tags to add before launch. In practice, durable search growth depends on product engineering decisions made much earlier.

Can search engines discover every important page? Does each page communicate a clear purpose? Is the experience fast and stable on a real mobile connection? Can the team measure which landing pages create meaningful product activity rather than empty traffic?

Those are engineering and product questions.

## Make important content discoverable by default

Critical content should not depend on a user interaction before it exists. Clear routes, crawlable links, useful page titles, canonical URLs, structured headings, and server-rendered or pre-rendered content give search systems a reliable map of the product.

This also improves accessibility and usability. A site that is easy for a crawler to understand is often easier for a person using a keyboard, screen reader, or slow connection to navigate.

## Performance is part of relevance

Core Web Vitals should not be treated as a score-chasing exercise. They represent real experience problems:

- slow primary content delays understanding;
- unstable layouts cause mistaken interactions;
- sluggish responses make a product feel unreliable.

The most effective improvements usually come from reducing unnecessary JavaScript, loading the right image size, reserving layout space, caching stable responses, and keeping third-party scripts under control.

## Build scalable page structures

For products with many locations, services, categories, or listings, templates need enough structure for consistency and enough flexibility for useful content. Shared metadata, schema, navigation, and performance behavior belong in the system. Unique descriptions and business details belong in the content.

This prevents thousands of pages from becoming thousands of one-off implementations.

## Measure outcomes beyond rankings

Rankings and impressions are useful signals, but they are not the final outcome. I connect search work to product behavior such as qualified visits, completed bookings, sign-ups, or other meaningful actions.

Tools like Search Console, analytics platforms, performance monitoring, and behavioral tools such as Hotjar answer different questions. Together they show whether people can find the product, understand it, and complete the task they came to do.

Technical SEO works best when it is part of the delivery process: designed into the information architecture, protected by the frontend foundation, measured after launch, and improved with the rest of the product.
""",
    },
    {
        "title": "AI-Assisted Development Without Giving Up Engineering Judgment",
        "slug": "ai-assisted-development-with-engineering-judgment",
        "excerpt": (
            "How I use AI to accelerate research, implementation, and review while keeping "
            "architecture, security, and product decisions accountable."
        ),
        "category": {
            "name": "AI and Delivery",
            "slug": "ai-and-delivery",
            "description": "Practical AI integration, workflow automation, and responsible delivery.",
            "order": 30,
        },
        "tags": [
            ("AI-Assisted Development", "ai-assisted-development"),
            ("Workflow Automation", "workflow-automation"),
            ("Engineering Quality", "engineering-quality"),
        ],
        "is_featured": False,
        "seo_title": "AI-Assisted Development With Engineering Judgment",
        "seo_description": (
            "A practical framework for using AI in software delivery without outsourcing "
            "architecture, validation, security, or accountability."
        ),
        "content": """## AI is useful when the responsibility stays human

AI can shorten the distance between an idea and a working implementation. It can summarize unfamiliar code, propose test cases, draft repetitive transformations, compare approaches, and help a team explore a problem before committing to a solution.

It cannot own the consequences of a technical decision. The engineer still needs to understand the product, protect user data, choose appropriate boundaries, and verify that the result behaves correctly.

## Use AI where feedback is fast

The best AI-assisted tasks have clear constraints and inexpensive verification. Examples include:

- drafting a focused component from an existing design system;
- generating a first pass of mapping code between known API shapes;
- identifying edge cases for validation or error handling;
- explaining an unfamiliar library before reading its primary documentation;
- producing migration or test scaffolding that an engineer reviews immediately.

The slower and more consequential the feedback loop, the more deliberate the review should be.

## Give the tool the same context a teammate would need

Useful output depends on useful context. I provide the existing architecture, the affected files, interface contracts, design rules, expected states, and explicit boundaries around what must not change.

This does two things: it improves the implementation and makes incorrect assumptions easier to detect.

## Separate generation from acceptance

Generated code is a proposal. Acceptance still requires engineering work:

1. Read the change and understand its control flow.
2. Verify data boundaries and error handling.
3. Check accessibility and responsive behavior for user-facing work.
4. Run the smallest meaningful tests.
5. Review the final diff for unrelated changes.

AI should reduce repetitive effort, not reduce the standard of evidence.

## Automation should remove friction, not judgment

Beyond code generation, AI can help automate business workflows: classifying requests, extracting structured data, preparing drafts, routing work, and surfacing anomalies. The safest implementations keep clear approval points, audit trails, fallback behavior, and a way for people to correct the system.

The real advantage is not producing more code. It is creating more space for product thinking, careful engineering, and communication. Used with discipline, AI becomes a strong delivery tool while judgment remains exactly where it belongs.
""",
    },
]


def create_mico_articles(apps, schema_editor):
    ProfessionalProfile = apps.get_model("pixelpopup", "ProfessionalProfile")
    ArticleCategory = apps.get_model("pixelpopup", "ArticleCategory")
    ArticleTag = apps.get_model("pixelpopup", "ArticleTag")
    Article = apps.get_model("pixelpopup", "Article")

    profile = ProfessionalProfile.objects.get(slug="mico-ang")
    published_at = timezone.now()

    for article_data in ARTICLES:
        category_data = article_data["category"]
        category, _ = ArticleCategory.objects.get_or_create(
            slug=category_data["slug"],
            defaults={
                "name": category_data["name"],
                "description": category_data["description"],
                "order": category_data["order"],
            },
        )

        tag_objects = []
        for tag_name, tag_slug in article_data["tags"]:
            tag, _ = ArticleTag.objects.get_or_create(
                slug=tag_slug,
                defaults={"name": tag_name},
            )
            tag_objects.append(tag)

        article, _ = Article.objects.get_or_create(
            slug=article_data["slug"],
            defaults={
                "title": article_data["title"],
                "excerpt": article_data["excerpt"],
                "content": article_data["content"],
                "content_format": "markdown",
                "category": category,
                "author_profile": profile,
                "seo_title": article_data["seo_title"],
                "seo_description": article_data["seo_description"],
                "status": "published",
                "is_featured": article_data["is_featured"],
                "published_at": published_at,
            },
        )
        article.tags.add(*tag_objects)


def remove_mico_articles(apps, schema_editor):
    Article = apps.get_model("pixelpopup", "Article")
    Article.objects.filter(slug__in=[article["slug"] for article in ARTICLES]).delete()


class Migration(migrations.Migration):
    dependencies = [("pixelpopup", "0003_article_author_profile")]

    operations = [
        migrations.RunPython(create_mico_articles, remove_mico_articles),
    ]
