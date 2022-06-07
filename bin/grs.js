#!/usr/bin/env node
// @ts-check

const color = require('console-log-colors').color;
const { program } = require('commander');
const path = require('path');
const pkg = require('../package.json');
const { syncDefaultOptions, grs } = require('../dist');
const fs = require('fs');

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
  .option('--git-commit', '是否同步 git 提交信息')
  .option('--git-rebase', '同步 git 时，是否执行 rebase')
  .option('--git-push', '同步 git 时，是否执行 push')
  .action(opts => {
    if (opts.debug) console.log('CMD args:', opts);

    try {
      const configFile = path.resolve(opts.config || '.grs.config.js');
      const config = require(configFile);
      opts = Object.assign(config, opts);
      if (opts.debug) console.log('require configFile:', configFile, config);
    } catch(e) {
      if (opts.debug) console.log(e.message, e.stack);
    }

    if (Array.isArray(opts.replace)) {
      opts.replaceRules = [];
      opts.replace.forEach(rule => {
        if (!rule || typeof rule !== 'string' || !rule.includes('$$')) return;
        const [from, to = '', match = ''] = rule.split('$$');
        opts.replaceRules.push({
          match,
          list: [{ from, to }]
        });
      });
    }

    if (opts.gitCommit) {
      if (!opts.git) opts.git = {};
      opts.git.commit = true;
      if (opts.gitPush) opts.git.push = true;
      if (opts.gitRebase) opts.git.rebase = true;
    }

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
      const configPath = path.resolve(process.cwd(), name);

      if (fs.existsSync(configPath)) {
        console.log('配置文件已存在：', color.yellowBright(configPath));
        return;
      }

      fs.createReadStream(path.resolve(__dirname, '../.grs.config.sample.js')).pipe(fs.createWriteStream(configPath));
      console.log('配置文件创建成功！路径为：', color.greenBright(configPath));
    } else if (options.get) {
      let name = String(options.name || '.grs.config.js');
      if (!name.endsWith('.js')) name += '.js';
      const configPath = path.resolve(process.cwd(), name);
      const cfg = {};

      if (fs.existsSync(configPath)) {
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
