# Redis catalogue caching

The API uses a cache-aside strategy for public product and category reads.
MongoDB remains the source of truth.

## Request flow

```text
GET request
  -> build a stable key from route params and sorted query params
  -> read Redis
     -> HIT: return cached JSON without querying MongoDB
     -> MISS: query MongoDB, return JSON, and cache it with a TTL
```

Responses expose `X-Cache: HIT`, `MISS`, or `BYPASS` for verification and
monitoring.

## Cached endpoints

- Product list/search/filter requests: 60 seconds by default.
- Product detail by slug: 300 seconds.
- Product category and subcategory lists: 60 seconds.
- Category list, tree, slug, ID, and subcategory reads: 600 seconds.

Authentication, addresses, users, carts, and other user-specific responses are
not cached.

## Invalidation

Product create/update/delete increments the `products` namespace version.
Category mutations increment both `categories` and `products`, because product
responses contain populated category data and search can match categories.

Keys contain their namespace version. Incrementing a version immediately makes
all older keys unreachable without using Redis `KEYS` or running a production
`SCAN`. Old entries disappear naturally through their TTL.

## Reliability and memory

- Redis errors and operation timeouts fall back to MongoDB.
- Cache writes happen after the response and never block the user response.
- TTL jitter reduces simultaneous expiration spikes.
- Redis uses `allkeys-lru` with a 128 MB development and 256 MB production cap.
- Rate limiting and response caching share one Redis connection.

## Configuration

```env
REDIS_URL=redis://redis:6379
CACHE_ENABLED=true
CACHE_PREFIX=curve-comfort:v1
CACHE_DEFAULT_TTL_SECONDS=300
CACHE_PRODUCT_LIST_TTL_SECONDS=60
CACHE_PRODUCT_TTL_SECONDS=300
CACHE_CATEGORY_TTL_SECONDS=600
CACHE_OPERATION_TIMEOUT_MS=100
```

Set `CACHE_ENABLED=false` for an immediate cache bypass. Change
`CACHE_PREFIX` when deploying an intentionally incompatible cache format.

## Verifying locally

```bash
curl -i 'http://localhost:5000/api/v1/product/?page=1&limit=5'
curl -i 'http://localhost:5000/api/v1/product/?page=1&limit=5'
```

The first response should contain `X-Cache: MISS`; the second should contain
`X-Cache: HIT`.
