[![Code Climate](https://lzw.me/images/logo.png)](https://lzw.me)
[![@lzwme/git-repo-sync](https://nodei.co/npm/@lzwme/git-repo-sync.png)](npm-url)

# @lzwme/git-repo-sync

[![NPM version][npm-badge]][npm-url]
[![node version][node-badge]][node-url]
[![npm download][download-badge]][download-url]
[![GitHub issues][issues-badge]][issues-url]
[![GitHub forks][forks-badge]][forks-url]
[![GitHub stars][stars-badge]][stars-url]
[![minzipped size][bundlephobia-badge]][bundlephobia-url]

`git` 多仓库代码同步辅助工具。

应用场景：

某个npm 包在内部 npm 私域和 npmjs 上均有发布，但从内部向外部同步部署时，需要过滤敏感信息、替换一些不同的内容。这个工作是重复且枯燥的，此时该 `grs` 小工具或许能帮助到你。

## 安装

```bash
npm i @lzwme/git-repo-sync
# use yarn
yarn add @lzwme/git-repo-sync
```

## 使用

### 命令行方式

```bash
grs --help
# 复杂的内容替换规则建议使用配置文件方式。新增 .grs.confg.js 配置文件，然后执行：
grs --debug
# 示例：
```

### API 调用

提供了如下 API 调用方式：

```ts
import { sync, syncDefaultOptions } from '@lzwme/git-repo-sync';

const total = sync({
  ...syncDefaultOptions,
  silent: true,
});
console.log(res);
```

## 开发

本地二次开发：

```bash
git clone https://github.com/lzwme/git-repo-sync
yarn install
npm link
yarn dev
```

或者 [fork]() 本项目进行代码贡献。

**欢迎贡献想法与代码。**

## License

`@lzwme/git-repo-sync` is released under the MIT license.

该插件由[志文工作室](https://lzw.me)开发和维护。


[stars-badge]: https://img.shields.io/github/stars/lzwme/git-repo-sync.svg
[stars-url]: https://github.com/lzwme/git-repo-sync/stargazers
[forks-badge]: https://img.shields.io/github/forks/lzwme/git-repo-sync.svg
[forks-url]: https://github.com/lzwme/git-repo-sync/network
[issues-badge]: https://img.shields.io/github/issues/lzwme/git-repo-sync.svg
[issues-url]: https://github.com/lzwme/git-repo-sync/issues
[npm-badge]: https://img.shields.io/npm/v/@lzwme/git-repo-sync.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@lzwme/git-repo-sync
[node-badge]: https://img.shields.io/badge/node.js-%3E=_10.0.0-green.svg?style=flat-square
[node-url]: https://nodejs.org/download/
[download-badge]: https://img.shields.io/npm/dm/@lzwme/git-repo-sync.svg?style=flat-square
[download-url]: https://npmjs.org/package/@lzwme/git-repo-sync
[bundlephobia-url]: https://bundlephobia.com/result?p=@lzwme/git-repo-sync@latest
[bundlephobia-badge]: https://badgen.net/bundlephobia/minzip/@lzwme/git-repo-sync@latest
