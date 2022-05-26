const path = require('path');
module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/stories/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
      }
    }
  ],
  features: {
    interactionsDebugger: true,
  },
  core: {
    builder: "webpack5",
  },
  framework: "@storybook/react",
  webpackFinal: async (config, { configType }) => {
    config.resolve.alias['@'] = path.resolve(__dirname, '../src/');
    // Remove the default .css webpack module rule
    // This is necessary because we use both global CSS and CSS modules
    // in the extension and in Storybook
    config.module.rules = config.module.rules.filter((r) => {
      if (".css".match(r.test)) {
        return false;
      }
      return true;
    });

    config.module.rules.push({
      test: /\.css$/,
      use: [
        "style-loader",
        "css-loader",
      ],
    });
    return config;
  },
  typescript: {
    typescript: {
      check: false,
      checkOptions: {},
      reactDocgen: 'react-docgen-typescript',
      reactDocgenTypescriptOptions: {
        shouldExtractLiteralValuesFromEnum: true,
        propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
      },
    },
  }
}