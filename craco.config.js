const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Enable tree shaking
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        usedExports: true,
        sideEffects: false,
      };

      // Production optimizations
      if (env === 'production') {
        // Optimize chunk splitting
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 3, // Increased from 2 to reduce small chunks
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            react: {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            uiLibs: {
              name: 'ui-libs',
              test: /[\\/]node_modules[\\/](lucide-react|react-window|react-virtualized)[\\/]/,
              chunks: 'all',
              priority: 25,
            },
            state: {
              name: 'state',
              test: /[\\/]node_modules[\\/](zustand|@tanstack\/react-query)[\\/]/,
              chunks: 'all',
              priority: 25,
            },
          },
        };

        // Enhanced minification
        webpackConfig.optimization.minimizer = [
          new TerserPlugin({
            terserOptions: {
              parse: {
                ecma: 8,
              },
              compress: {
                ecma: 5,
                warnings: false,
                comparisons: false,
                inline: 2,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
              },
              mangle: {
                safari10: true,
              },
              output: {
                ecma: 5,
                comments: false,
                ascii_only: true,
              },
            },
          }),
        ];

        // Add compression plugins
        webpackConfig.plugins.push(
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
          }),
          new CompressionPlugin({
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
            filename: '[path][base].br',
          })
        );

        // Add bundle analyzer in analyze mode
        if (process.env.ANALYZE) {
          webpackConfig.plugins.push(new BundleAnalyzerPlugin());
        }
      }

      // Image optimization
      const imageRule = webpackConfig.module.rules.find(
        rule => rule.oneOf && 
        rule.oneOf.find(r => r.test && r.test.toString().includes('png|jpg'))
      );

      if (imageRule && imageRule.oneOf) {
        imageRule.oneOf.unshift({
          test: /\.(png|jpe?g|gif|webp)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb
            },
          },
          generator: {
            filename: 'static/media/[name].[hash:8][ext]',
          },
        });
      }

      return webpackConfig;
    },
  },
};