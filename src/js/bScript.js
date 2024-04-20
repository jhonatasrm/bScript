var style,
  _style,
  enabled = false,
  prefix = "ujs_bScript",
  none = "{display: none !important;}";

var getValue = function (name) {
  if (window.localStorage) {
    return window.localStorage[name] || "";
  } else {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0, c; (c = ca[i]); i++) {
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0)
        return unescape(c.substring(nameEQ.length, c.length));
    }
    return "";
  }
};

var setValue = function (name, value, days) {
  if (window.localStorage) {
    window.localStorage[name] = value;
  } else {
    var date = new Date();
    date.setTime(date.getTime() + (days || 10 * 365) * 24 * 60 * 60 * 1000);
    if (
      document.cookie.split(";").length < 30 &&
      document.cookie.length -
        escape(getValue(name)).length +
        escape(value).length <
        4000
    ) {
      document.cookie =
        name +
        "=" +
        escape(value) +
        "; expires=" +
        date.toGMTString() +
        "; path=/";
    } else {
      alert(browser.i18n.getMessage("cookies"));
    }
  }
};

var addStyle = function (css) {
  var s = document.createElement("style");
  s.setAttribute("type", "text/css");
  s.setAttribute("style", "display: none !important;");
  s.appendChild(document.createTextNode(css));
  return (
    document.getElementsByTagName("head")[0] || document.documentElement
  ).appendChild(s);
};

var addScript = function (css) {
  var s = document.createElement("script");
  s.setAttribute("type", "text/javascript");
  s.setAttribute("style", "display: none !important;");
  s.appendChild(document.createTextNode(css));
  if (document.getElementsByTagName("head").length) {
    return document.getElementsByTagName("head")[0].appendChild(s);
  }
};

var replaceStyle = function (element, css) {
  if (element) {
    if (element.firstChild) element.removeChild(element.firstChild);
    element.appendChild(document.createTextNode(css));
  }
};

var splitCss = function (css) {
  var rez = [];
  css.replace(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/g, function (s, m) {
    rez.push(m.replace(/^\s+|\s+$/g, ""));
  });
  return rez;
};

var clearCss = function (css) {
  var a = splitCss(css);
  for (var i = a.length - 1; i >= 0; i--) {
    var rule = a[i] + ">";
    for (var j = a.length - 1; j >= 0; j--) {
      if (a[j].indexOf(rule) == 0) a.splice(j, 1);
    }
  }
  return a.join(",");
};

var delCss = function (css, del) {
  var a = splitCss(css);
  if (del) {
    for (var i = a.length - 1; i >= 0; i--) {
      if (del.indexOf(a[i]) == 0) a.splice(i, 1);
    }
  } else {
    a.pop();
  }
  return a.join(",");
};

var getAtt = function (element, tags) {
  var rez = "";
  if (element.attributes) {
    var r = new RegExp("^(" + tags + ")$");
    for (var i = 0, a; (a = element.attributes[i]); i++) {
      var n = a.nodeName.toLowerCase();
      if (r.test(n))
        rez +=
          "[" +
          n +
          "=\x22" +
          a.nodeValue.replace(/[\x22\x5C]/g, "\\$&") +
          "\x22]";
    }
  }
  return rez;
};

var getNth = function (element) {
  var nth,
    n = 0,
    p = element.parentNode;
  for (var i = 0, c; (c = p.childNodes[i]); i++) {
    if (c.nodeType == 1) {
      n++;
      if (c == element) nth = n;
    }
  }
  return !nth || n < 2 ? "" : ":nth-child(" + nth + ")";
};

