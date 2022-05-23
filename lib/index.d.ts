export interface Options {
    src: string;
    dest: string;
    debug: boolean;
    silent: boolean;
    exclude: (string | RegExp)[];
    include: any[];
    replaceRules: {
        /** 文件匹配规则，如不存在则表示匹配所有文件 */
        match: RegExp | string;
        list: {
            /** 匹配关键词，若为空则忽略 */
            from: string;
            /** 替换为 */
            to: string;
        }[];
    }[];
    /** git 同步选项 */
    git: {
        /** 是否执行 commit */
        commit: boolean;
        /** 是否执行 rebase。适合多人协作的场景 */
        rebase: boolean;
        /** 是否执行 push */
        push: boolean;
        /** 是否跳过 git hooks。默认 false */
        noVerify: boolean;
    };
    /** 要执行的命令列表 */
    cmds: {
        /** git sync 之前执行的命令 */
        gitBefore: string[];
        /** git sync 之后执行的命令 */
        gitAfter: string[];
    };
}
export declare const syncDefaultOptions: Options;
export declare class GRS {
    private options;
    /** 匹配到的文件总个数 */
    totalFiles: number;
    /** 打印日志 */
    printLog(...args: any[]): void;
    parseOptions(opts?: Options): Options;
    fileFilter(name?: string): boolean;
    fileCopy(srcFilePath?: string, destFilePath?: string): void;
    /** 目录递归遍历 */
    dirSync(dir?: string): void;
    /** git sync */
    tryGitSync(opts?: Options): void;
    runCmds(cmds?: any[]): void;
    sync(opts?: Options): number;
}
