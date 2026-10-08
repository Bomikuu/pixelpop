# Job application AI — vendor integration

Setup guidance and new-provider prices checked October 5, 2026. This is the private Business application workflow, not automatic job submission. You only need a key for the vendor you choose.

## Common setup: local Django

1. Create an API account and key using the relevant vendor section below. Enable API billing or add credits when required.
2. Open `backendv2/.env` and add the vendor's variable. Do not overwrite your existing database or Django settings. `.env.example` contains the available variable names.
3. Restart Django so it reloads `.env`. Reload Business → Career → Application AI.
4. Select a provider tile, generation model, and optional refinement model. Set a monthly USD allowance and save. Blank disables the app limit; zero pauses new generation.
5. Confirm your profile sources. On an application, generate one section, review its estimate, then review the resulting proposal. Nothing is automatically submitted or accepted.

```dotenv
# Add only the keys you want to use. These placeholders are not real keys.
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
```

Keep keys in the backend only. Do not commit `.env`, paste keys into the UI, use frontend `VITE_` variables, or include them in screenshots/logs. An account password or chat subscription is not an API key or API credit balance.

## Common setup: Vercel production

1. Open your **pixelpopup-backend** Vercel project → Settings → Environment Variables.
2. Add the exact variable name and its secret value for **Production**. Add Preview/Development separately only if you want those environments to call that vendor.
3. Redeploy the backend; existing deployments do not pick up newly added environment variables. Deploy the updated frontend code separately to expose the new tiles/help.
4. Open Application AI on the production frontend and save your choice. Key values are never returned to the browser; only the variable name and whether a value is present.

The green configured indicator confirms a nonempty server variable, **not** a valid key, model access, credit balance or successful integration. A manual generation is the actual end-to-end check and may cost money.

## OpenAI