var getCssRules = function (element, wide) {
  var att,
    tag,
    rez = [];
  while (element) {
    if (element.nodeType == 1) {
      att = getAtt(element, "src") || getAtt(element, "href");
      tag = element.nodeName;
      if (att) {
        rez.unshift(
          tag +
            (wide
              ? att.replace(/^(\[\w+)(=\x22[^?#]+\/).*(\x22\])$/, "$1^$2$3")
              : att)
        );
        break;
      } else {
        rez.unshift(
          tag +
            getAtt(element, "id|class|height|width|color|bgcolor|align|type") +
            (wide || /^(html|body)$/i.test(tag) ? "" : getNth(element))
        );
      }
    }
    element = element.parentNode;
  }
  return rez.join(">");
};

var setBlockStyle = function () {
  if (document.documentElement instanceof HTMLHtmlElement) {
    var css = getValue(prefix);
    if (css) style = addStyle(css + none);
    return true;
  }
};

function unblockElement(latest) {
  var css = getValue(prefix);
  if (enabled || !style || !css) return;
  var remove = function () {
    document.removeEventListener("click", click, false);
    document.removeEventListener("keyup", press, false);
    enabled = false;
  };

  var click = function (event) {
    event.preventDefault();
    var oldCss = getValue(prefix);
    var css = delCss(oldCss, getCssRules(event.target, false));
    if (css == oldCss) css = delCss(oldCss, getCssRules(event.target, true));
    if (css != oldCss) setValue(prefix, css);
    replaceStyle(style, css ? css + none : "");
    remove();
  };

  var press = function (event) {
    if (event.keyCode == 27) {
      var css = getValue(prefix);
      replaceStyle(style, css ? css + none : "");
      remove();
    }
  };

  if (latest) {
    css = delCss(css);
    setValue(prefix, css);
    replaceStyle(style, css ? css + none : "");
  } else {
    enabled = true;
    replaceStyle(
      style,
      css +
        "{background-color: red !important; border: 2px solid #FF1111 !important; opacity: 0.7 !important;}"
    );
    document.addEventListener("click", click, false);
    document.addEventListener("keyup", press, false);
  }
}

function blockElement(wide) {
  if (enabled) return;
  var element = "",
    outline = "",
    border = "",
    bgColor = "",
    title = "",
    reObjects = /^(iframe|object|embed)$/i;

  var remove = function () {
    document.removeEventListener("mouseover", over, false);
    document.removeEventListener("mouseout", out, false);
    document.removeEventListener("click", click, false);
    document.removeEventListener("keyup", press, false);
    enabled = false;
  };

  var over = function (event) {
    element = event.target;
    title = element.title;
    if (reObjects.test(element.nodeName)) {
      border = element.style.border;
      element.style.border = "2px solid #306EFF";
    } else {
      outline = element.style.outline;
      element.style.outline = "1px solid #306EFF";
      bgColor = element.style.backgroundColor;
      element.style.backgroundColor = "#C6DEFF";
    }
  };

  var out = function () {
    if (element) {
      element.title = title;
      if (reObjects.test(element.nodeName)) {
        element.style.border = border;
      } else {
        element.style.outline = outline;
        element.style.backgroundColor = bgColor;
      }
    }
  };

  var click = function (event) {
    if (element) {
      event.preventDefault();
      out();
      remove();
      var css = getCssRules(element, wide || event.altKey);
      var tmpCss = addStyle(
        css +
          "{background-color: red !important; border: 1px solid #FF1111 !important; opacity: 0.7 !important;}"
      );
      css = prompt(browser.i18n.getMessage("blockElementFromThePage"), css);
      if (css) {
        var oldCss = getValue(prefix);
        if (oldCss) css = clearCss(oldCss + "," + css);
        setValue(prefix, css);
        if (style) {
          replaceStyle(style, css + none);
        } else {
          style = addStyle(css + none);
        }
      }
      tmpCss.parentNode.removeChild(tmpCss);
    }
  };

  var press = function (event) {
    if (event.keyCode == 27) {
      out();
      remove();
    }
  };

  enabled = true;
  document.addEventListener("mouseover", over, false);
  document.addEventListener("mouseout", out, false);
  document.addEventListener("click", click, false);
  document.addEventListener("keyup", press, false);
}

document.addEventListener(
  "keydown",
  function (e) {
    if (e.altKey && e.shiftKey && e.keyCode === 78) { // Alt + Shift + N
      // block element
      blockElement();
    } else if (e.altKey && e.shiftKey && e.keyCode === 88) { // Alt + Shift + X
      // see blocked elements
      unblockElement();
    } else if (e.altKey && e.shiftKey && e.keyCode === 77) { // Alt + Shift + M
      // undo block element
      unblockElement(true);
    }
  },
  false
);