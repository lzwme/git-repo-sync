#!/usr/bin/env node

import { color } from 'console-log-colors';
import { program } from 'commander';
import { syncDefaultOptions, grs, type Options } from './index';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { resolve } from 'path';

const pkg = require('../package.json');
const startTime = Date.now();

function logEnd() {
  const constTime = Date.now() - startTime;
  console.log(`\n[${color.greenBright(new Date().toTimeString().slice(0, 8))}] Done in ${constTime}ms.`);
}

program
  .aliases(['grs'])
  .version(pkg.version, '-v, --version')
  .description(color.yellow(pkg.description) + ` [version@${color.cyanBright(pkg.version)}]`)
  .option('-s, --silent', '开启静默模式，只打印必要的信息')
  .option('--debug', `开启调试模式`, false)
  .option('-c, --config', `指定配置文件路径。默认为当前目录下 .grs.config.js`)
  .option('-s, --src', '源仓库路径', syncDefaultOptions.src)
  .option('-d, --dest', '输出仓库路径')
  .option('-r, --replace <rules...>', '替换规则，格式：<from>$$<to>$$<filename>')
  .option('--include <rules...>', '文件包含')
  .option('--exclude <rules...>', '文件排除')
  .option('--no-git-commit', '是否不同步 git 提交信息')
  .option('--no-git-rebase', '同步 git 时，是否不执行 rebase')
  .option('--no-git-push', '同步 git 时，是否不执行 push')
  .option('-n, --git-n', '同步 git 时，是否添加 --no-verify 参数')
  .option('--git-after <cmds...>', '同步 git 结束后执行的命令')
  .action((opts: Options & Record<string, any>) => {
    try {
      const configFile = resolve(opts.config || '.grs.config.js');
      const config = require(configFile);
      opts = Object.assign(config, opts);
      if (opts.debug) console.log('require configFile:', configFile, config);
    } catch (e) {
      if (opts.debug) console.log(e.message, e.stack);
    }

    if (Array.isArray(opts.replace)) {
      opts.replaceRules = [];
      opts.replace.forEach(rule => {
        if (!rule || typeof rule !== 'string' || !rule.includes('$$')) return;
        const [from, to = '', match = ''] = rule.split('$$');
        opts.replaceRules!.push({
          match,
          list: [{ from, to }],
        });
      });
    }

    if (!opts.git) opts.git = {};
    if ('gitCommit' in opts) opts.git.commit = opts.gitCommit;
    if ('gitPush' in opts) opts.git.push = opts.gitPush;
    if ('gitRebase' in opts) opts.git.rebase = opts.gitRebase;
    if ('gitN' in opts) opts.git.noVerify = opts.gitN;
    if (Array.isArray(opts.gitAfter)) opts.cmds.gitAfter = opts.gitAfter;

    if (opts.debug) console.log('opts:', opts);
    grs.sync(opts);
    logEnd();
  });

program
  .command('config')
  .description('生成或获取在当前目录下的配置信息')
  .option('-n, --name <configPath>', '配置文件的名称', '.grs.config.js')
  .option('--init', '创建配置文件，若已存在则忽略')
  .option('--get', '创建配置文件')
  .action((options, p) => {
    if (options.init) {
      let name = String(options.name || '.grs.config.js');
      if (!name.endsWith('.js')) name += '.js';
      const configPath = resolve(process.cwd(), name);

      if (existsSync(configPath)) {
        console.log('配置文件已存在：', color.yellowBright(configPath));
        return;
      }

      createReadStream(resolve(__dirname, '../.grs.config.sample.js')).pipe(createWriteStream(configPath));
      console.log('配置文件创建成功！路径为：', color.greenBright(configPath));
    } else if (options.get) {
      let name = String(options.name || '.grs.config.js');
      if (!name.endsWith('.js')) name += '.js';
      const configPath = resolve(process.cwd(), name);
      const cfg = {};

      if (existsSync(configPath)) {
        Object.assign(cfg, require(configPath));
        console.log(color.cyanBright('配置文件信息：\n'), cfg);
      } else {
        console.log(color.yellowBright('没有发现配置文件. 默认配置信息：\n'), syncDefaultOptions);
      }
    } else {
      p.help();
    }
  });

program.parse(process.argv);
