// @ts-check
// grs config file

const path = require('path');

module.exports = {
  src: process.cwd(),
  dest: path.resolve(process.cwd(), `../${path.basename(process.cwd())}-sync`),
  silent: false,
  exclude: [/(\/|\\)\.git(\/|\\)/, 'dist', '.nyc', 'node_modules', '.grs.config.js'],
  // include: ['src', 'package.json', 'readme.md'],
  // replaceRules: [
  //   {
  //     /** 文件匹配规则，如不存在则表示匹配所有文件 */
  //     match: /README\.md/i,
  //     list: [
  //       {
  //         /** 匹配关键词，若为空则忽略 */
  //         from: '@lzwme',
  //         /** 替换为 */
  //         to: '@test',
  //       },
  //       {
  //         /** 匹配关键词，若为空则忽略 */
  //         from: /^\[.+\n/gm,
  //         /** 替换为 */
  //         to: '',
  //       },
  //     ],
  //   },
  //   {
  //     /** 文件匹配规则，如不存在则表示匹配所有文件 */
  //     match: /package\.json/i,
  //     list: [
  //       {
  //         /** 匹配关键词，若为空则忽略 */
  //         from: '@lzwme',
  //         /** 替换为 */
  //         to: '@test',
  //       },
  //     ],
  //   },
  //   {
  //     /** 文件匹配规则，如不存在则表示匹配所有文件 */
  //     match: null,
  //     list: [
  //       {
  //         /** 匹配关键词，若为空则忽略 */
  //         from: '@lzwme',
  //         /** 替换为 */
  //         to: '@test',
  //       },
  //       {
  //         from: 'https://github.com/lzwme/fed-lint-helper',
  //         to: 'https://gitlab.com/lzwme/fed-lint-helper',
  //       },
  //     ],
  //   },
  // ],
  /** git 同步选项 */
  git: {
    /** 是否执行 commit */
    commit: true,
    /** 是否执行 rebase。适合多人协作的场景 */
    rebase: false,
    /** 是否执行 push */
    push: false,
    /** 是否跳过 git hooks。默认 false */
    noVerify: false,
  },
  /** 要执行的命令列表 */
  cmds: {
    /** git sync 之前执行的命令 */
    gitBefore: [],
    /** git sync 之后执行的命令 */
    gitAfter: [],
  },
};
