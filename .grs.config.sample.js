// @ts-check
// grs config file

const path = require('path');

module.exports = {
  src: process.cwd(),
  dest: path.resolve(process.cwd(), `../${path.basename(process.cwd())}-sync`),
  silent: false,
  exclude: [/(\/|\\)\.git(\/|\\)/, 'dist', '.nyc', 'node_modules', '.grs.config.js'],
  include: ['src', 'package.json', 'readme.md'],
  replaceRules: [
    {
      /** 文件匹配规则，如不存在则表示匹配所有文件 */
      match: /README\.md/i,
      list: [
        {
          /** 匹配关键词，若为空则忽略 */
          from: '@lzwme',
          /** 替换为 */
          to: '@test',
        },
        {
          /** 匹配关键词，若为空则忽略 */
          from: /^\[.+\n/gm,
          /** 替换为 */
          to: '',
        },
      ],
    },
    {
      /** 文件匹配规则，如不存在则表示匹配所有文件 */
      match: /package\.json/i,
      list: [
        {
          /** 匹配关键词，若为空则忽略 */
          from: '@lzwme',
          /** 替换为 */
          to: '@test',
        },
      ],
    },
    {
      /** 文件匹配规则，如不存在则表示匹配所有文件 */
      match: null,
      list: [
        {
          /** 匹配关键词，若为空则忽略 */
          from: '@lzwme',
          /** 替换为 */
          to: '@test',
        },
        {
          from: 'https://github.com/lzwme/fed-lint-helper',
          to: 'https://gitlab.com/lzwme/fed-lint-helper',
        },
      ],
    },
  ],
};
