// @ts-check

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

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
exports.syncDefaultOptions = syncDefaultOptions;

class GRS {
  #options = syncDefaultOptions;

  /** 匹配到的文件总个数 */
  totalFiles = 0;

  // constructor() {}

  /** 打印日志 */
  printLog(...args) {
    if (this.#options.silent) return;
    if (!args.length) console.log();
    else console.log(chalk.cyan('[GRS]'), ...args);
  }
  parseOptions(opts = syncDefaultOptions) {
    opts = assign(assign({}, syncDefaultOptions), opts);

    this.#options = opts;
    return this.#options;
  }

  fileFilter(name = '') {
    const opts = this.#options;
    // if (opts.debug) this.printLog(chalk.cyan('[debug]FileFilter For:'), name);

    if (!name || ['.', '..', '\'..'].includes(name)) return false;

    if (opts.include.length) {
      return opts.include.some(rule => rule && new RegExp(rule, 'i').test(name));
    }

    if (opts.exclude.length) {
      const o = opts.exclude.some(rule => rule && new RegExp(rule, 'i').test(name));

      if (o) return false;
    }

    return true;
  }

  fileCopy(srcFilePath = '', destFilePath = '') {
    const opts = this.#options;
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

        if (opts.debug) this.printLog('[sync][debug]content replace:', srcFilePath, n.from, '=>', n.to);
      });
    });
    fs.writeFileSync(destFilePath, content);
    // fs.createReadStream(srcFilePath).pipe(fs.createWriteStream(destFilePath));
  }
  /** 目录递归遍历 */
  dirSync(dir = '') {
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
    if (!this.fileFilter(dir)) return;

    const opts = this.#options;
    const fileList = fs.readdirSync(dir);

    fileList.forEach(name => {
      const fpath = path.resolve(dir, name);

      if (!this.fileFilter(fpath)) {
        if (opts.debug) this.printLog('file Filtered:', fpath);
        return;
      }

      if (fs.statSync(fpath).isDirectory()) return this.dirSync(fpath);

      const destPath = path.resolve(opts.dest, fpath.replace(opts.src, opts.dest));
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        this.printLog('Create Dir:', chalk.cyan(destDir));
      }

      this.fileCopy(fpath, destPath);
      this.totalFiles++;
      this.printLog(' - Copy File To:', chalk.cyan(destPath));
    });
  }

  /** git sync */
  tryGitSync(opts = syncDefaultOptions) {
    if (!opts.git.commit) return;
    if (opts.debug) this.printLog('Start Git Sync');

    const srcChangedList = execSync(`git diff HEAD --name-only`, { cwd: opts.src, encoding: 'utf-8' }).trim();

    if (srcChangedList.length) {
      this.printLog(chalk.yellowBright('源目录存在未提交的变更，忽略 git 同步'));
      return;
    }

    const destChangedList = execSync(`git diff HEAD --name-only`, { cwd: opts.dest, encoding: 'utf-8' }).trim();

    if (!destChangedList.length) {
      this.printLog(chalk.yellowBright('没有新文件更新'));
      return;
    }

    const latestComment = execSync(`git log --pretty="%s" -1`, { cwd: opts.src, encoding: 'utf-8' }).trim();
    const destComment = execSync(`git log --pretty="%s" -1`, { cwd: opts.dest, encoding: 'utf-8' }).trim();

    if (opts.debug) this.printLog(`\n src:`, latestComment, `\ndest:`, destComment);
    if (latestComment === destComment) {
      this.printLog(chalk.yellowBright('最近一次的提交信息相同，忽略 git commit 同步'));
      return;
    }

    const gitCmds = [`git add --all`, `git commit -m "${latestComment}"` + (opts.git.noVerify ? ' --no-verify' : '')];
    if (opts.git.rebase) gitCmds.push(`git pull --rebase --no-verify`);
    if (opts.git.push) gitCmds.push(`git push`);

    this.runCmds(gitCmds);
  }
  runCmds(cmds = []) {
    if (!Array.isArray(cmds)) cmds = [cmds];
    cmds.forEach(cmd => {
      this.printLog(chalk.cyanBright(`[RUN CMD]`), chalk.bold.greenBright(cmd));
      const info = execSync(cmd, { cwd: this.#options.dest, encoding: 'utf-8' }).trim();
      if (info) this.printLog(info);
    });
  }
  sync(opts = syncDefaultOptions) {
    opts = this.parseOptions(opts);

    if (opts.debug) this.printLog('sync options:', opts);

    if (!fs.existsSync(opts.dest)) {
      fs.mkdirSync(opts.dest, { recursive: true });
      this.printLog('Create Dest Dir:', opts.dest);
    }

    this.totalFiles = 0;

    this.printLog('sync start:', chalk.cyanBright(opts.src), '=>', chalk.cyanBright(opts.dest));
    this.dirSync(opts.src);
    this.printLog('Done! Sync Files  Total:', this.totalFiles);

    this.runCmds(opts.cmds.gitBefore);
    if (this.totalFiles) this.tryGitSync(opts);
    this.runCmds(opts.cmds.gitAfter);

    return this.totalFiles;
  }
}

exports.grs = new GRS();


/** 简易的对象深复制 */
function assign(a, b) {
  if (!a || !b) return a;
  if (typeof b !== 'object' || b instanceof RegExp || Array.isArray(b)) return a;

  for (const key in b) {
    if (null == b[key] || typeof b[key] !== 'object' || b[key] instanceof RegExp || b[key] instanceof Array) {
      a[key] = b[key];
    } else {
      if (!a[key]) a[key] = {};
      assign(a[key], b[key]);
    }
  }

  return a;
}
