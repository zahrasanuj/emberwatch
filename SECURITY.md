# Security Architecture & Controls

EMBERWATCH is designed adhering to defense-in-depth security principles:

## 1. Secrets Management
- All external API credentials (such as the NASA FIRMS `MAP_KEY`) are kept exclusively on the server side in backend environment variables.
- The React / Vite frontend bundle contains zero API keys, secrets, or privileged credentials.

## 2. Input Validation & Parameter Bounding
- Geographic bounding boxes are validated against strict structural constraints. Queries exceeding $30^\circ \times 30^\circ$ geographic extent are rejected to prevent server compute exhaustion.
- Date ranges and forecast day parameters are strictly bounded (e.g., $1 \le \text{days} \le 7$ for live calls, $1 \le \text{days} \le 10$ for historical chunking).
- Pydantic models strictly validate types, numeric intervals, and regex patterns on all API inputs.

## 3. Rate Limiting & Denial-of-Service Defense
- Built-in token-bucket rate limiting restricts client IPs to a maximum of 120 requests per minute.
- Standard security headers are enforced on all HTTP responses:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`

## 4. Origin & Network Controls
- Cross-Origin Resource Sharing (CORS) is configured explicitly for authorized domains.
- Data ingestion uses asynchronous rate-limit-aware backoff with connection timeouts to avoid denial-of-service against upstream NASA FIRMS or Open-Meteo endpoints.
