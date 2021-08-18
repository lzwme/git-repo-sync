#!/usr/bin/env node
// @ts-check

const chalk = require('chalk');
const { program } = require('commander');
const path = require('path');
const pkg = require('../package.json');
const { syncDefaultOptions, sync } = require('../lib');

const startTime = Date.now();

function logEnd() {
  const constTime = Date.now() - startTime;
  console.log(`\n[${chalk.greenBright(new Date().toTimeString().slice(0, 8))}] Done in ${constTime}ms.`);
}

program
  .aliases(['grs'])
  .version(pkg.version, '-v, --version')
  .description(chalk.yellow(pkg.description) + ` [version@${chalk.cyanBright(pkg.version)}]`)
  .option('-s, --silent', '开启静默模式，只打印必要的信息')
  .option('--debug', `开启调试模式`, false)
  .option('--silent', `开启调试模式`, false)
  .option('-c, --config', `指定配置文件路径。默认为当前目录下 .grs.config.js`, false)
  .option('-s, --src', '源仓库路径', syncDefaultOptions.src)
  .option('-d, --dest', '输出仓库路径', syncDefaultOptions.dest)
  .option('-r, --replace <rules...>', '替换规则，格式：<from>$$<to>$$<filename>', syncDefaultOptions.dest)
  .option('--include <rules...>', '文件包含')
  .option('--exclude <rules...>', '文件排除')
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

    sync(opts);
    logEnd();
  });

program.parse(process.argv);
