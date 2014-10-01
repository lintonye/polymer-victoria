/*!
 * Wysisyger v0.3
 * http://takashibagura.github.io/wysiwyger/
 *
 * Copyright (c) 2014 takashibagura
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/MIT
 *
 */
(function (w, undefined) {
  var DISALLOW_NEST_TAGS = ["blockquote", "h1", "h2", "h3", "h4", "h5", "h6"].join(",");
  var LINE_LEVEL_TAGS = ["blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "p"].join(",");

  var d = w.document;
  var isIE = (function () {
        return (w.navigator.userAgent.toLowerCase().indexOf('msie') != -1);
      }());

  var tagWhiteList =  ["b", "a", "br", "font", "p", "blockquote", "strong", "h1", "h2", "h3", "h4", "h5", "h6", "u", "ul", "li", "ol", "hr", "img", "span", "address"];
  var attributeWhiteList =  ["href", "target", "color", "src"];

  var Html = {
    sanitizeHTML: function (html, ngTags) {
      if (!html) { return ""; }
      var defaultNgTags = ["script", "iframe"];
      if (!$.isArray(ngTags)) {
        ngTags = defaultNgTags;
      }
      var div = d.createElement("div");
      div.innerHTML = html;
      $.each(ngTags, function (tag) {
        var targets = div.getElementsByTagName(tag);
        $.each(targets, function (elm) {
          div.removeChild(elm);
        });
      });
      return div.innerHTML;
    },
    br: function (str) {
      if (!str) { return ""; }
      return str.replace(/\r\n|\r|\n/g, "<br>");
    }
  };

  var Selection = {
    getSelection: function () {
      return w.getSelection ? w.getSelection() : d.selection;
    },
    getRange: function () {
      var selection = this.getSelection();
      if (selection.rangeCount) {
        return selection.getRangeAt(0);
      } else if (selection.createRange) { // For IE
        return d.selection.createRange();
      }
      return null;
    },
    _setNewRange: function(range) {
        if (!range) { return; }
        var selection = this.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    },
    moveCaret: function (elem, index) {
        var r = this.getRange();
        r.setStart(elem, index);
        r.setEnd(elem, index);
        this._setNewRange(r);
    },
    moveCaretAfter: function (elem) {
        var r = this.getRange(),
            endOffset = elem.childNodes.length;
        r.setStart(elem, endOffset);
        r.setEnd(elem, endOffset);
        this._setNewRange(r);
    },
    moveCaretBefore: function (elem) {
        var r = this.getRange();
        r.setStartBefore(elem);
        r.setEndBefore(elem);
        this._setNewRange(r);
    },
    save: function () {
        var r = this.getRange();
        this.tempRange = r;
    },
    load: function () {
        this._setNewRange(this.tempRange);
    }
  };

  var UI = {
    updateMemuItemStatus: function($container) {
      if (!Selection.getSelection().anchorNode) {
        return;
      }
      $container.find("[data-wg-role=menu-item]").removeClass("active");
      var expectedTags = Array.prototype.join.call(Object.keys(TAGS_COMMANDS_MAP));
      var $parents = $(Selection.getSelection().anchorNode).parents("div[data-wg-role=editor] *").filter(expectedTags);
      $parents.each(function () {
        var currentApplyed = TAGS_COMMANDS_MAP[this.tagName.toLowerCase()];
        if (currentApplyed) {
          var $applyedBtn = $container.find("[data-command=" + currentApplyed + "]");
          $applyedBtn.addClass("active");
        }
      });
    }
  };

  var Editor = {

    newline: function () {
      var $anchorNode = $(Selection.getSelection().anchorNode);
      var br = d.createElement("br");
      $anchorNode.before(br);
      $anchorNode.remove();
      Selection.moveCaret(br, 0);
    },

    unionBlock: function($base, $append) {
      if (!$base.is("blockquote, div")) {
        return;
      }
      var br = d.createElement("br");
      $base.append(br).append($append.html());
      $append.remove();
      Selection.moveCaret(br.nextSibling, 0);
    },

    formatHTML: function (html) {
      if (!html) { return null; }
      var result = html.replace(/<div><br\/?><\/div>/g, "<br>"); // for Chrome, Safari
      result = result.replace(/<p><\/p>/g, "<br>");
      result = result.replace(/<p><br\/?><\/p>/g, "<br>");
      return result;
    },

    syncWysiwygToHTML: function (wysiwygBody) {
      var $wysiwygBody = $(wysiwygBody);
      var content = Editor.formatHTML($wysiwygBody.html());
      $wysiwygBody.closest("[data-wg-role=editor]").find("[data-wg-role=html]").val(content);
    },

    syncHTMLToWysiwyg: function (htmlBody) {
      var $htmlBody = $(htmlBody);
      var $container = $htmlBody.closest("[data-wg-role=editor]");
      var $wysiwygBody = $container.find("[data-wg-role=wysiwyg]");
      var html = Html.sanitizeHTML($htmlBody.val());
      $wysiwygBody.html(html);
      this.cleanup($wysiwygBody[0]);
    },

    replaceElement: function (target, replacement) {
      var $target = target,
          $replaceElement = replacement.html($target.html());
      $target.replaceWith($replaceElement);
      Selection.moveCaretAfter($replaceElement[0]);
    },

    _cleanupNestedBlock: function ($targetNode, $wrapNode, count) {
      var $parent = $targetNode.parent(),
          text = $targetNode.html();
      if ($parent.is(DISALLOW_NEST_TAGS)) {
        count++;
        Editor._cleanupNestedBlock($parent, $wrapNode, count);
        return;
      }
      if (text && count > 1) {
        // 入れ子を解消する
        $targetNode.find(DISALLOW_NEST_TAGS).append("<br>").contents().unwrap();
        text = $targetNode.html();
        $wrapNode.html(text);
        $targetNode.replaceWith($wrapNode);
        Selection.moveCaretAfter($wrapNode[0]);
      }
    },

    _cleanupTags: function (targetNode) {
      var that = this,
          $target = $(targetNode),
          $children = $target.children();
      if ($children.length > 0) {
        // Cleanup child nodes recursively.
        $children.each(function () {
          that._cleanupTags(this);
        });
      }
      if ($target.is("[data-wg-role=wysiwyg]")) {
        if (!$target.html()) {
          $target.html("<p>&nbsp;</p>");
        }
      }
      if ($target.is("a")) {
        if (!$target.html()) { $target.remove(); }
      }
      if (!$target.is("div[data-wg-role=wysiwyg]") && $target.is(":not(" + tagWhiteList.join(",") + ")")) {
        var $replacement = $target.contents(),
            text = $target.text();
        // divタグはpタグに置換
        if ($target.is("div")) {
          if ($target.parent("div[data-wg-role=wysiwyg]").length > 0 || $target.parent("div, p").length === 0) {
            $replacement = $("<p>").html($target.html());
          }
        }
        if ($replacement.length > 0) {
          $target.replaceWith($replacement);
          if ( !text ) { Selection.moveCaretAfter($replacement[0]); }
        } else {
          Selection.moveCaretBefore($target[0]);
          $target.remove();
        }
      }
    },

    _cleanupAttributes: function (wysiwygBody) {
      var $wysiwygBody = $(wysiwygBody);
      // 許可しない属性は全て取り除く
      $wysiwygBody.find(tagWhiteList.join(",")).each(function (i) {
        var $target = $(this), attrs = this.attributes, removeAttrs = [];
        for (var index = 0,  len = attrs.length; index < len; index++) {
          var attr = attrs[index];
          if ($.inArray(attr.name, attributeWhiteList) < 0) {
            removeAttrs.push(trim(attr.name));
          }
        }
        if (removeAttrs.length > 0) {
          try {
            $target.removeAttr(removeAttrs.join(" "));
          } catch (e) {}
        }
      });
    },

    cleanup: function (wysiwygBody) {
      var $wysiwygBody = $(wysiwygBody),
          $anchorNode = $(Selection.getSelection().anchorNode);
      this._cleanupTags(wysiwygBody);
      this._cleanupAttributes(wysiwygBody);
      this._cleanupNestedBlock($anchorNode, $anchorNode.parent(), 0);
    },

    executeCommand: function (command, menuItem, wysiwygBody) {
      var $wysiwygBody = $(wysiwygBody);
      if ($.isFunction(command)) {
        command.call($(menuItem), $wysiwygBody);
      } else {
        var $anchorNode = $(Selection.getSelection().anchorNode),
            bareTagName = null;
        if (command.value) {
          bareTagName = command.value.replace(/[<|>]/g, "");
        }
        if (LINE_LEVEL_TAGS.indexOf(bareTagName) > -1) {
          // 新しいタグに置換する
          if ($anchorNode.is(LINE_LEVEL_TAGS)) {
            Editor.replaceElement($anchorNode, $(command.value));
          } else {
            // For mozilla
            if ($anchorNode.parent().is(LINE_LEVEL_TAGS)) {
              Editor.replaceElement($anchorNode.parent(), $(command.value));
            } else { d.execCommand(command.name, false, command.value); }
          }
        } else {
          d.execCommand(command.name, false, command.value);
        }
        Editor.cleanup($wysiwygBody[0]);
      }
    },

    _getCommandValue: function (menuItem) {
      var $menuItem = $(menuItem);
      if ($menuItem.is("[data-wg-input]")) {
        return $("#" + $menuItem.data("wg-input")).val();
      }
      return $menuItem.data("wg-value");
    },

    insertLink: function (wysiwygBody) {
      d.execCommand("createLink", false, Editor._getCommandValue(this));
    },

    insertImage: function (wysiwygBody) {
      d.execCommand("insertImage", false, Editor._getCommandValue(this));
    },

    setFontColor: function (wysiwygBody) {
      d.execCommand("foreColor", false, Editor._getCommandValue(this));
    },

    setFontSize: function(wysiwygBody) {
      d.execCommand("fontSize", false, Editor._getCommandValue(this));
    },

    onEnter: function (wysiwygBody) {
      var $wysiwygBody = $(wysiwygBody);
      // Chrome, Safari
      w.setTimeout(function () {
        var $anchorNode = $(Selection.getSelection().anchorNode), tagName;
        // Chrome, Safariでh6末尾で改行後、h6要素が続いてしまう問題に対応
        if ($anchorNode.is("h6") && !$anchorNode.text()) {
          Editor.newline();
        // 一部のブロック要素が改行するたびに増えていく問題に対応
        } else if ($anchorNode.is("blockquote, div") && !$anchorNode.is("[data-wg-role=wysiwyg]")) {
          tagName = $anchorNode[0].tagName;
          // 末尾で改行した場合抜ける
          if ($anchorNode[0].childNodes.length === 1 && $anchorNode[0].childNodes[0].tagName === "BR") {
            Editor.newline();
          } else {
            Editor.unionBlock($anchorNode.prev(tagName), $anchorNode);
          }
        // 中で改行した場合、抜けずに内部で改行する
        } else if ($anchorNode.parent().is("blockquote, div") && !$anchorNode.parent().is("[data-wg-role=wysiwyg]")) {
          tagName = $anchorNode.parent()[0].tagName;
          Editor.unionBlock($anchorNode.parent().prev(tagName), $anchorNode.parent());
        }
        // Safari等でリストを抜けた後に何故か太字になる問題に対応
        if ($anchorNode.is("b") && $anchorNode.parent().parent().prev().is("ul, ol")) {
          $anchorNode.contents().unwrap();
        }
        var $parentNode = $anchorNode.closest(DISALLOW_NEST_TAGS);
        if ($parentNode.length > 0 && $parentNode.is("[data-wg-role=wysiwyg] *")) {
          // キャレットの位置合わせ
          w.setTimeout(function () {
            Selection.moveCaretAfter($parentNode[0]);
          }, 100);
        }
      }, 100); // keydown直後だとキャレット位置のanchorNodeが取得できないため遅延させる
    },

    onBackspace: function (wysiwygBody) {
      var $anchorNode = $(Selection.getSelection().anchorNode),
          $block = $anchorNode.closest("blockquote, h1, h2, h3, h4, h5, h6");
      // For Safari, Chrome
      if ($block.length > 0) {
        if ($block.html() == "<br>") {
          var $replacement = $("<p>").append("<br>");
          $block.replaceWith($replacement);
          Selection.moveCaretAfter($replacement[0]);
          return;
        }
      }
      // For IE
      if ($anchorNode.is("blockquote, h1, h2, h3, h4, h5, h6") && $anchorNode[0].childNodes.length === 0) {
        var $caretTarget = $anchorNode.prev();
        $anchorNode.remove();
        if ($caretTarget.length > 0) {
          Selection.moveCaretAfter($caretTarget[0]);
        }
      }
    }
  };

  function trim(str) {
    if (!str) { return ""; }
    return str.replace(/^[¥s　]+|[¥s　]+$/, "");
  }

  var commands = {
    bold: { name: "bold" },
    underline: { name: "underline" },
    header1: { name: "formatBlock", value: "<h1>" },
    header2: { name: "formatBlock", value: "<h2>" },
    header3: { name: "formatBlock", value: "<h3>" },
    header4: { name: "formatBlock", value: "<h4>" },
    header5: { name: "formatBlock", value: "<h5>" },
    header6: { name: "formatBlock", value: "<h6>" },
    blockquote: { name: "formatBlock", value: "<blockquote>" },
    ul: { name: "insertUnorderedList" },
    ol: { name: "insertOrderedList" },
    hr: { name: "insertHorizontalRule" },
    unformat: { name: "formatBlock", value: "<p>" },
    link: Editor.insertLink,
    image: Editor.insertImage,
    fontColor: Editor.setFontColor,
    fontSize: Editor.setFontSize
  };

  var TAGS_COMMANDS_MAP = {
    b: "bold",
    strong: "bold",
    u: "underline",
    a: "link",
    h1: "header1",
    h2: "header2",
    h3: "header3",
    h4: "header4",
    h5: "header5",
    h6: "header6",
    ul: "ul",
    ol: "ol",
    hr: "hr",
    blockquote: "blockquote"
  };

  // 初期化処理
  function initialize() {
    var $editors = $("[data-wg-role=editor]");
    $editors.each(function () {
      var $wysiwygBody = $(this).find("[data-wg-role=wysiwyg]"),
          $htmlBody = $(this).find("[data-wg-role=html]");
      if ($wysiwygBody.length > 0) {
        $wysiwygBody.attr("contenteditable", true);
      }
      if ($htmlBody.length > 0) {
        Editor.syncHTMLToWysiwyg($htmlBody[0]);
      }
    });
  }

  function handleMenuItem(menuItem) {
    var $menuItem = $(menuItem),
        command = commands[$menuItem.data("wg-command")];
    if (!command) { return; }
    Selection.load();
    var $container = $menuItem.closest("[data-wg-role=editor]");
    var $wysiwygBody = $container.find("[data-wg-role=wysiwyg]");
    Editor.executeCommand(command, menuItem, $wysiwygBody[0]);
    UI.updateMemuItemStatus($container);
  }

  /* イベント設定 */
  function initEvents() {
    // ボタンを押した際に選択がエディタから外れてしまうのを防ぐ
    $(document).on("mousedown", "[data-wg-role=menu-item]",  function (e) {
      e.preventDefault();
    });

    // Click menu item
    $(document).on("click", "[data-wg-role=menu-item]",  function (e) {
      handleMenuItem(this);
      if ($(this).is("not:input")) {
        e.preventDefault();
      }
    });

    // Change menu group selection
    $(document).on("change", "[data-wg-role=menu-group]",  function (e) {
      handleMenuItem($("option:selected", this)[0]);
    });

    // menu-itemのステータスきりかえ
    $(document).on("mousedown keydown", "[data-wg-role=wysiwyg]", function (e) {
      var $container = $(this).parent("[data-wg-role=editor]");
      w.setTimeout(function () {
        UI.updateMemuItemStatus($container);
      }, 100);// keydown直後だとキャレット位置のanchorNodeが取得できないため遅延させる
    });

    // エディタ内でキーを押したときの動作
    $(document).on("keydown", "[data-wg-role=wysiwyg]", function (e) {
      if (e.keyCode === 13 && !e.shiftKey) { // Enter
        Editor.onEnter(this);
      } else if (e.keyCode === 8) { // Backspace
        Editor.onBackspace(this);
      }
    });

    // HTMLエディタのフォーカスアウト時に、内容をWysiwygエディタに反映
    $(document).on("focus blur", "textarea[data-wg-role=html]", function (e) {
      Editor.syncHTMLToWysiwyg(this);
    });

    // Wysiwygエディタのフォーカスアウト時に、内容をtextareaに反映
    $(document).on("blur", "div[data-wg-role=wysiwyg]", function (e) {
      Selection.save(); //現在のセレクションを保存
      Editor.syncWysiwygToHTML(this);
    });

    $(document).on("keydown mousedown", "div[data-wg-role=wysiwyg]", function (e) {
      var that = this;
      w.setTimeout(function () { Editor.cleanup(that); }, 100);
    });
  }

  // 外部公開モジュール
  w.Wysiwyger = {
    // カスタムコマンドの設定
    setCommand: function(name, command) {
      if ($.isFunction(command)) {
        commands[name] = command;
      } else {
        commands[name] = function (wysiwygBody) {
          var $wysiwygBody = $(wysiwygBody);
          var dummyCommand = { name: "formatBlock", value: "<address>"};
          Editor.executeCommand(dummyCommand, this, wysiwygBody);
          var $replaceTarget = $wysiwygBody.find("address");
          var $insertElement = $(command).html($replaceTarget.html());
          var tagName = $insertElement[0].tagName;
          // まだタグホワイトリストに入っていなければ追加
          if (tagWhiteList.indexOf(tagName) < 0) {
            tagWhiteList.push(tagName);
          }
          // まだ属性ホワイトリストに入っていなければ追加
          $.each($insertElement[0].attributes, function (a) {
            if (attributeWhiteList.indexOf(a.name) < 0) {
              attributeWhiteList.push(a.name);
            }
          });
          $replaceTarget.replaceWith($insertElement);
          Selection.moveCaretAfter($insertElement[0]);
        };
      }
    }
  };

  if (isIE) {
    // IEの場合、formatBlockがblockquoteに対応していないため、カスタムコマンドとして再定義
    Wysiwyger.setCommand("blockquote", "blockquote");
  }

  initEvents();

  $(function () {
    initialize();
  });

}(window));
