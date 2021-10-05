const path = require('path');

module.exports = {
  stories: [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  resolve: {
    alias: {
        'core-js/modules': path.resolve(
            __dirname,
            'node_modules/@storybook/core/node_modules/core-js/modules',
        ),
    }
  }
}
