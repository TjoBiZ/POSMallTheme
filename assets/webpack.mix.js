let mix = require('laravel-mix');
require('laravel-mix-purgecss');
require('laravel-mix-merge-manifest');

mix.setPublicPath('.');

mix.js('src/js/posmall-storefront.js', 'posmall/compiled/js/storefront.min.js');
mix.styles(['posmall/css/storefront.css'], 'posmall/compiled/css/storefront.min.css');

mix.purgeCss({
  enabled: true,
  extend: {
    content: [
      '../layouts/**/*.htm',
      '../pages/**/*.htm',
      '../../../plugins/kodzero/posmall/components/**/*.htm',
      '../../../plugins/kodzero/posmall/controllers/**/*.htm',
      'src/**/*.js',
      'src/**/*.scss',
      'posmall/js/**/*.js'
    ],
    safelist: {
      standard: [
        'show',
        'fade',
        'active',
        'focused',
        'collapsing',
        'form-control',
        'form-label',
        'btn',
        'modal',
        'modal-open',
        'modal-backdrop',
        'spinner-border',
        'spinner-border-sm',
        'btn-close',
        'btn-close-white',
        'd-none',
        'd-inline-flex'
      ],
      deep: [
        /^mall-/,
        /^posmall-/,
        /^form-outline/,
        /^form-notch/,
        /^form-bottom/,
        /^btn-/,
        /^badge/,
        /^text-/,
        /^bg-/,
        /^border/,
        /^ratio/,
        /^object-fit-/,
        /^modal/,
        /^spinner-border/
      ],
      greedy: [
        /^mall-/,
        /^posmall-/,
        /^form-outline/,
        /^form-notch/
      ],
      keyframes: true,
      variables: true
    }
  }
});

mix.options({
  processCssUrls: false,
  cssNano: { discardComments: { removeAll: true } },
  terser: {
    terserOptions: { output: { comments: false } },
    extractComments: false
  }
});

mix.mergeManifest();
