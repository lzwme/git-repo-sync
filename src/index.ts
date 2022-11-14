// @ts-check

import * as fs from 'fs';
import { resolve, basename, dirname } from 'path';
import { color } from 'console-log-colors';
import { execSync } from 'child_process';

export interface Options {
  src?: string;
  dest?: string;
  debug?: boolean;
  silent?: boolean;
  exclude?: (string | RegExp)[];
  include?: (string | RegExp)[];
  /** 同步前需要删除的文件或目录（仅可删除 dest 中的文件或目录） */
  rmBefore?: string[];
  replaceRules?: {
    /** 文件匹配规则，如不存在则表示匹配所有文件 */
    match?: RegExp | string;
    list?: {
      /** 匹配关键词，若为空则忽略 */
      from: RegExp | string;
      /** 替换为 */
      to: string;
    }[];
  }[];
  /** git 同步选项 */
  git?: {
    /** 是否执行 commit */
    commit?: boolean;
    /** 是否执行 rebase。适合多人协作的场景。默认为 true */
    rebase?: boolean;
    /** 是否执行 push */
    push?: boolean;
    /** 是否跳过 git hooks。默认 false */
    noVerify?: boolean;
  };
  /** 要执行的命令列表 */
  cmds?: {
    /** git sync 之前执行的命令 */
    gitBefore?: string[];
    /** git sync 之后执行的命令 */
    gitAfter?: string[];
  };
}

