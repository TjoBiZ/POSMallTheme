# POSMall Theme - PostgreSQL eCommerce Storefront for October CMS

POSMall Theme is the companion storefront theme for the KodZero POSMall eCommerce plugin. It provides SEO-ready October CMS pages for catalog browsing, product details, service catalog, virtual products, cart, checkout, payment links, registration, customer accounts, favorites, privacy and terms pages.

- October CMS Marketplace Theme: <https://octobercms.com/theme/kodzero-posmalltheme>
- Required POSMall Plugin: <https://octobercms.com/plugin/kodzero-posmall>
- Theme source: <https://github.com/TjoBiZ/POSMallTheme>
- Plugin source: <https://github.com/TjoBiZ/POSMall>

## What The Theme Provides

- Storefront pages wired to POSMall catalog, product, service, cart and checkout components.
- Responsive product catalog, search, category and filter pages.
- Product detail pages with images, variants, properties, services and add-to-cart flow.
- Service catalog and service detail pages for paid service options.
- Virtual product and downloadable product storefront support.
- Cart, checkout, payment-link, customer login, registration and account pages.
- Favorites, orders, addresses, privacy, terms and password recovery pages.
- PageSpeed-ready CSS/JS asset structure and optimized image display.

## Installation

Install the POSMall plugin and POSMall Theme through Composer:

```bash
composer require kodzero/posmall-plugin kodzero/posmalltheme-theme -W
php artisan october:migrate
php artisan theme:use kodzero-posmalltheme --force
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

The theme is not a standalone commerce engine. The plugin owns catalog, cart, checkout, orders, payments, taxes, shipping, discounts, API and backend administration. The theme owns the customer-facing storefront.

## Demo Storefront

For a fast demo or staging storefront:

```bash
php artisan posmall:seed-wings-of-win --force
php artisan posmall:index --force
php artisan posmall:images:optimize-catalog --profile=all
php artisan cache:clear
php artisan view:clear
```

This creates realistic demo products, services, virtual products, prices, images and catalog data for screenshots, demos and evaluation stores. Do not run it on a production store with real catalog data.

## Required Plugin

Install the POSMall plugin first:

<https://octobercms.com/plugin/kodzero-posmall>

## Keywords

October CMS eCommerce theme, Laravel eCommerce storefront, PostgreSQL eCommerce theme, POSMall Theme, OctoberCMS shop theme, product catalog theme, service catalog, virtual products, cart checkout, payment links, customer account pages, PageSpeed storefront.
