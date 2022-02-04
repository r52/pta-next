interface Window {
    /**
     * The "Main World" is the JavaScript context that your main renderer code runs in.
     * By default, the page you load in your renderer executes code in this world.
     *
     * @see https://www.electronjs.org/docs/api/context-bridge
     */
    readonly versions: NodeJS.ProcessVersions;
    readonly electron: { readonly appVersion: () => Promise<any>; readonly openBrowser: (url: string) => void; readonly closeWindow: () => void; readonly getConfig: () => Promise<any>; readonly setConfig: (obj: Record<string, unknown>) => Promise<any>; readonly ipcSend: (channel: string, ...args: any[]) => void; readonly ipcOn: (channel: string, func: Function) => void; };
}