export const syncDefaultOptions: Options = {
  src: process.cwd(),
  dest: resolve(process.cwd(), `../${basename(process.cwd())}-sync`),
  debug: false,
  silent: false,
  exclude: ['/.git/', 'dist', '.nyc', 'node_modules', '.grs.config.js'],
  include: [],
  replaceRules: [
    {
      /** 文件匹配规则，如不存在则表示匹配所有文件 */
      match: null,
      list: [
        {
          /** 匹配关键词，若为空则忽略 */
          from: '',
          /** 替换为 */
          to: '',
        },
      ],
    },
  ],

  /** git 同步选项 */
  git: {
    /** 是否执行 commit */
    commit: true,
    /** 是否执行 rebase。适合多人协作的场景 */
    rebase: true,
    /** 是否执行 push */
    push: true,
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

export class GRS {
  private options = syncDefaultOptions;

  /** 匹配到的文件总个数 */
  totalFiles = 0;

  // constructor() {}

  /** 打印日志 */
  printLog(...args) {
    if (this.options.silent) return;
    if (!args.length) console.log();
    else console.log(color.cyan('[GRS]'), ...args);
  }
  parseOptions(opts = syncDefaultOptions) {
    opts = assign(assign({}, syncDefaultOptions), opts);

    this.options = opts;
    return this.options;
  }

  private fileFilter(pathname = '') {
    const opts = this.options;

    if (!pathname || ['.', '..', "'.."].includes(pathname)) return false;

    pathname = pathname.replace(/\\/g, '/');

    if (opts.exclude.length) {
      const o = opts.exclude.some(rule => rule && new RegExp(rule, 'i').test(pathname));

      if (o) return false;
    }

    if (opts.include.length) {
      return opts.include.some(rule => rule && new RegExp(rule, 'i').test(pathname));
    }

    return true;
  }

  fileCopy(srcFilePath = '', destFilePath = '') {
    const opts = this.options;
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
        content = content.replace(n.from instanceof RegExp ? n.from : new RegExp(n.from, 'gm'), n.to || '');

        if (opts.debug) this.printLog('[sync][debug]content replace:', srcFilePath, n.from, '=>', n.to);
      });
    });
    fs.writeFileSync(destFilePath, content);
    // fs.createReadStream(srcFilePath).pipe(fs.createWriteStream(destFilePath));
  }
  /** 目录递归遍历 */
  private dirSync(dir = '') {
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
    if (!this.fileFilter(dir)) return;

    const opts = this.options;
    const fileList = fs.readdirSync(dir);

    fileList.forEach(name => {
      const fpath = resolve(dir, name);

      if (!this.fileFilter(fpath)) {
        if (opts.debug) this.printLog('file Filtered:', fpath);
        return;
      }

      if (fs.statSync(fpath).isDirectory()) return this.dirSync(fpath);

      const destPath = resolve(opts.dest, fpath.replace(opts.src, opts.dest));
      const destDir = dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        this.printLog('Create directory:', color.cyanBright(destDir));
      }

      this.fileCopy(fpath, destPath);
      this.totalFiles++;
      this.printLog(' - Copy file to:', color.cyan(destPath));
    });
  }

  /** git sync */
  private tryGitSync(opts = syncDefaultOptions) {
    if (!opts.git.commit) return;
    if (opts.debug) this.printLog('Start Git Sync');

    if (!fs.existsSync(resolve(opts.dest, '.git'))) {
      this.printLog(color.yellowBright('Not a git repository.'));
      return;
    }

    const srcChangedList = execSync(`git diff HEAD --name-only`, { cwd: opts.src, encoding: 'utf-8' }).trim();

    if (srcChangedList.length) {
      this.printLog(color.yellowBright('Ignore git commit sync. There are uncommitted changes in the source directory.'));
      return;
    }

    const destChangedList = execSync(`git diff HEAD --name-only`, { cwd: opts.dest, encoding: 'utf-8' }).trim();

    if (!destChangedList.length) {
      this.printLog(color.yellowBright('No file updates'));
      return;
    }

    const latestComment = execSync(`git log --pretty="%s" -1`, { cwd: opts.src, encoding: 'utf-8' }).trim();
    const destComment = execSync(`git log --pretty="%s" -1`, { cwd: opts.dest, encoding: 'utf-8' }).trim();

    if (opts.debug) this.printLog(`\n src:`, latestComment, `\ndest:`, destComment);
    if (latestComment === destComment) {
      this.printLog(color.yellowBright('Ignore git commit sync. The last commitId is the sanme. Ignore git commit sync.'));
      return;
    }

    const gitCmds = [`git add --all`, `git commit -m "${latestComment}"` + (opts.git.noVerify ? ' --no-verify' : '')];
    if (opts.git.rebase) gitCmds.push(`git pull --rebase --no-verify`);
    if (opts.git.push) gitCmds.push(`git push`);

    this.runCmds(gitCmds);
  }
  public runCmds(cmds: string[] = []) {
    if (!Array.isArray(cmds)) cmds = [cmds];
    cmds.forEach(cmd => {
      this.printLog(color.cyanBright(`[RUN CMD]`), color.bold(color.greenBright(cmd)));
      const info = execSync(cmd, { cwd: this.options.dest, encoding: 'utf-8', stdio: this.options.silent ? 'pipe' : 'inherit' });
      if (info) this.printLog(info.trim());
    });
  }
  public sync(opts = syncDefaultOptions) {
    opts = this.parseOptions(opts);

    if (opts.debug) this.printLog('sync options:', opts);

    if (!fs.existsSync(opts.dest)) {
      fs.mkdirSync(opts.dest, { recursive: true });
      this.printLog('Create Dest Dir:', opts.dest);
    } else {
      if (Array.isArray(opts.rmBefore)) {
        opts.rmBefore.forEach(filepath => {
          filepath = resolve(opts.dest, filepath);
          if (!filepath.includes(opts.dest) || !fs.existsSync(filepath)) return;
          try {
            fs.rmSync(filepath, { recursive: true });
            this.printLog(color.green(' - Removed:'), color.red(filepath));
          } catch (e) {
            this.printLog(color.red(' - Failed to try remove file:'), color.cyan(filepath), color.redBright(e.message));
          }
        });
      }
    }

    this.totalFiles = 0;

    this.printLog('start:', color.cyanBright(opts.src), '=>', color.cyanBright(opts.dest));
    this.dirSync(opts.src);
    this.printLog('Done! Sync Total Files:', this.totalFiles);

    this.runCmds(opts.cmds.gitBefore);
    if (this.totalFiles) this.tryGitSync(opts);
    this.runCmds(opts.cmds.gitAfter);

    return this.totalFiles;
  }
}

export const grs = new GRS();

/** 简易的对象深复制 */
export function assign(a, b) {
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
