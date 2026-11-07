// A small teaching vocabulary keeps emphasis consistent across the lesson prose.
// Lesson-specific labels supplement it; each paragraph emphasizes at most three
// distinct terms so the emphasis remains useful rather than becoming decoration.
const vocabulary = [
  "read-your-writes", "eventual consistency", "linearizable consistency", "linearizability",
  "cache-aside", "cache invalidation", "cache hit", "cache miss", "token bucket",
  "idempotency", "idempotent", "parameterized queries", "parameter binding",
  "authentication", "authorization", "access token", "session identifier", "CSRF", "CORS", "SSRF", "XSS",
  "PKCE", "JWT", "OAuth", "OpenID Connect", "TLS", "HTTPS", "HTTP", "REST", "API",
  "atomicity", "isolation", "durability", "transaction", "transactions", "B-tree", "index", "indexes",
  "replication", "sharding", "consistent hashing", "CAP", "PACELC", "Bloom filter",
  "circuit breaker", "compensation", "outbox", "consumer group", "backpressure",
  "binary search", "two pointers", "sliding window", "prefix sums", "recursion", "backtracking",
  "breadth-first", "depth-first", "Dijkstra", "dynamic programming", "memoization", "invariant", "invariants",
  "encapsulation", "abstraction", "polymorphism", "composition", "inheritance", "dependency inversion",
  "shallow copy", "deep copy", "immutable", "race condition", "deadlock",
  "retrieval-augmented generation", "RAG", "embeddings", "embedding", "reranking", "reranker",
  "chunking", "metadata", "provenance", "hybrid search", "lexical search", "dense retrieval",
  "reciprocal rank fusion", "recall", "context window", "context budget", "prompt injection",
  "schema", "groundedness", "abstention", "LoRA", "MCP",
  "Docker", "Kubernetes", "Terraform", "Ansible", "Prometheus", "Grafana",
  "readiness", "liveness", "rollback", "immutable artifact", "autoscaling", "least privilege",
  "password hashing", "salt", "encryption", "signature", "input validation",
];

const escapePattern = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function StudyText({ children, terms = [] }) {
  if (typeof children !== "string") return children;
  const candidates = [...new Set([...terms, ...vocabulary].filter((term) => typeof term === "string" && term.length > 2))];
  const pattern = new RegExp(`\\b(?:${candidates.sort((left, right) => right.length - left.length).map(escapePattern).join("|")})\\b`, "giu");
  const emphasized = new Set();
  const parts = [];
  let position = 0;

  for (const match of children.matchAll(pattern)) {
    const key = match[0].toLowerCase();
    if (emphasized.has(key)) continue;
    parts.push(children.slice(position, match.index));
    parts.push(<strong className="study-key-term" key={match.index}>{match[0]}</strong>);
    position = match.index + match[0].length;
    emphasized.add(key);
    if (emphasized.size === 3) break;
  }
  if (!parts.length) return children;
  parts.push(children.slice(position));
  return parts;
}
