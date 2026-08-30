# Buyer Discovery Module

**Status**: NOT IMPLEMENTED (Planned for M4)

## Overview
Connects sellers with relevant buyers through intelligent search, filtering, and recommendation algorithms. Enables buyer-initiated discovery of products and sellers.

## Responsibilities
- Product search and filtering
- Buyer preferences management
- Personalized recommendations
- Location-based discovery
- Search ranking (trust-based, popularity-based)
- Seller discovery and comparison
- Saved searches and watchlists
- Search analytics

## Planned API Endpoints
```
# Product Discovery
GET    /api/v1/buyers/discover             - Get personalized recommendations
GET    /api/v1/search                      - Search products and sellers
GET    /api/v1/sellers/{id}                - View seller profile (buyer)
GET    /api/v1/sellers/{id}/products       - View seller products
GET    /api/v1/products/trending           - Get trending products
GET    /api/v1/products/new                - Get new arrivals

# Preferences
GET    /api/v1/buyers/me/preferences       - Get my preferences
PUT    /api/v1/buyers/me/preferences       - Update preferences
POST   /api/v1/buyers/me/saved-searches    - Save search
GET    /api/v1/buyers/me/saved-searches    - List saved searches

# Watchlist
POST   /api/v1/buyers/me/watchlist         - Add to watchlist
GET    /api/v1/buyers/me/watchlist         - Get watchlist
DELETE /api/v1/buyers/me/watchlist/{id}    - Remove from watchlist

# Reviews & Ratings
GET    /api/v1/sellers/{id}/reviews        - Get seller reviews
GET    /api/v1/products/{id}/reviews       - Get product reviews
```

## Database
**Primary**: PostgreSQL
**Secondary**: Elasticsearch (future) - Full-text search

### Tables
- `buyer_profiles` - Buyer information
- `search_history` (future) - Track search queries
- `wishlist` (future) - Saved products
- `seller_ratings_cache` (future) - Cached seller metrics

## External Integrations
- **Search Engine** (Elasticsearch/future) - Full-text product search
- **Recommendation Engine** (future) - ML-based product recommendations
- **Analytics** - Track search behavior and conversion

## Key Features
- Full-text search across products
- Faceted filtering (category, price, rating, etc.)
- Personalized recommendations based on browsing history
- Saved searches and watchlists
- Related products and sellers
- Search suggestions and autocomplete (future)

## Future Enhancements
- Machine learning-based recommendations
- AI-powered search suggestions
- Location-aware pricing
- Seller comparison tool
- Price history and alerts
- Inventory availability notifications
- Search analytics for sellers
