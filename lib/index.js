// @ts-check

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const syncDefaultOptions = {
  src: process.cwd(),
  dest: path.resolve(process.cwd(), `../${path.basename(process.cwd())}-sync`),
  debug: false,
  silent: false,
  exclude: [/(\/|\\)\.git(\/|\\)/, 'dist', '.nyc', 'node_modules', '.grs.config.js'],
  include: [],
  replaceRules: [{
    /** 文件匹配规则，如不存在则表示匹配所有文件 */
    match: null,
    list: [{
      /** 匹配关键词，若为空则忽略 */
      from: '',
      /** 替换为 */
      to: '',
    }],
  }],
};
exports.syncDefaultOptions = syncDefaultOptions;

function tryGitCommitAndPush(opts = syncDefaultOptions) {
  if (opts.debug) console.log('TODO:');
}

function sync(opts = syncDefaultOptions) {
  opts = Object.assign({}, syncDefaultOptions, opts);
  if (opts.debug) console.log('sync options:', opts);

  if (!fs.existsSync(opts.dest)) {
    fs.mkdirSync(opts.dest, { recursive: true });
    console.log('Create Dest Dir:', opts.dest);
  }

  const fileFilter = (name = '') => {
    // if (opts.debug) console.log(chalk.cyan('[debug]FileFilter For:'), name);

    if (!name || ['.', '..', '\'..'].includes(name)) return false;

    if (opts.include.length) {
      return opts.include.some(rule => rule && new RegExp(rule, 'i').test(name));
    }

    if (opts.exclude.length) {
      const o = opts.exclude.some(rule => rule && new RegExp(rule, 'i').test(name));

      if (o) return false;
    }


    return true;
  };

  const fileCopy = (srcFilePath = '', descFilePath = '') => {
    let content = fs.readFileSync(srcFilePath, { encoding: 'utf-8' });
    opts.replaceRules.forEach(d => {
      if (!d || !d.list.length) return;
      if (d.match) {
        if (!(d.match instanceof RegExp)) d.match = new RegExp(d.match, 'i');
        if (!d.match.test(srcFilePath)) return;
      }

      // 执行替换
      d.list.forEach(n => {
        if (!n.from) return;
        content = content.replace(new RegExp(n.from, 'gm'), n.to || '');

        if (opts.debug) console.log('[sync][debug]content replace:', srcFilePath, n.from, '=>', n.to);
      });
    });
    fs.writeFileSync(descFilePath, content);
    // fs.createReadStream(srcFilePath).pipe(fs.createWriteStream(descFilePath));
  };

  let totalFiles = 0;
  const sync = (dir = '') => {
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
    if (!fileFilter(dir)) return;

    const fileList = fs.readdirSync(dir);

    fileList.forEach(name => {
      const fpath = path.resolve(dir, name);

      if (!fileFilter(fpath)) {
        if (opts.debug) console.log('file Filtered:', fpath);
        return;
      }

      if (fs.statSync(fpath).isDirectory()) return sync(fpath);

      const destPath = path.resolve(opts.dest, fpath.replace(opts.src, opts.dest));
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        if (!opts.silent) console.log('Create Dir:', chalk.cyan(destDir));
      }

      fileCopy(fpath, destPath);
      totalFiles++;
      if (!opts.silent) console.log(' - Copy File To:', chalk.cyan(destPath));
    });
  }

  if (!opts.silent) console.log('sync start:', chalk.cyanBright(opts.src), '=>', chalk.cyanBright(opts.dest));
  sync(opts.src);
  if (!opts.silent) console.log('Done! Sync Files  Total:', totalFiles);

  if (totalFiles) tryGitCommitAndPush(opts);
  return totalFiles;
}
exports.sync = sync;
