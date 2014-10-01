# Wysiwiger

誰でも簡単に、オリジナルのWysiwyg(リッチ・見たまま編集)エディタをつくることができます。

## Description(説明)

Wysiwygerは、デザインと機能のカスタマイズに特化したWysiwygエディタエンジンです。
HTMLと少しのJavaScriptを書くだけで、デザイン・機能をフルカスタマイズしたWysiwygエディタを作成することができます。

[デモページ](http://takashibagura.github.io/wysiwyger/)で、Wysiwygerで作られたエディタのデモが見られます。

## Feature(特徴)

* HTMLの知識だけで設置可能
* 任意のHTML要素を挿入できるメニューを容易に作成可能
* ブラウザ毎の挙動の差異を吸収

## Requirements

* jQuery1.8+

## Usage(使い方)

### Download(ダウンロード)

以下のリンクからZipをダウンロードできます。

[Download Wysiwyger](https://github.com/takashibagura/wysiwyger/zipball/master)

または、boswerからインストールできます。

```
bowser install wysiwyger
```

### Instration(インストール)

jQueryの後にscriptタグで読み込ませてください。

```
<script src="/path/to/wysiwyger.js"></script>
```

### Basic setup(基本的な設置方法)

エディタの元となるHTMLに専用のデータ属性(`data-wg-*`)を追加するだけで動作します。

```
<div data-wg-role="editor">
  <button type="button" class="btn btn-default" value="bold" data-wg-role="menu-item" data-wg-command="bold" />
  <button type="button" class="btn btn-default" value="underline" data-wg-role="menu-item" data-wg-command="underline" />
  <button type="button" class="btn btn-default" value="hr" data-wg-role="menu-item" data-wg-command="hr"/>
  <div contenteditable="true" data-wg-role="wysiwyg"></div>
  <textarea data-wg-role="html"></textarea>
</div>
```

### デザインのカスタマイズ

WysiwygerはUIを提供しません。ボタンやエディタの大きさ等のUIはCSSを使って自由に作り込むことができます。
Twitter Bootstrap等の既存のCSSフレームワークとの組み合わせも簡単です。Bootstrapと組み合わせたエディタのサンプルは[デモページ](http://takashibagura.github.io/wysiwyger/)にあります。

### Wysiwygerデータ属性一覧

#### ロール属性(data-wg-role)

Wysiwygerでは、ロール属性(`data-wg-role`)で要素の役割を指定します。
ロールには以下の5つがあります。

| ロール名    | 説明 |
|:-----------|:-----------|
| editor     | エディタのコンテナとなる要素です。他の全てのロールはこの要素の子要素でなければなりません。`<div>`要素推奨。|
| wysiwyg | エディタ本体。`data-wg-role=editor`の子要素である必要があります。`<div>`要素推奨。|
| html | Wysiwygエディタの内容がHTMLとして反映されるテキストエリア。初期化時、このテキストエリアの内容がWysiwygエディタに反映されます。htmlロールを持つのは`<textarea>`でなければいけません。また、`data-wg-role=editor`の子要素である必要があります。|
| menu-item | 編集メニュー(太字にする、フォントサイズを変える…など)。|
| menu-group | 選択式のメニューを作成する場合に指定。|

### 編集メニューのカスタマイズ

`data-wg-role="menu-item"`ロールが指定された要素がもつ編集機能を`data-wg-command`属性よって指定できます。

| コマンド名   | 説明                     |
|:-----------|:-------------------------|
| header1    | 現在の行を見出し1`<h1>`にする|
| header2    | 現在の行を見出し2`<h2>`にする|
| header3    | 現在の行を見出し3`<h3>`にする|
| header4    | 現在の行を見出し4`<h4>`にする|
| header5    | 現在の行を見出し5`<h5>`にする|
| header6    | 現在の行を見出し6`<h6>`にする|
| blockquote | 現在の行を引用ブロックにする|
| unformat   | 現在の行のフォーマットを解除する|
| bold       | 選択している文字を太字にする |
| underline  | 選択している文字に下線を引く |
| ul         | 選択している行をリストにする |
| ol         | 選択している行を番号リストにする |
| hr         | 区切り線を引く |
| fontColor  | フォントの色を設定する。設定値は`data-wg-value`の値。 |
| fontSize   | フォントの大きさを設定する。設定値は`data-wg-value`の値。
| link       | リンクを挿入する。設定されるURLは`data-wg-value`または`data-wg-input`で指定されたIDの`<input>`要素のvalue。 |
| image      | 画像を挿入する。設定される画像URLは`data-wg-value`または`data-wg-value`または`data-wg-input`で指定されたIDの`<input>`要素のvalue。 |

### 選択式メニューの作り方

例えばフォントサイズの指定など、選択式のメニューからスタイルを選ばせたい場合は、`menu-group`ロールを使います。

```
<select data-wg-role="menu-group">
  <option data-wg-role="menu-item" data-wg-command="fontSize" data-wg-value="6">フォントサイズ:大</option>
  <option data-wg-role="menu-item" data-wg-command="fontSize" data-wg-value="3">フォントサイズ:中</option>
  <option data-wg-role="menu-item" data-wg-command="fontSize" data-wg-value="1">フォントサイズ:小</option>
</select>
```

### 編集コマンドの追加

新しいコマンドを追加するのはとても簡単です。例として、現在行を`<div class="enclose">`で囲むメニューボタンをつくってみます。

wysywyger.jsを読み込んだ後で、以下のようにJavaScriptで新しいコマンドを追加できます。

```
<script type="text/javascript">
  Wysiwyger.setCommand("enclose", "<div class="enclose">");
</script>

```

追加したコマンドは、HTMLから、`data-wg-command="enclose"`として指定できます。

```
<button type="button" class="btn btn-default" value="hr" data-wg-role="menu-item" data-wg-command="enclose"/>
```

### さらに高度なコマンドのカスタマイズ

`Wysiwyger.setCommand`には、以下のようにコールバック関数を設定することができます。

```
  Wysiwyger.setCommand("myCommand", function (wysiwyg) {
	// Do something.
  });

```

コールバック関数の実行時、`this`にはイベントのトリガーとなったmenu-item要素が、第一引き数には`data-wg-role="wysiwyg"`要素が入ります。これにより、エディタ内のDOMに対して任意の操作を行うことが可能です。

## ライセンス

Wysiwygerは[MIT License](http://www.opensource.org/licenses/MIT)の元に配布します。
