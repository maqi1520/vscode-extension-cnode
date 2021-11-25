import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { Topic } from "../view/index";

export class PreviewPanel {
  /**
   * 当前面版只允许打开一次.
   */
  public static currentPanel: PreviewPanel | undefined;

  public static readonly viewType = "cnode-preview";

  private readonly _panel: vscode.WebviewPanel;

  private readonly _extensionUri: vscode.Uri;

  private _topic: Topic;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, topic: Topic) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // 如果已经存在就展示.
    if (PreviewPanel.currentPanel) {
      PreviewPanel.currentPanel._panel.reveal(column);
      PreviewPanel.currentPanel._topic = topic;
      PreviewPanel.currentPanel._update();
      return;
    }

    // 没有创建一个新的 panel.
    const panel = vscode.window.createWebviewPanel(
      PreviewPanel.viewType,
      "CNODE 技术社区",
      column || vscode.ViewColumn.One,
      {
        // 在 webview 允许脚本
        enableScripts: true,

        // 限制 从 media 文件夹加载资源
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "build"),
          vscode.Uri.joinPath(extensionUri, "media"),
        ],
      }
    );

    PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri, topic);
  }

  public static kill() {
    PreviewPanel.currentPanel?.dispose();
    PreviewPanel.currentPanel = undefined;
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    topic: Topic
  ) {
    PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri, topic);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    topic: Topic
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._topic = topic;

    // 设置 webview html 内容
    this._update();

    // 监听 panel 何时被关闭
    // 当用户手动关闭 panel 就会被触发
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    PreviewPanel.currentPanel = undefined;

    // 清除资源
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Uri 将样式加载到 WebView 中

    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "build", "main.css")
    );
    const styleCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "prism-tomorrow.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "prism.js")
    );

    // // Use a nonce  只允许特定脚本
    const nonce = getNonce();

    const content = this._topic.content.replace(
      /\/\/static.cnodejs.org/g,
      "https://static.cnodejs.org"
    );

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleMainUri}" rel="stylesheet">
        <link href="${styleCodeUri}" rel="stylesheet">
        <script nonce="${nonce}">
        setTimeout(()=>{
          window.scrollTo(0,0)
        },0)
        </script>
			</head>
      <body>  
      <div class="markdown-preview">
        <h1>${this._topic.title}</h1>
        <div>${content}</div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
