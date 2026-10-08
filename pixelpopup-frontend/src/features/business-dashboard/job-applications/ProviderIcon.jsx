import openai from "./assets/openai.svg";
import gemini from "./assets/gemini-color.svg";
import anthropic from "./assets/claude-color.svg";
import openrouter from "./assets/openrouter.svg";
import deepseek from "./assets/deepseek-color.svg";

const logos = { openai, gemini, anthropic, openrouter, deepseek };

export default function ProviderIcon({ provider, size = 28, className = "" }) {
  const src = logos[provider];
  if (!src) return null;
  return <img src={src} alt="" aria-hidden="true" width={size} height={size} className={`shrink-0 object-contain ${className}`}/>;
}

function OpenAIIcon(props) { return <ProviderIcon provider="openai" {...props}/>; }
function GeminiIcon(props) { return <ProviderIcon provider="gemini" {...props}/>; }
function ClaudeIcon(props) { return <ProviderIcon provider="anthropic" {...props}/>; }
function OpenRouterIcon(props) { return <ProviderIcon provider="openrouter" {...props}/>; }
function DeepSeekIcon(props) { return <ProviderIcon provider="deepseek" {...props}/>; }

// ChoiceTiles accepts component references so its shared layout stays unchanged.
// eslint-disable-next-line react-refresh/only-export-components
export const providerIcons = { openai: OpenAIIcon, gemini: GeminiIcon, anthropic: ClaudeIcon, openrouter: OpenRouterIcon, deepseek: DeepSeekIcon };