- Create a key in [OpenAI Platform → API keys](https://platform.openai.com/api-keys). Configure API billing separately from ChatGPT.
- Set `OPENAI_API_KEY` in Django/Vercel.
- Initial models: `gpt-6-luna` for routine drafts; `gpt-6.1-sol` for more detailed refinement.
- Endpoint: `https://api.openai.com/v1/responses` using Bearer authentication.
- The adapter sends instructions and source text with `store: false`, a strict JSON schema, and a 12,000-token output limit for fit assessments (6,000 for other artifacts). The cost quote uses the same limit, which includes reasoning tokens. Luna uses no reasoning; Sol uses low reasoning. Incomplete responses report output-limit exhaustion or content filtering explicitly; saved drafts remain intact and paid retries are never automatic.
- [Official quickstart](https://developers.openai.com/api/docs/quickstart), [Luna model](https://developers.openai.com/api/docs/models/gpt-6-luna), [Sol model](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

## Google Gemini

- Open [Google AI Studio → API keys](https://aistudio.google.com/apikey), create/select a project and create its key.
- Set `GEMINI_API_KEY`. This integration uses the Gemini Developer API, not a Vertex AI service-account credential.
- Check the project's API billing and rate limits. Free-tier model access and data-use rules differ from paid use; review the applicable terms before sending résumé/client information.
- Initial models: `gemini-3.1-flash-lite`, `gemini-3.8-flash`.
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`; the key is sent in `x-goog-api-key`.
- The adapter requests JSON, validates it on Django, and counts returned thought tokens with output when reported.
- [API key instructions](https://ai.google.dev/gemini-api/docs/api-key), [Billing](https://ai.google.dev/gemini-api/docs/billing), [Data terms](https://ai.google.dev/gemini-api/terms).

## Anthropic Claude

- Open the [Anthropic Console](https://console.anthropic.com/), create an API key and fund API access. Claude chat subscriptions are separate.
- Set `ANTHROPIC_API_KEY`.
- Initial models: `claude-haiku-4-5` for first drafts, `claude-sonnet-4-6` for refinement.
- Endpoint: `https://api.anthropic.com/v1/messages`; headers include `x-api-key` and `anthropic-version: 2023-06-01`.
- The adapter requires the `application_draft` tool containing our JSON schema. Django validates the resulting fields before storing a proposal.
- [Authentication and key creation](https://platform.claude.com/docs/en/manage-claude/authentication), [API overview](https://platform.claude.com/docs/en/api/overview).

## OpenRouter

1. Create an [OpenRouter account/API key](https://openrouter.ai/settings/keys) and add [credits](https://openrouter.ai/settings/credits). Set a suitable key-level spending limit.
2. Set `OPENROUTER_API_KEY` and restart/redeploy Django.
3. Choose OpenRouter and one of the initial supported models: `openai/gpt-6-luna` or `openai/gpt-6.1-sol`. These are OpenAI models billed through OpenRouter; this initial integration does not expose the whole OpenRouter catalogue.
4. Save settings and generate through the application's quote dialog.

The backend uses `https://openrouter.ai/api/v1/chat/completions` with Bearer authentication. Its request contains:

```python
# Excerpt from services/additional_providers.py. Values/schema come from Django.
{
    "model": model,
    "messages": [
        {"role": "system", "content": instructions},
        {"role": "user", "content": content},
    ],
    "stream": False,
    "max_completion_tokens": output_limit,  # 12,000 for assessment; 6,000 otherwise
    "reasoning": {"effort": "none" if model == "openai/gpt-6-luna" else "low"},
    "response_format": {
        "type": "json_schema",
        "json_schema": {
            "name": "application_draft", "strict": True, "schema": schema,
        },
    },
    "provider": {
        "only": ["openai"],
        "allow_fallbacks": False,
        "require_parameters": True,
        "data_collection": "deny",
        "max_price": {"prompt": float(price["input"]), "completion": float(price["output"])},
    },
}
```

We deliberately pin the provider, disable fallbacks and require schema support. If the chosen route cannot meet these constraints, generation fails rather than switching vendor or relaxing privacy. No paid search/plugin or automatic model fallback is enabled. Review OpenRouter's logging/privacy settings and the underlying provider's policy; `data_collection: deny` is not a blanket zero-retention guarantee.

Initial standard estimates per million input/output tokens: Luna $0.10/$0.50; Sol $2/$10. Credit-purchase fees and cache-write charges are not included. Returned token counts populate a **token-cost estimate**, not OpenRouter's actual deducted balance. Use reconciliation for the actual charge, including an explicit zero when appropriate.

[Quickstart](https://openrouter.ai/docs/quickstart), [Routing controls](https://openrouter.ai/docs/guides/routing/provider-selection), [Structured output](https://openrouter.ai/docs/guides/features/structured-outputs), [Fees](https://openrouter.ai/docs/faq), [Privacy](https://openrouter.ai/docs/guides/privacy/data-collection), [Luna](https://openrouter.ai/openai/gpt-6-luna), [Sol](https://openrouter.ai/openai/gpt-6.1-sol).

## DeepSeek

1. Open the [DeepSeek API platform](https://platform.deepseek.com/), create a key and top up API balance.
2. Set `DEEPSEEK_API_KEY` and restart/redeploy Django.
3. Choose `deepseek-flash` (currently V4.1 Flash) or `deepseek-v4-pro`, then save. Do not use retired model names copied from older examples.
4. Generate through the quote dialog; review the result and vendor billing.

The adapter uses the stateless `https://api.deepseek.com/responses` endpoint with Bearer authentication:

```python
# Excerpt from services/additional_providers.py.
{
    "model": model,
    "instructions": instructions,
    "input": content,
    "stream": False,
    "max_output_tokens": output_limit,  # 12,000 for assessment; 6,000 otherwise
    "reasoning": {"effort": "none"},
    "text": {"format": {
        "type": "json_schema", "name": "application_draft", "schema": schema,
    }},
}
```

Thinking is explicitly disabled for predictable document generation. Only a completed response's message/output-text blocks are used, never reasoning text. Django applies the same document/evidence validation as the existing vendors. Stateless response storage is not a guarantee about all vendor logging, retention or training; review their current policy before sending sensitive information.

The allowance and recorded token estimates use **peak uncached rates** conservatively: Flash $0.30 input/$1.20 output per million tokens; Pro $1.32/$3.96. DeepSeek also has off-peak and cache discounts, so actual charges can be lower. We do not guess holidays or reprice a saved run; reconcile it with the vendor bill. These are app estimates, not fixed-price commitments.

[First API call](https://api-docs.deepseek.com/), [Responses schema](https://api-docs.deepseek.com/api/create-response/), [Current models and peak/off-peak pricing](https://api-docs.deepseek.com/quick_start/pricing/).

## How this fits the existing application workflow

- `services/providers.py`: supported providers/models, environment-key names, fixed transport, shared draft validation.
- `services/additional_providers.py`: OpenRouter and DeepSeek request/response adapters; no SDK dependency.
- `services/pricing.py`: dated rates and vendor-specific estimate notes.
- `services/budget.py`: signed ten-minute quotes and the shared monthly allowance.
- `services/generation.py`: reservations, returned usage, revision conflicts and review proposals.
- Frontend `ApplicationAISettings.jsx` and `ProviderSetupGuide.jsx`: existing avatar tiles and inline setup help, no key-entry field.

Changing provider affects future requests only. Your original résumé, saved drafts and review history stay intact. The monthly USD allowance is shared across all five vendors and applications, not an account-wide vendor billing cap. Potentially charged failed/uncertain requests retain their reservation; do not repeatedly regenerate before reviewing usage. Source profile, résumé, posting and the existing draft when refining are sent to the selected provider only after generation confirmation.

## Troubleshooting

| Symptom | What to check |
|---|---|
| Key not configured | Exact variable name, backend project/environment, restart or redeploy; frontend variables do not configure Django. |
| HTTP 401 | Key copied correctly, not revoked, belongs to the correct vendor. |
| HTTP 402 | API credits/billing balance; a chat subscription does not cover API use. |
| HTTP 403/404 | Account model access, supported model ID and, for OpenRouter, allowed routing/data policies. |
| HTTP 429 | Vendor rate limits or billing; app generation throttle also applies. |
| Invalid/incomplete draft or timeout | Saved text is retained. Inspect AI usage and vendor billing before retrying; an uncertain charge is not assumed to be zero. |
| Quote conflict / HTTP 409 | Sources, settings, model, draft or month changed, or quote expired. Request a fresh estimate. |
| Estimate differs from invoice | Token estimates omit or simplify vendor discounts/fees. Reconcile the request with the actual charge and a note. |

## Verification status

This provider addition was reviewed in source only. No tests, builds, browser checks, live provider calls, secret configuration, database migrations or deployment were performed. Account access, routing availability, provider schema compatibility and generated quality still need a manual end-to-end check after you configure a key. No migration or dependency is added by this provider extension.
