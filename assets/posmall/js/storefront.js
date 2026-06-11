(function () {
    'use strict';

    window.POSMallBus = window.POSMallBus || {
        publish: function (name, detail) {
            document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
        },
        subscribe: function (name, callback) {
            document.addEventListener(name, function (event) {
                callback(event, event.detail || {});
            });
        }
    };

    window.POSMallAuthRedirect = window.POSMallAuthRedirect || function (data, form) {
        var redirect = data && (data.X_OCTOBER_REDIRECT || data.X_WINTER_REDIRECT);

        if (redirect) {
            window.location.assign(redirect);
            return;
        }

        window.setTimeout(function () {
            if (window.location.pathname === '/posmall/login' && form && document.body.contains(form)) {
                window.location.assign('/posmall/account');
            }
        }, 150);
    };

    window.POSMallProductAdded = window.POSMallProductAdded || function (data) {
        if (!data || !data.added) {
            return;
        }

        if (window.POSMallBus && typeof window.POSMallBus.publish === 'function') {
            window.POSMallBus.publish('posmall.cart.productAdded', data);
        }

        if (typeof data.new_items_quantity !== 'undefined') {
            var count = parseInt(data.new_items_quantity, 10) || 0;
            document.querySelectorAll('[data-posmall-cart-count]').forEach(function (badge) {
                badge.textContent = count;
                badge.classList.toggle('d-none', count < 1);
            });
        }
    };

    window.POSMallFavoriteAdded = window.POSMallFavoriteAdded || function (data) {
        if (window.POSMallBus && typeof window.POSMallBus.publish === 'function') {
            window.POSMallBus.publish('posmall.favoriteList.productAdded', data || {});
        }

        if (!data || typeof data.favorite_items_quantity === 'undefined') {
            return;
        }

        var count = parseInt(data.favorite_items_quantity, 10) || 0;

        document.querySelectorAll('[data-posmall-favorites-count]').forEach(function (badge) {
            badge.textContent = count;
            setCountVisibility(badge, count);
        });

        document.querySelectorAll('[data-posmall-favorites-link]').forEach(function (link) {
            link.classList.toggle('d-none', count < 1);
            link.classList.toggle('d-inline-flex', count > 0);
        });
    };

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
            return;
        }

        callback();
    }

    function request(sourceElement, handler, options) {
        if (!window.oc || typeof window.oc.request !== 'function') {
            console.error('October AJAX function oc.request is not available.');
            return null;
        }

        return window.oc.request(sourceElement || document.body, handler, options || {});
    }

    function componentHandler(alias, handlerName) {
        return handlerName.indexOf('::') !== -1 ? handlerName : alias + '::' + handlerName;
    }

    function publish(eventName, payload) {
        if (window.POSMallBus && typeof window.POSMallBus.publish === 'function') {
            window.POSMallBus.publish(eventName, payload || {});
            return;
        }

        document.dispatchEvent(new CustomEvent(eventName, { detail: payload || {} }));
    }

    function subscribe(eventName, callback) {
        if (window.POSMallBus && typeof window.POSMallBus.subscribe === 'function') {
            window.POSMallBus.subscribe(eventName, callback);
            return;
        }

        document.addEventListener(eventName, function (event) {
            callback(event.detail || {});
        });
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[character];
        });
    }

    function switchProductGalleryThumb(thumb) {
        var gallery = thumb ? thumb.closest('[data-mall-gallery]') : null;
        var main = gallery ? gallery.querySelector('[data-mall-gallery-main]') : null;

        if (!gallery || !main) {
            return false;
        }

        gallery.querySelectorAll('[data-mall-gallery-thumb]').forEach(function (button) {
            button.classList.remove('border-primary', 'border-2');
        });

        thumb.classList.add('border-primary', 'border-2');

        if (thumb.dataset.mediaType === 'youtube') {
            var iframe = document.createElement('iframe');

            iframe.className = 'mall-product__gallery-main-frame';
            iframe.src = thumb.dataset.videoSrc || '';
            iframe.title = thumb.dataset.title || '';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.setAttribute('data-mall-gallery-main-frame', '');

            main.innerHTML = '';
            main.appendChild(iframe);
            return true;
        }

        var link = document.createElement('a');
        var image = document.createElement('img');
        var picture = null;
        var source = null;

        link.className = 'mall-product__gallery-main-link d-block ratio ratio-1x1 rounded overflow-hidden bg-body-tertiary border';
        link.href = thumb.dataset.fullSrc || '#';
        link.setAttribute('data-mall-gallery-main-link', '');

        image.src = thumb.dataset.previewSrc || '';
        image.className = 'mall-product__gallery-main-image w-100 h-100 object-fit-contain';
        image.alt = thumb.dataset.title || '';
        image.setAttribute('data-mall-gallery-main-image', '');

        if (thumb.dataset.previewWebp) {
            picture = document.createElement('picture');
            source = document.createElement('source');
            source.srcset = thumb.dataset.previewWebp;
            source.type = 'image/webp';
            picture.appendChild(source);
            picture.appendChild(image);
            link.appendChild(picture);
        } else {
            link.appendChild(image);
        }

        main.innerHTML = '';
        main.appendChild(link);

        return true;
    }

    document.addEventListener('click', function (event) {
        var thumb = event.target.closest('[data-mall-gallery-thumb]');

        if (!thumb) {
            return;
        }

        if (switchProductGalleryThumb(thumb)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    function initProductGallery() {
        document.querySelectorAll('[data-mall-gallery-thumb]').forEach(function (thumb) {
            if (thumb.dataset.mallGalleryReady === '1') {
                return;
            }

            thumb.dataset.mallGalleryReady = '1';
            thumb.addEventListener('click', function (event) {
                if (switchProductGalleryThumb(thumb)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
        });
    }

    function setCountVisibility(element, count) {
        if (element) {
            element.classList.toggle('d-none', count < 1);
        }
    }

    function closeMobileMenu() {
        document.body.classList.remove('posmall-mobile-menu-open');

        document.querySelectorAll('[data-posmall-menu-toggle]').forEach(function (button) {
            button.setAttribute('aria-expanded', 'false');
        });
    }

    function toggleMobileMenu() {
        var isOpen = document.body.classList.toggle('posmall-mobile-menu-open');

        document.querySelectorAll('[data-posmall-menu-toggle]').forEach(function (button) {
            button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    function initMobileMenu() {
        document.body.addEventListener('click', function (event) {
            if (event.target.closest('[data-posmall-menu-toggle]')) {
                event.preventDefault();
                toggleMobileMenu();
                return;
            }

            if (event.target.closest('[data-posmall-menu-overlay]')) {
                closeMobileMenu();
                return;
            }

            if (event.target.closest('[data-posmall-mobile-menu] a')) {
                closeMobileMenu();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeMobileMenu();
            }
        });
    }

    function updateFloatingActionState() {
        document.body.classList.toggle('posmall-floating-actions-scrolled', window.scrollY > 6);
    }

    function initFloatingActions() {
        updateFloatingActionState();

        window.addEventListener('scroll', updateFloatingActionState, { passive: true });
        window.addEventListener('resize', updateFloatingActionState);
    }

    function updateCartCount(data) {
        if (!data || typeof data.new_items_quantity === 'undefined') {
            return;
        }

        var count = parseInt(data.new_items_quantity, 10) || 0;

        document.querySelectorAll('[data-posmall-cart-count]').forEach(function (badge) {
            badge.textContent = count;
            setCountVisibility(badge, count);
        });
    }

    function updateFavoritesCount(data) {
        if (!data || typeof data.favorite_items_quantity === 'undefined') {
            return;
        }

        var count = parseInt(data.favorite_items_quantity, 10) || 0;

        document.querySelectorAll('[data-posmall-favorites-count]').forEach(function (badge) {
            badge.textContent = count;
            setCountVisibility(badge, count);
        });

        document.querySelectorAll('[data-posmall-favorites-link]').forEach(function (link) {
            link.classList.toggle('d-none', count < 1);
            link.classList.toggle('d-inline-flex', count > 0);
        });
    }

    function initHeaderCounts() {
        subscribe('posmall.cart.productAdded', updateCartCount);
        subscribe('posmall.cart.update', updateCartCount);
        subscribe('posmall.favoriteList.productAdded', updateFavoritesCount);
        subscribe('posmall.favoriteList.productRemoved', updateFavoritesCount);
    }

    function initMallModal() {
        window.Mall = window.Mall || {};

        var modal = document.querySelector('.mall-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'mall-modal';
            document.body.appendChild(modal);
        }

        if (!window.Mall.Modal || !window.Mall.Modal.element) {
            window.Mall.Modal = {
                element: modal,
                addClass: function (className) {
                    modal.classList.add(className);
                    return this;
                },
                removeClass: function (className) {
                    modal.classList.remove(className);
                    return this;
                },
                prependTo: function (target) {
                    var parent = typeof target === 'string' ? document.querySelector(target) : target;
                    if (parent) {
                        parent.prepend(modal);
                    }
                    return this;
                }
            };
        }

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                window.Mall.Modal.removeClass('mall-modal--visible');
            }
        });
    }

    function selectedPropertyValues() {
        return Array.from(document.querySelectorAll('[data-mall-property]')).map(function (element) {
            return element.value;
        });
    }

    function customFieldValues() {
        var props = {};

        document.querySelectorAll('[data-mall-custom-field]').forEach(function (element) {
            if (element.type === 'checkbox' && !element.checked) {
                return;
            }

            if (element.dataset.id) {
                props[element.dataset.id] = element.value;
            }
        });

        return props;
    }

    function productRoot() {
        return document.querySelector('[data-posmall-product]');
    }

    function productAlias() {
        var root = productRoot();
        return root ? root.dataset.componentAlias : '';
    }

    function showCheckingStockState(root) {
        var addToCartContainer = root.querySelector('.mall-product__add-to-cart');

        if (!addToCartContainer) {
            return;
        }

        addToCartContainer.innerHTML =
            '<div class="mall-product__property-stock mall-product__property-stock--checking">' +
            (root.dataset.stockCheckingText || 'Checking stock') +
            '</div>';
    }

    function requestPropertyChange(isInitial) {
        var root = productRoot();
        var alias = productAlias();

        if (!root || !alias) {
            return null;
        }

        showCheckingStockState(root);

        return request(document.getElementById('mall-add-to-cart') || root, componentHandler(alias, 'onChangeProperty'), {
            data: {
                values: selectedPropertyValues(),
                props: customFieldValues(),
                initial: Boolean(isInitial)
            },
            success: handleProductPartialSuccess,
            loading: isInitial ? null : (window.oc ? window.oc.stripeLoadIndicator : null)
        });
    }

    function requestStockCheck() {
        var root = productRoot();
        var alias = productAlias();

        if (!root || !alias) {
            return null;
        }

        return request(document.getElementById('mall-add-to-cart') || root, componentHandler(alias, 'onCheckProductStock'), {
            data: { slug: root.dataset.itemSlug || '' },
            success: handleProductPartialSuccess,
            loading: null
        });
    }

    function requestConfigurationChange() {
        var alias = productAlias();
        var form = document.getElementById('mall-add-to-cart');

        if (!alias) {
            return null;
        }

        return request(form || productRoot(), componentHandler(alias, 'onChangeConfiguration'), {
            form: form || undefined,
            success: handleProductPartialSuccess,
            loading: window.oc ? window.oc.stripeLoadIndicator : null
        });
    }

    function handleProductPartialSuccess(data) {
        if (typeof this.success === 'function') {
            this.success(data);
        }

        window.setTimeout(initProductGallery, 0);
    }

    function submitProductAddToCart(form) {
        var alias = form ? (form.dataset.componentAlias || productAlias()) : '';

        if (!form || !alias) {
            return;
        }

            request(form, componentHandler(alias, 'onAddToCart'), {
                form: form,
                flash: true,
                success: function (data) {
                    window.POSMallProductAdded(data);

                    if (typeof this.success === 'function') {
                        this.success(data);
                    }
                }
            });
    }

    function initProduct() {
        var root = productRoot();

        if (!root || root.dataset.posmallProductReady === '1') {
            return;
        }

        root.dataset.posmallProductReady = '1';
        initProductGallery();

        if (document.querySelector('.js-mall-property-selector')) {
            requestPropertyChange(true);
        } else {
            requestStockCheck();
        }
    }

    function initProductEvents() {
        document.body.addEventListener('submit', function (event) {
            var form = event.target.closest('#mall-add-to-cart');

            if (!form || event.defaultPrevented) {
                return;
            }

            var alias = form.dataset.componentAlias || productAlias();

            if (!alias) {
                return;
            }

            event.preventDefault();
            submitProductAddToCart(form);
        });

        document.body.addEventListener('change', function (event) {
            if (event.target.closest('.js-mall-property-selector')) {
                requestPropertyChange(false);
                return;
            }

            if (event.target.closest('[data-mall-custom-field]')) {
                if (event.target.closest('[data-posmall-priced-custom-field]')) {
                    return;
                }

                requestConfigurationChange();
            }
        });

        document.body.addEventListener('click', function (event) {
            var addToCartButton = event.target.closest('.mall-add-to-cart-button');

            if (addToCartButton) {
                var addToCartForm = addToCartButton.closest('#mall-add-to-cart');

                if (addToCartForm) {
                    event.preventDefault();
                    submitProductAddToCart(addToCartForm);
                    return;
                }
            }

            var option = event.target.closest('.mall-option-selector');

            if (option) {
                event.preventDefault();

                var target = option.dataset.target ? document.querySelector(option.dataset.target) : null;

                if (target) {
                    target.value = option.dataset.value || '';
                    target.dataset.price = option.dataset.price || '0';
                    target.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (option.parentElement) {
                    option.parentElement.querySelectorAll('.is-active').forEach(function (activeOption) {
                        activeOption.classList.remove('is-active');
                    });
                }

                option.classList.add('is-active');
                return;
            }

            var thumb = event.target.closest('[data-mall-gallery-thumb]');

            if (thumb && switchProductGalleryThumb(thumb)) {
                event.preventDefault();
                return;
            }
        });
    }

    function cartContainer(element) {
        return element ? element.closest('[data-posmall-cart]') : document.querySelector('[data-posmall-cart]');
    }

    function cartAlias(element) {
        var container = cartContainer(element);
        return container ? container.dataset.componentAlias : '';
    }

    function initCartEvents() {
        subscribe('posmall.discount.applied', function () {
            var alias = cartAlias();
            if (alias) {
                request(document.body, componentHandler(alias, 'onRun'), {
                    update: buildUpdate(alias, 'cart', '.mall-cart')
                });
            }
        });
        subscribe('posmall.shipping.update', function () {
            var alias = cartAlias();
            if (alias) {
                request(document.body, componentHandler(alias, 'onRun'), {
                    update: buildUpdate(alias, 'cart', '.mall-cart')
                });
            }
        });
        subscribe('posmall.address.update', function () {
            var alias = cartAlias();
            if (alias) {
                request(document.body, componentHandler(alias, 'onRun'), {
                    update: buildUpdate(alias, 'cart', '.mall-cart')
                });
            }
        });

        document.body.addEventListener('change', function (event) {
            var quantitySelect = event.target.closest('.js-mall-quantity');

            if (!quantitySelect) {
                return;
            }

            var alias = cartAlias(quantitySelect);
            if (!alias) {
                return;
            }

            request(quantitySelect, componentHandler(alias, 'onUpdateQuantity'), {
                data: {
                    id: quantitySelect.dataset.id,
                    quantity: quantitySelect.value
                },
                update: buildUpdate(alias, 'cart', '.mall-cart'),
                loading: window.oc ? window.oc.stripeLoadIndicator : null,
                flash: true,
                success: function (data) {
                    if (typeof this.success === 'function') {
                        this.success(data);
                    }
                    publish('posmall.cart.update', data);
                }
            });
        });

        document.body.addEventListener('click', function (event) {
            var removeButton = event.target.closest('[data-posmall-cart-remove]');
            var discountButton = event.target.closest('[data-posmall-cart-remove-discount]');

            if (!removeButton && !discountButton) {
                return;
            }

            var button = removeButton || discountButton;
            var alias = cartAlias(button);
            var handler = removeButton ? 'onRemoveProduct' : 'onRemoveDiscountCode';

            if (!alias) {
                return;
            }

            event.preventDefault();

            request(button, componentHandler(alias, handler), {
                data: { id: button.dataset.id },
                update: buildUpdate(alias, 'cart', '.mall-cart'),
                loading: window.oc ? window.oc.stripeLoadIndicator : null,
                confirm: button.dataset.confirmMessage || '',
                success: function (data) {
                    if (typeof this.success === 'function') {
                        this.success(data);
                    }
                    publish('posmall.cart.update', data);
                    if (removeButton) {
                        publish('posmall.cart.productRemoved', data);
                    }
                }
            });
        });
    }

    function buildUpdate(alias, partial, target) {
        var update = {};
        update[alias + '::' + partial] = target;
        return update;
    }

    function closeFavoritesPopups(except) {
        document.querySelectorAll('.mall-wishlist-button__popup--visible').forEach(function (popup) {
            if (popup !== except) {
                popup.classList.remove('mall-wishlist-button__popup--visible');
            }
        });
    }

    function initFavoritesEvents() {
        document.body.addEventListener('click', function (event) {
            var button = event.target.closest('.mall-add-to-wishlist-button');
            var accountListItem = event.target.closest('.mall-wishlists .mall-wishlist-item');

            if (accountListItem && accountListItem.closest('.mall-wishlists-manager')) {
                accountListItem.closest('.mall-wishlists').querySelectorAll('.mall-wishlist-item--active, .active').forEach(function (item) {
                    item.classList.remove('mall-wishlist-item--active', 'active');
                });
                accountListItem.classList.add('mall-wishlist-item--active', 'active');
            }

            if (button) {
                event.preventDefault();
                var root = button.closest('.mall-wishlist-button');
                var popup = root ? root.querySelector('.mall-wishlist-button__popup') : null;
                if (popup) {
                    var willOpen = !popup.classList.contains('mall-wishlist-button__popup--visible');
                    closeFavoritesPopups(popup);
                    popup.classList.toggle('mall-wishlist-button__popup--visible', willOpen);
                }
                return;
            }

            if (!event.target.closest('.mall-wishlist-button__popup') && !event.target.closest('.mall-add-to-wishlist-button')) {
                closeFavoritesPopups();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeFavoritesPopups();
            }
        });

        document.body.addEventListener('keypress', function (event) {
            var input = event.target.closest('.mall-wishlist-button__name-input');

            if (!input || (event.key !== 'Enter' && event.keyCode !== 13)) {
                return;
            }

            event.preventDefault();

            if (input.dataset.requestRunning === '1') {
                return;
            }

            var root = input.closest('[data-posmall-wishlist-create]');
            if (!root) {
                return;
            }

            input.dataset.requestRunning = '1';

            request(input, root.dataset.handler, {
                data: {
                    name: input.value,
                    product_id: root.dataset.productId,
                    variant_id: root.dataset.variantId
                },
                success: function (data) {
                    if (typeof this.success === 'function') {
                        this.success(data);
                    }
                    input.value = '';
                },
                complete: function (data, textStatus, xhr) {
                    if (typeof this.complete === 'function') {
                        this.complete(data, textStatus, xhr);
                    }
                    input.dataset.requestRunning = '0';
                }
            });
        });

        document.body.addEventListener('focusin', function (event) {
            var input = event.target.closest('.mall-wishlist-button__name-input');
            var root = input ? input.closest('[data-posmall-wishlist-create]') : null;

            if (!input || !root) {
                return;
            }

            var label = root.querySelector('.mall-wishlist-button__new-label');
            if (label) {
                label.style.display = 'none';
            }
            input.placeholder = root.dataset.placeholder || '';
        });

        document.body.addEventListener('focusout', function (event) {
            var input = event.target.closest('.mall-wishlist-button__name-input');
            var root = input ? input.closest('[data-posmall-wishlist-create]') : null;

            if (!input || !root || input.value !== '') {
                return;
            }

            var label = root.querySelector('.mall-wishlist-button__new-label');
            if (label) {
                label.style.display = '';
            }
            input.placeholder = '';
        });

        document.body.addEventListener('change', function (event) {
            var quantitySelect = event.target.closest('[data-posmall-favorites-quantity]');
            var root = quantitySelect ? quantitySelect.closest('[data-posmall-wishlists-content]') : null;

            if (!quantitySelect || !root) {
                return;
            }

            request(quantitySelect, root.dataset.updateQuantityHandler, {
                data: {
                    item_id: quantitySelect.dataset.id,
                    id: quantitySelect.dataset.listId || root.dataset.currentId,
                    quantity: quantitySelect.value
                },
                loading: window.oc ? window.oc.stripeLoadIndicator : null
            });
        });

        document.body.addEventListener('click', function (event) {
            var removeButton = event.target.closest('[data-posmall-favorites-remove]');
            var root = removeButton ? removeButton.closest('[data-posmall-wishlists-content]') : null;

            if (!removeButton || !root) {
                return;
            }

            event.preventDefault();

            request(removeButton, root.dataset.removeHandler, {
                data: {
                    item_id: removeButton.dataset.id,
                    id: removeButton.dataset.listId || root.dataset.currentId
                },
                loading: window.oc ? window.oc.stripeLoadIndicator : null,
                confirm: root.dataset.confirmMessage || '',
                success: function (data) {
                    if (typeof this.success === 'function') {
                        this.success(data);
                    }
                    publish('posmall.favoriteList.productRemoved', data);
                }
            });
        });
    }

    function overlayFor(element) {
        var root = element ? element.closest('[data-posmall-checkout]') : document.querySelector('[data-posmall-checkout]');
        return root ? root.querySelector('.mall-overlay') : document.querySelector('.mall-overlay');
    }

    function showOverlay(element) {
        var overlay = overlayFor(element);
        if (overlay) {
            document.body.prepend(overlay);
            overlay.style.display = '';
        }
    }

    function hideOverlay(element) {
        var overlay = overlayFor(element);
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    function checkoutCallbacks() {
        var callbacks = window.Mall && window.Mall.Callbacks && window.Mall.Callbacks.Checkout
            ? window.Mall.Callbacks.Checkout
            : {};

        if (Array.isArray(callbacks)) {
            return callbacks.filter(function (callback) {
                return typeof callback === 'function';
            }).concat(Object.keys(callbacks).filter(function (key) {
                return !/^\d+$/.test(key);
            }).map(function (key) {
                return callbacks[key];
            }).filter(function (callback) {
                return typeof callback === 'function';
            }));
        }

        return Object.keys(callbacks).map(function (key) {
            return callbacks[key];
        }).filter(function (callback) {
            return typeof callback === 'function';
        });
    }

    function runCheckoutCallbacks() {
        return checkoutCallbacks().reduce(function (promise, callback) {
            return promise.then(function () {
                return callback();
            });
        }, Promise.resolve());
    }

    function showPaymentError(message) {
        var element = document.querySelector('[data-payment-error]');

        if (!element) {
            return;
        }

        element.textContent = message || '';
        element.classList.toggle('visible', Boolean(message));
        element.classList.toggle('oc-visible', Boolean(message));
    }

    function extractErrorMessage(response) {
        if (!response) {
            return '';
        }

        if (typeof response === 'string') {
            return response;
        }

        if (response.responseJSON) {
            var data = response.responseJSON;
            var platform = Object.prototype.hasOwnProperty.call(data, 'X_OCTOBER_ERROR_MESSAGE') ? 'OCTOBER' : 'WINTER';
            return data['X_' + platform + '_ERROR_MESSAGE'] || '';
        }

        return response.responseText || response.message || '';
    }

    function extractRedirectUrl(data, xhr) {
        if (xhr && typeof xhr.getResponseHeader === 'function') {
            var headerRedirect = xhr.getResponseHeader('X_OCTOBER_REDIRECT') || xhr.getResponseHeader('X_WINTER_REDIRECT');

            if (headerRedirect) {
                return headerRedirect;
            }
        }

        if (data && typeof data === 'object') {
            return data.X_OCTOBER_REDIRECT
                || data.X_WINTER_REDIRECT
                || data.redirectUrl
                || data.redirect_url
                || data.url
                || '';
        }

        return '';
    }

    function showCheckoutError(root, message) {
        var element = root ? root.querySelector('[data-checkout-error]') : document.querySelector('[data-checkout-error]');

        if (!element) {
            return false;
        }

        element.textContent = message || '';
        element.classList.toggle('d-none', !message);
        element.classList.toggle('visible', Boolean(message));
        element.classList.toggle('oc-visible', Boolean(message));

        return true;
    }

    function setSubmitLoading(button, isLoading) {
        if (!button) {
            return;
        }

        button.disabled = isLoading;
        button.classList.toggle('oc-loading', isLoading);
    }

    function requireStripeTokenIfPresent() {
        var stripeRoot = document.querySelector('[data-posmall-stripe-payment]');
        var stripeToken = document.getElementById('stripe-token');

        if (stripeRoot && stripeToken && !stripeToken.value) {
            throw 'Card payment details could not be prepared. Check the card fields and payment key configuration, then try again.';
        }
    }

    function clearStripeToken() {
        var stripeToken = document.getElementById('stripe-token');

        if (stripeToken) {
            stripeToken.value = '';
        }
    }

    function initPaymentEvents() {
        document.body.addEventListener('click', function (event) {
            if (event.target.closest('.mall-payment-customer-method')) {
                showOverlay(event.target);
            }
        });

        document.body.addEventListener('submit', function (event) {
            var form = event.target.closest('#mall-payment-form');

            if (!form || event.defaultPrevented) {
                return;
            }

            event.preventDefault();

            var alias = form.dataset.componentAlias;
            var submitButton = form.querySelector('[type="submit"]');

            if (!alias) {
                return;
            }

            showOverlay(form);
            showPaymentError('');
            setSubmitLoading(submitButton, true);

            runCheckoutCallbacks().then(function () {
                requireStripeTokenIfPresent();

                request(form, componentHandler(alias, 'onSubmit'), {
                    success: function (data, textStatus, xhr) {
                        clearStripeToken();

                        if (typeof this.success === 'function') {
                            this.success(data, textStatus, xhr);
                        }
                    },
                    error: function (response) {
                        clearStripeToken();
                        var message = extractErrorMessage(response);
                        if (message) {
                            showPaymentError(message);
                        }
                        setSubmitLoading(submitButton, false);
                        hideOverlay(form);
                        if (typeof this.error === 'function') {
                            this.error(response);
                        }
                    }
                });

                window.setTimeout(clearStripeToken, 0);
            }).catch(function (response) {
                clearStripeToken();
                var message = extractErrorMessage(response) || String(response || '');
                if (message) {
                    showPaymentError(message);
                }
                setSubmitLoading(submitButton, false);
                hideOverlay(form);
            });
        });
    }

    function stripeUnavailableMessage(root) {
        return root && root.dataset.unavailableMessage
            ? root.dataset.unavailableMessage
            : 'This payment method is currently unavailable.';
    }

    function setStripeError(message, root) {
        var element = root
            ? root.querySelector('#card-errors')
            : document.getElementById('card-errors');

        if (!element) {
            return;
        }

        element.textContent = message || '';
        element.classList.toggle('visible', Boolean(message));
        element.classList.toggle('oc-visible', Boolean(message));
    }

    function stripeMountTargets(root) {
        if (!root) {
            return {};
        }

        return {
            cardNumber: root.querySelector('[data-posmall-stripe-card-number]'),
            cardExpiry: root.querySelector('[data-posmall-stripe-card-expiry]'),
            cardCvc: root.querySelector('[data-posmall-stripe-card-cvc]')
        };
    }

    function clearStripeContainers(root) {
        var targets = stripeMountTargets(root || document);

        ['cardNumber', 'cardExpiry', 'cardCvc'].forEach(function (key) {
            if (targets[key]) {
                targets[key].innerHTML = '';
            }
        });
    }

    function cleanupStripeState() {
        var state = window.POSMallStripePayment;

        if (window.Mall && window.Mall.Callbacks && window.Mall.Callbacks.Checkout) {
            delete window.Mall.Callbacks.Checkout.Stripe;
        }

        if (state) {
            ['cardNumber', 'cardExpiry', 'cardCvc'].forEach(function (key) {
                if (!state[key]) {
                    return;
                }

                try {
                    state[key].unmount();
                } catch (e) {
                }

                try {
                    state[key].destroy();
                } catch (e) {
                }
            });
        }

        clearStripeContainers(state && state.root ? state.root : document);
        window.POSMallStripePayment = null;
    }

    function ensureStripeScript(root) {
        return new Promise(function (resolve, reject) {
            if (window.Stripe) {
                resolve();
                return;
            }

            if (window.POSMallStripeScriptLoading) {
                var deadline = Date.now() + 10000;
                var timer = window.setInterval(function () {
                    if (window.Stripe) {
                        window.clearInterval(timer);
                        resolve();
                    } else if (Date.now() > deadline) {
                        window.clearInterval(timer);
                        reject(stripeUnavailableMessage(root));
                    }
                }, 100);
                return;
            }

            window.POSMallStripeScriptLoading = true;

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://js.stripe.com/v3/';
            script.onload = function () {
                resolve();
            };
            script.onerror = function () {
                reject(stripeUnavailableMessage(root));
            };
            document.head.appendChild(script);
        });
    }

    function initStripePayment() {
        var root = document.querySelector('[data-posmall-stripe-payment]');

        window.Mall = window.Mall || {};
        window.Mall.Callbacks = window.Mall.Callbacks || {};
        window.Mall.Callbacks.Checkout = window.Mall.Callbacks.Checkout || {};

        cleanupStripeState();

        if (!root) {
            return Promise.resolve();
        }

        var targets = stripeMountTargets(root);
        var publishableKey = root.dataset.publishableKey || '';

        if (!targets.cardNumber || !targets.cardExpiry || !targets.cardCvc) {
            setStripeError(stripeUnavailableMessage(root), root);
            return Promise.reject(stripeUnavailableMessage(root));
        }

        clearStripeContainers(root);

        if (!publishableKey) {
            setStripeError(stripeUnavailableMessage(root), root);
            return Promise.reject(stripeUnavailableMessage(root));
        }

        return ensureStripeScript(root).then(function () {
            var stripe = window.Stripe(publishableKey);
            var elements = stripe.elements();
            var elementOptions = {
                hidePostalCode: true,
                style: {
                    base: {
                        color: '#212529',
                        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                        fontSize: '16px',
                        '::placeholder': {
                            color: '#6c757d'
                        }
                    },
                    invalid: {
                        color: '#dc3545'
                    }
                }
            };
            var cardNumber = elements.create('cardNumber', elementOptions);
            var cardExpiry = elements.create('cardExpiry', elementOptions);
            var cardCvc = elements.create('cardCvc', elementOptions);

            cardNumber.mount(targets.cardNumber);
            cardExpiry.mount(targets.cardExpiry);
            cardCvc.mount(targets.cardCvc);

            [cardNumber, cardExpiry, cardCvc].forEach(function (element) {
                element.addEventListener('change', function (event) {
                    setStripeError(event.error ? event.error.message : '', root);
                });
            });

            window.POSMallStripePayment = {
                root: root,
                stripe: stripe,
                elements: elements,
                cardNumber: cardNumber,
                cardExpiry: cardExpiry,
                cardCvc: cardCvc
            };

            window.Mall.Callbacks.Checkout.Stripe = function () {
                var state = window.POSMallStripePayment;
                var activeRoot = document.querySelector('[data-posmall-stripe-payment]');
                var input = activeRoot ? activeRoot.querySelector('#stripe-token') : null;
                var activeTargets = stripeMountTargets(activeRoot);
                var billingData = {};
                var requiredFields = {
                    billing_name: 'Full name is required.',
                    billing_address_line1: 'Billing address is required.',
                    billing_city: 'City is required.',
                    billing_state: 'State is required.',
                    billing_postal_code: 'ZIP code is required.',
                    billing_country: 'Country is required.'
                };

                if (
                    !state
                    || !state.stripe
                    || !state.cardNumber
                    || !input
                    || !activeRoot
                    || state.root !== activeRoot
                    || !activeTargets.cardNumber
                    || !activeTargets.cardExpiry
                    || !activeTargets.cardCvc
                ) {
                    throw stripeUnavailableMessage(root);
                }

                setSubmitLoading(document.querySelector('#mall-payment-form [type="submit"]'), true);
                setStripeError('', activeRoot);
                activeRoot.querySelectorAll('[data-stripe-billing-field]').forEach(function (field) {
                    var key = field.dataset.stripeBillingField;
                    var value = (field.value || '').trim();

                    billingData[key] = value;
                    field.classList.remove('is-invalid');

                    if (requiredFields[key] && !value) {
                        field.classList.add('is-invalid');
                    }
                });

                var firstMissing = Object.keys(requiredFields).find(function (key) {
                    return !billingData[key];
                });

                if (firstMissing) {
                    throw requiredFields[firstMissing];
                }

                return state.stripe.createToken(state.cardNumber, {
                    name: billingData.billing_name,
                    address_line1: billingData.billing_address_line1,
                    address_city: billingData.billing_city,
                    address_state: billingData.billing_state,
                    address_zip: billingData.billing_postal_code,
                    address_country: billingData.billing_country
                }).then(function (result) {
                    if (result.error) {
                        throw result.error.message;
                    }
                    input.value = result.token.id;
                });
            };
        }).catch(function (message) {
            setStripeError(message || stripeUnavailableMessage(root), root);
            throw message || stripeUnavailableMessage(root);
        });
    }

    function initCheckoutEvents() {
        subscribe('posmall.address.update', function () {
            var root = document.querySelector('[data-posmall-checkout]');
            var alias = root ? root.dataset.componentAlias : '';

            if (alias) {
                request(document.body, componentHandler(alias, 'onRun'), {
                    update: buildUpdate(alias, 'shippingmethod', '.mall-cart-summary__shipping-method > div')
                });
            }
        });

        document.body.addEventListener('click', function (event) {
            var button = event.target.closest('.js-mall-checkout');

            if (!button) {
                return;
            }

            event.preventDefault();

            if (button.disabled) {
                return;
            }

            var root = button.closest('[data-posmall-checkout]');
            var form = root ? root.querySelector('.mall-cart-form') : document.querySelector('.mall-cart-form');
            var alias = root ? root.dataset.componentAlias : '';
            if (!form || !alias) {
                console.error('Checkout form or component alias was not found.');
                return;
            }

            showOverlay(button);
            showCheckoutError(root, '');

            request(form, componentHandler(alias, 'onCheckout'), {
                success: function (data, textStatus, xhr) {
                    var redirectUrl = extractRedirectUrl(data, xhr);

                    if (redirectUrl) {
                        window.location.assign(redirectUrl);
                        return;
                    }

                    if (typeof this.success === 'function') {
                        this.success(data, textStatus, xhr);
                    }
                },
                error: function (xhr) {
                    hideOverlay(button);

                    var message = extractErrorMessage(xhr);
                    if (message) {
                        if (message === 'The token field is required.') {
                            message = 'Card payment details are missing. Return to Payment and enter the card details again before placing the order.';
                        }

                        if (!showCheckoutError(root, 'There was an error while processing your order: ' + message)) {
                            alert('There was an error while processing your order: ' + message);
                        }
                        return;
                    }

                    if (typeof this.error === 'function') {
                        this.error(xhr);
                    }

                    showCheckoutError(root, 'There was an error while processing your order. Please review the payment method and try again.');
                },
                handleValidationMessage: function (message) {
                    if (message && message !== 'null') {
                        if (message === 'The token field is required.') {
                            message = 'Card payment details are missing. Return to Payment and enter the card details again before placing the order.';
                        }
                        if (!showCheckoutError(root, 'There was an error while processing your order: ' + message)) {
                            alert('There was an error while processing your order: ' + message);
                        }
                    }
                }
            });
        });
    }

    function initTermsToggle() {
        function updateSignupButtons(isAccepted) {
            document.querySelectorAll('.mall-btn-signup').forEach(function (button) {
                button.disabled = !isAccepted;
            });
        }

        if (document.querySelector('.js-mall-toggle-signup-terms')) {
            updateSignupButtons(false);
        }

        document.body.addEventListener('change', function (event) {
            var checkbox = event.target.closest('.js-mall-toggle-signup-terms');

            if (checkbox) {
                updateSignupButtons(checkbox.checked);
            }
        });
    }

    function initCookieNotice() {
        var banner = document.querySelector('[data-posmall-cookie-banner]');
        var reminder = document.querySelector('[data-posmall-data-reminder]');
        var storageKey = 'posmallCookieNoticeChoice';
        var choice = null;

        try {
            choice = window.localStorage.getItem(storageKey);
        } catch (e) {
            choice = null;
        }

        if (banner && !choice) {
            banner.classList.remove('d-none');
        }

        if (reminder && choice === 'declined') {
            reminder.classList.remove('d-none');
        }

        document.body.addEventListener('click', function (event) {
            var action = event.target.closest('[data-posmall-cookie-action]');

            if (!action) {
                return;
            }

            try {
                window.localStorage.setItem(storageKey, action.dataset.posmallCookieAction);
            } catch (e) {
                return;
            }

            if (banner) {
                banner.classList.add('d-none');
            }

            if (reminder && action.dataset.posmallCookieAction === 'declined') {
                reminder.classList.remove('d-none');
            }
        });
    }

    function initProductSearch() {
        var timer = null;

        function scheduleSuggest(event) {
            var input = event.target.closest('[data-posmall-search-input]');
            var root = input ? input.closest('[data-posmall-search]') : null;

            if (!input || !root) {
                return;
            }

            var alias = root.dataset.componentAlias;
            var form = root.querySelector('[data-posmall-search-form]');
            var suggestions = root.querySelector('[data-posmall-search-suggestions]');

            if (!alias || !form || !suggestions) {
                return;
            }

            window.clearTimeout(timer);
            timer = window.setTimeout(function () {
                if (input.value.trim().length < 2) {
                    suggestions.innerHTML = '';
                    return;
                }

                var body = new URLSearchParams(new FormData(form));
                body.set('q', input.value);

                window.fetch(window.location.href, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-AJAX-HANDLER': componentHandler(alias, 'onSuggest'),
                        'X-AJAX-PARTIALS': alias + '::suggestions'
                    },
                    body: body.toString()
                }).then(function (response) {
                    if (!response.ok) {
                        throw new Error('Search request failed.');
                    }

                    return response.json();
                }).then(function (data) {
                    suggestions.innerHTML = data[alias + '::suggestions']
                        || data['[data-posmall-search-suggestions]']
                        || '';
                }).catch(function () {
                    suggestions.innerHTML = '';
                });
            }, 250);
        }

        document.body.addEventListener('input', scheduleSuggest);
        document.body.addEventListener('keyup', scheduleSuggest);
        document.body.addEventListener('change', scheduleSuggest);

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') {
                return;
            }

            document.querySelectorAll('[data-posmall-search-suggestions]').forEach(function (element) {
                element.innerHTML = '';
            });
        });

        document.body.addEventListener('click', function (event) {
            if (event.target.closest('[data-posmall-search]')) {
                return;
            }

            document.querySelectorAll('[data-posmall-search-suggestions]').forEach(function (element) {
                element.innerHTML = '';
            });
        });
    }

    function productsRoot(element) {
        return element
            ? element.closest('[data-posmall-products]') || document.querySelector('[data-posmall-products]')
            : document.querySelector('[data-posmall-products]');
    }

    function productsAlias(element) {
        var root = productsRoot(element);

        return root ? root.dataset.componentAlias : '';
    }

    function showProductsLoader(root) {
        (root || document).querySelectorAll('.mall-products .mall-loader, .mall-loader').forEach(function (loader) {
            loader.style.opacity = '1';
            loader.style.visibility = 'visible';
        });
    }

    function hideProductsLoader(root) {
        (root || document).querySelectorAll('.mall-products .mall-loader, .mall-loader').forEach(function (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        });
    }

    function requestProductEntries(root) {
        var alias = productsAlias(root);

        if (!alias) {
            hideProductsLoader(root);
            return;
        }

        request(document.body, componentHandler(alias, 'onRun'), {
            update: buildUpdate(alias, 'entries', '.mall-products'),
            complete: function () {
                hideProductsLoader(root);
            },
            error: function () {
                hideProductsLoader(root);
            }
        });
    }

    function initProductsListing() {
        subscribe('posmall.products.load.start', function () {
            showProductsLoader();
        });

        subscribe('posmall.products.load.complete', function () {
            requestProductEntries();
        });

        subscribe('posmall.products.load.error', function () {
            hideProductsLoader();
        });

        document.body.addEventListener('click', function (event) {
            var link = event.target.closest('.mall-pagination--products a');

            if (!link) {
                return;
            }

            var root = productsRoot(link);

            if (!root) {
                return;
            }

            event.preventDefault();

            publish('posmall.products.load.start');
            history.replaceState(null, '', link.getAttribute('href'));
            publish('posmall.products.load.complete');

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        hideProductsLoader();
    }

    function productsFilterRoot(element) {
        return element
            ? element.closest('[data-posmall-products-filter]')
            : document.querySelector('[data-posmall-products-filter]');
    }

    function getProductsFilterResponseData(response) {
        if (!response) {
            return {};
        }

        if (response.responseJSON) {
            return response.responseJSON;
        }

        return response;
    }

    function updateProductsFilterQueryString(data) {
        if (!data || !Object.prototype.hasOwnProperty.call(data, 'queryString')) {
            return;
        }

        var queryString = data.queryString ? '?' + data.queryString : '';
        history.replaceState(null, '', window.location.pathname + queryString);
    }

    function initProductsFilterRangeSliders(root) {
        if (!root) {
            return;
        }

        root.querySelectorAll('.mall-slider-handles').forEach(function (slider) {
            if (!window.noUiSlider || slider.noUiSlider) {
                return;
            }

            window.noUiSlider.create(slider, {
                start: [
                    slider.dataset.start,
                    slider.dataset.end
                ],
                connect: true,
                range: {
                    min: [parseFloat(slider.dataset.min)],
                    max: [parseFloat(slider.dataset.max)]
                },
                pips: {
                    mode: 'range',
                    density: 20
                }
            });

            slider.dataset.rangeInitialized = '0';

            slider.noUiSlider.on('update', function (values) {
                updateProductsFilterRangeLabels(slider, values);

                if (slider.dataset.rangeInitialized === '1') {
                    updateProductsFilterRangeInputs(slider, values);
                }
            });

            slider.dataset.rangeInitialized = '1';

            slider.noUiSlider.on('change', function (values) {
                updateProductsFilterRangeInputs(slider, values);
                submitProductsFilter(root);
            });
        });
    }

    function formatProductsFilterRangeValue(value) {
        var number = parseFloat(value);

        if (!isFinite(number)) {
            return '';
        }

        if (Math.abs(number - Math.round(number)) < 0.005) {
            return String(Math.round(number));
        }

        return number.toFixed(2).replace(/\.?0+$/, '');
    }

    function updateProductsFilterRangeLabels(slider, values) {
        document.querySelectorAll('[data-range-min-label="' + slider.dataset.target + '"]').forEach(function (label) {
            label.textContent = formatProductsFilterRangeValue(values[0]);
        });

        document.querySelectorAll('[data-range-max-label="' + slider.dataset.target + '"]').forEach(function (label) {
            label.textContent = formatProductsFilterRangeValue(values[1]);
        });
    }

    function updateProductsFilterRangeInputs(slider, values) {
        document.querySelectorAll('[data-min="' + slider.dataset.target + '"]').forEach(function (input) {
            input.value = values[0];
        });

        document.querySelectorAll('[data-max="' + slider.dataset.target + '"]').forEach(function (input) {
            input.value = values[1];
        });
    }

    function replaceProductsFilterMarkup(root, data) {
        if (!root || !data || !Object.prototype.hasOwnProperty.call(data, 'filterMarkup')) {
            return;
        }

        root.innerHTML = data.filterMarkup || '';
        initProductsFilterRangeSliders(root);
    }

    function updateProductsFilterVisibility(data) {
        if (!data || !Object.prototype.hasOwnProperty.call(data, 'filter')) {
            return;
        }

        document.querySelectorAll('[data-filter]').forEach(function (element) {
            element.style.display = 'none';
        });

        Object.keys(data.filter || {}).forEach(function (filterName) {
            document.querySelectorAll('[data-filter="' + filterName + '"]').forEach(function (element) {
                element.style.display = '';
            });
        });
    }

    function syncProductsFilterSelectedState(input) {
        var option = input.closest('.js-mall-filter');

        if (option) {
            option.classList.toggle('mall-filter__option--selected', input.checked);
        }
    }

    function submitProductsFilter(root) {
        if (!root) {
            return;
        }

        root.dispatchEvent(new Event('submit', {
            bubbles: true,
            cancelable: true
        }));
    }

    function resetProductsFilterGroup(parent) {
        parent.querySelectorAll('input, select, textarea').forEach(function (input) {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
                return;
            }

            input.value = '';
        });

        parent.querySelectorAll('.mall-filter__option--selected').forEach(function (selectedOption) {
            selectedOption.classList.remove('mall-filter__option--selected');
        });

        parent.querySelectorAll('.mall-slider-handles').forEach(function (slider) {
            if (slider.noUiSlider) {
                slider.noUiSlider.updateOptions({
                    start: [
                        slider.dataset.min,
                        slider.dataset.max
                    ]
                });
            }
        });
    }

    function initProductsFilter() {
        document.body.addEventListener('click', function (event) {
            var option = event.target.closest('.js-mall-filter');

            if (option) {
                var root = productsFilterRoot(option);
                var input = option.querySelector('input');

                if (!root) {
                    return;
                }

                if (input) {
                    var isHidden = input.offsetParent === null || input.type === 'hidden';

                    if (!isHidden) {
                        return;
                    }

                    input.checked = !input.checked;
                    syncProductsFilterSelectedState(input);
                } else {
                    option.classList.toggle('mall-filter__option--selected');
                }

                submitProductsFilter(root);
                return;
            }

            var clearButton = event.target.closest('.js-mall-clear-filter');

            if (clearButton) {
                var clearRoot = productsFilterRoot(clearButton);
                var parent =
                    clearButton.closest('.mall-property') ||
                    clearButton.closest('.mall-property-group');

                if (!clearRoot || !parent) {
                    return;
                }

                event.preventDefault();
                resetProductsFilterGroup(parent);
                submitProductsFilter(clearRoot);
                return;
            }

            var toggle = event.target.closest('.mall-property__toggle, .mall-property-group__toggle');

            if (toggle) {
                var toggleParent =
                    toggle.closest('.mall-property') ||
                    toggle.closest('.mall-property-group');

                if (toggleParent) {
                    toggleParent.classList.toggle('mall-property--collapsed');
                    toggleParent.classList.toggle('mall-property-group--collapsed');
                }
            }
        });

        document.body.addEventListener('change', function (event) {
            var filterInput = event.target.closest('.js-mall-filter input[type="checkbox"], .js-mall-filter input[type="radio"]');

            if (filterInput) {
                syncProductsFilterSelectedState(filterInput);
                submitProductsFilter(productsFilterRoot(filterInput));
                return;
            }

            var select = event.target.closest('.js-mall-select-filter');

            if (select) {
                submitProductsFilter(productsFilterRoot(select));
            }
        });

        document.body.addEventListener('submit', function (event) {
            var root = productsFilterRoot(event.target);

            if (!root) {
                return;
            }

            var alias = root.dataset.componentAlias;

            if (!alias) {
                return;
            }

            event.preventDefault();

            if (!window.oc || typeof window.oc.request !== 'function') {
                console.error('October AJAX function oc.request is not available.');
                publish('posmall.products.load.error');
                return;
            }

            publish('posmall.products.load.start');

            request(root, componentHandler(alias, 'onSetFilter'), {
                loading: window.oc ? window.oc.stripeLoadIndicator : null,
                complete: function (response) {
                    if (window.oc && window.oc.stripeLoadIndicator) {
                        window.oc.stripeLoadIndicator.hide();
                    }

                    var data = getProductsFilterResponseData(response);

                    updateProductsFilterQueryString(data);
                    replaceProductsFilterMarkup(root, data);
                    updateProductsFilterVisibility(data);
                    publish('posmall.products.load.complete', data);
                },
                error: function () {
                    if (window.oc && window.oc.stripeLoadIndicator) {
                        window.oc.stripeLoadIndicator.hide();
                    }

                    if (window.oc && window.oc.flashMsg) {
                        window.oc.flashMsg({
                            text: root.dataset.posmallFilterErrorMessage || 'Search failed.',
                            class: 'error'
                        });
                    }

                    publish('posmall.products.load.error');
                }
            });
        });

        document.querySelectorAll('[data-posmall-products-filter]').forEach(initProductsFilterRangeSliders);
    }

    function formatServiceSubtotal(root, cents) {
        var symbol = root.dataset.currencySymbol || '$';
        var decimals = parseInt(root.dataset.currencyDecimals, 10);

        if (Number.isNaN(decimals)) {
            decimals = 2;
        }

        return symbol + ' ' + (Math.max(0, cents) / 100).toFixed(decimals);
    }

    function updateOptionLine(root, input, isSelected, unitCents, multiplier) {
        var row = input ? input.closest('tr') : null;
        var calculation = row ? row.querySelector('[data-posmall-option-calculation]') : null;
        var lineTotal = row ? row.querySelector('[data-posmall-option-line-total]') : null;

        if (!calculation || !lineTotal) {
            return;
        }

        if (typeof lineTotal.dataset.originalHtml === 'undefined') {
            lineTotal.dataset.originalHtml = lineTotal.innerHTML;
        }

        if (isSelected && unitCents > 0) {
            calculation.textContent = multiplier + ' x ' + formatServiceSubtotal(root, unitCents) + ' =';
            lineTotal.textContent = formatServiceSubtotal(root, unitCents * multiplier);
            return;
        }

        calculation.textContent = '';
        lineTotal.innerHTML = lineTotal.dataset.originalHtml;
    }

    function updateServiceSubtotal(root) {
        var serviceCents = 0;
        var customCents = 0;
        var quantity = serviceOptionsQuantity(root);
        var serviceMultiplier = serviceOptionsPerQuantity(root) ? quantity : 1;

        root.querySelectorAll('[data-posmall-service-option]').forEach(function (input) {
            var unitCents = parseInt(input.dataset.price, 10) || 0;
            var selected = input.checked;

            if (selected) {
                serviceCents += unitCents;
            }

            updateOptionLine(root, input, selected, unitCents, serviceMultiplier);
        });

        root.querySelectorAll('[data-posmall-priced-custom-field]').forEach(function (input) {
            var selected = true;
            var unitCents = parseInt(input.dataset.price, 10) || 0;

            if (input.type === 'checkbox' && !input.checked) {
                updateOptionLine(root, input, false, unitCents, quantity);
                return;
            }

            if (input.tagName === 'SELECT') {
                var option = input.options[input.selectedIndex];
                selected = !!(option && option.value);
                unitCents = selected ? (parseInt(option.dataset.price, 10) || 0) : 0;
                customCents += unitCents;
                updateOptionLine(root, input, selected, unitCents, quantity);
                return;
            }

            if (!input.value) {
                updateOptionLine(root, input, false, unitCents, quantity);
                return;
            }

            customCents += unitCents;
            updateOptionLine(root, input, selected, unitCents, quantity);
        });

        var optionsCents = (customCents * quantity) + (serviceCents * serviceMultiplier);

        var target = root.querySelector('[data-posmall-service-subtotal]');
        if (target) {
            target.textContent = formatServiceSubtotal(root, optionsCents);
        }

        var total = root.querySelector('[data-posmall-product-services-total]');
        if (total) {
            total.textContent = formatServiceSubtotal(root, optionsCents + ((parseInt(root.dataset.productBasePrice, 10) || 0) * quantity));
        }
    }

    function serviceOptionsQuantity(root) {
        var form = root.closest('form');
        var input = form ? form.querySelector('[name="quantity"]') : null;
        var quantity = input ? parseInt(input.value, 10) : 1;

        return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    }

    function serviceOptionsPerQuantity(root) {
        var input = root.querySelector('[data-posmall-service-per-quantity-toggle]');

        return !input || input.checked;
    }

    function serviceOptionsRootForInput(input) {
        if (!input) {
            return null;
        }

        var root = input.closest('[data-posmall-service-options]');
        if (root) {
            return root;
        }

        var form = input.closest('form');

        return form ? form.querySelector('[data-posmall-service-options]') : null;
    }

    function handleServiceOptionsChange(event) {
        var input = event.target.closest('[data-posmall-service-option], [data-posmall-priced-custom-field], [data-posmall-service-per-quantity-toggle], [name="quantity"]');
        var root = serviceOptionsRootForInput(input);

        if (!root) {
            return;
        }

        updateServiceSubtotal(root);
    }

    function initServiceOptionTotals() {
        document.body.addEventListener('change', handleServiceOptionsChange);
        document.body.addEventListener('input', handleServiceOptionsChange);

        document.querySelectorAll('[data-posmall-service-options]').forEach(updateServiceSubtotal);
    }

    function setServiceGalleryIndex(gallery, index) {
        var slides = Array.from(gallery.querySelectorAll('[data-posmall-service-gallery-slide]'));
        var dots = Array.from(gallery.querySelectorAll('[data-posmall-service-gallery-dot]'));
        var count = slides.length;

        if (count < 1) {
            return;
        }

        var nextIndex = ((index % count) + count) % count;
        gallery.style.setProperty('--posmall-service-gallery-index', nextIndex);
        gallery.dataset.currentIndex = String(nextIndex);

        slides.forEach(function (slide, slideIndex) {
            var isActive = slideIndex === nextIndex;
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('is-active', dotIndex === nextIndex);
        });
    }

    function startServiceGalleryAutoplay(gallery) {
        var interval = parseInt(gallery.dataset.autoplayMs, 10) || 0;
        var slideCount = gallery.querySelectorAll('[data-posmall-service-gallery-slide]').length;

        if (gallery.posmallServiceGalleryTimer) {
            window.clearInterval(gallery.posmallServiceGalleryTimer);
            gallery.posmallServiceGalleryTimer = null;
        }

        if (interval > 0 && interval < 2000) {
            interval = 2000;
        }

        if (interval < 2000 || slideCount < 2) {
            return;
        }

        gallery.posmallServiceGalleryTimer = window.setInterval(function () {
            var current = parseInt(gallery.dataset.currentIndex, 10) || 0;
            setServiceGalleryIndex(gallery, current + 1);
        }, interval);
    }

    function initServiceGalleries() {
        document.querySelectorAll('[data-posmall-service-gallery]').forEach(function (gallery) {
            if (gallery.dataset.posmallServiceGalleryReady === '1') {
                return;
            }

            gallery.dataset.posmallServiceGalleryReady = '1';
            setServiceGalleryIndex(gallery, 0);
            startServiceGalleryAutoplay(gallery);

            gallery.addEventListener('click', function (event) {
                var current = parseInt(gallery.dataset.currentIndex, 10) || 0;
                var dot = event.target.closest('[data-posmall-service-gallery-dot]');

                if (event.target.closest('[data-posmall-service-gallery-prev]')) {
                    setServiceGalleryIndex(gallery, current - 1);
                    startServiceGalleryAutoplay(gallery);
                    return;
                }

                if (event.target.closest('[data-posmall-service-gallery-next]')) {
                    setServiceGalleryIndex(gallery, current + 1);
                    startServiceGalleryAutoplay(gallery);
                    return;
                }

                if (dot) {
                    setServiceGalleryIndex(gallery, parseInt(dot.dataset.index, 10) || 0);
                    startServiceGalleryAutoplay(gallery);
                }
            });
        });
    }

    function initStripeAfterPaymentChange() {
        subscribe('posmall.cart.paymentMethodChanged', function () {
            window.setTimeout(function () {
                initStripePayment().catch(function () {});
            }, 50);
        });
    }

    ready(function () {
        initMobileMenu();
        initFloatingActions();
        initHeaderCounts();
        initMallModal();
        initProductEvents();
        initProduct();
        initCartEvents();
        initFavoritesEvents();
        initPaymentEvents();
        initCheckoutEvents();
        initTermsToggle();
        initCookieNotice();
        initProductSearch();
        initProductsListing();
        initProductsFilter();
        initServiceOptionTotals();
        initServiceGalleries();
        initStripeAfterPaymentChange();
        initStripePayment().catch(function () {});
    });
}());
