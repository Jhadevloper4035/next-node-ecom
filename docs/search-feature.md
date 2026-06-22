# Product search: frontend and backend flow

The search feature is separated into small layers. Each layer has one job, which
makes it easier to reuse and change without rewriting the whole feature.

## Request flow

```text
User types "sofa"
        |
        v
MobileMenu stores the input value
        |
        v
useProductSearch waits 250 ms (debounce)
        |
        v
GET /api/v1/product/?q=sofa&limit=6&sort=rating
        |
        v
product.controller builds the normal product filters
        |
        v
product-search.service expands, filters, and scores the search
        |
        v
JSON products are returned to the hook
        |
        v
ProductSearchSuggestions renders the recommendation list
```

## Frontend responsibilities

### `MobileMenu.jsx`

This is the UI coordinator. It owns the input value, submits a full search, closes
the mobile drawer, and navigates to a selected product. It does not know how the
API request works and it does not contain the suggestion-list markup.

### `useProductSearch.js`

This custom React hook owns the live-search behavior:

1. It trims the query.
2. It waits until at least two characters have been typed.
3. It debounces requests for 250 ms. If a user quickly types `s`, `so`, `sof`,
   and `sofa`, the application does not send a request for every keystroke.
4. It calls `getAllProducts` with the `q` parameter.
5. It ignores an old response after the query changes by using
   `isCurrentRequest` in the effect cleanup.
6. It returns `products`, `isLoading`, `hasError`, and the normalized query to
   the UI.

The hook can be reused by another header search:

```jsx
const { products, isLoading, hasError } = useProductSearch(query, {
  delay: 300,
  limit: 8,
  minimumCharacters: 2,
});
```

### `ProductSearchSuggestions.jsx`

This component only renders data. It chooses between loading, error, empty, and
product-result states. Clicking a product goes to `/product/:slug`; clicking
"View all" lets the parent navigate to the complete search-results page.

### `product.service.js` and `api.config.js`

`product.service.js` defines the frontend request to `/v1/product/`.
`api.config.js` supplies the common API base URL, cookies, and authentication
interceptors. Keeping these details outside components prevents API setup from
being duplicated in every screen.

## Backend responsibilities

### Product route and validator

The existing product route accepts query parameters such as:

```http
GET /api/v1/product/?q=two%20seater&page=1&limit=6&sort=rating
```

The validator checks that `q` is a string, the page and limit are valid numbers,
and the requested sort is supported.

### `product.controller.js`

The controller handles HTTP concerns and common product filters. When `q` is
present, it asks the search service for a MongoDB filter, fetches matching
products, asks the service for each product's relevance score, paginates the
ranked array, and sends JSON back to the frontend.

### `product-search.service.js`

The search service contains the domain rules:

1. **Normalize:** `queen-size-bed` becomes `queen size bed`.
2. **Expand:** synonyms are added, so `couch` can also match `sofa` and
   `settee`.
3. **Find categories:** category names, slugs, paths, descriptions, and SEO
   keywords are searched first so a category match can find its products.
4. **Build MongoDB filter:** regular expressions are applied to title, slug,
   description, tags, warranty, care instructions, option materials, fabrics,
   and foams.
5. **Rank:** matches are scored. A title phrase has more weight than a match in
   warranty text, and a title that starts with the query receives a bonus.

Filtering answers "which products match?" Ranking answers "which matching
product should appear first?" Those are separate ideas and are worth keeping
separate in any search implementation.

## Important production idea

This implementation is suitable for a modest catalogue. It uses MongoDB regular
expressions and ranks up to 300 matches in the Node.js process. For a very large
catalogue, keep the same frontend architecture but replace the backend search
service with MongoDB Atlas Search, Elasticsearch, Meilisearch, or Algolia. The
controller and UI can keep nearly the same contract.
