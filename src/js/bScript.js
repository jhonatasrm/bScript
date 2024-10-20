let style, enabled = false;
const prefix = "ujs_bScript";
const none = "{display: none !important;}";

// Get value from localStorage or cookies
const getValue = (name) => {
  if (window.localStorage) {
    return window.localStorage[name] || "";
  } else {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return unescape(cookie.substring(nameEQ.length));
      }
    }
    return "";
  }
};

// Set value in localStorage or cookies
const setValue = (name, value, days) => {
  if (window.localStorage) {
    window.localStorage[name] = value;
  } else {
    const date = new Date();
    date.setTime(date.getTime() + (days || 10 * 365) * 24 * 60 * 60 * 1000);
    if (document.cookie.split(";").length < 30 && document.cookie.length - escape(getValue(name)).length + escape(value).length < 4000) {
      document.cookie = `${name}=${escape(value)}; expires=${date.toGMTString()}; path=/`;
    } else {
      alert(browser.i18n.getMessage("cookies"));
    }
  }
};

// Add style element to the document
const addStyle = (css) => {
  const styleElement = document.createElement("style");
  styleElement.type = "text/css";
  styleElement.style.display = "none !important";
  styleElement.appendChild(document.createTextNode(css));
  return (document.head || document.documentElement).appendChild(styleElement);
};

// Add script element to the document
const addScript = (js) => {
  const scriptElement = document.createElement("script");
  scriptElement.type = "text/javascript";
  scriptElement.style.display = "none !important";
  scriptElement.appendChild(document.createTextNode(js));
  return document.head ? document.head.appendChild(scriptElement) : null;
};

// Replace the content of an existing style element
const replaceStyle = (element, css) => {
  if (element) {
    element.textContent = css;
  }
};

// Split CSS selectors and return them as an array
const splitCss = (css) => {
  return css.match(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/g).map(s => s.trim());
};

// Clear redundant CSS rules
const clearCss = (css) => {
  const selectors = splitCss(css);
  return selectors.filter((rule, i, arr) => !arr.some((r, j) => j !== i && r.startsWith(rule + ">"))).join(",");
};

// Remove specific CSS rules
const delCss = (css, del) => {
  const selectors = splitCss(css);
  if (del) {
    return selectors.filter(s => !del.startsWith(s)).join(",");
  }
  return selectors.slice(0, -1).join(",");
};

// Get specific attributes from an element
const getAttributes = (element, tags) => {
  let result = "";
  const regex = new RegExp(`^(${tags})$`);
  if (element.attributes) {
    for (let attr of element.attributes) {
      const name = attr.nodeName.toLowerCase();
      if (regex.test(name)) {
        result += `[${name}="${attr.nodeValue.replace(/["\\]/g, "\\$&")}"]`;
      }
    }
  }
  return result;
};

// Get nth-child selector
const getNth = (element) => {
  let nth, count = 0, parent = element.parentNode;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes[i];
    if (child.nodeType === 1) {
      count++;
      if (child === element) {
        nth = count;
      }
    }
  }
  return !nth || count < 2 ? "" : `:nth-child(${nth})`;
};

// Get CSS rules based on element attributes
const getCssRules = (element, wide) => {
  let att, tag, result = [];
  while (element && element.nodeType === 1) {
    att = getAttributes(element, "src|href");
    tag = element.nodeName.toLowerCase();
    result.unshift(
      att
        ? `${tag}${wide ? att.replace(/(\[.*?)(=.*\/)[^?#]*(\])/, "$1^$2$3") : att}`
        : `${tag}${getAttributes(element, "id|class|height|width|color|bgcolor|align|type")}${!wide && !/^(html|body)$/i.test(tag) ? getNth(element) : ""}`
    );
    element = element.parentNode;
  }
  return result.join(">");
};

// Set the block style on the page
const setBlockStyle = () => {
  if (document.documentElement instanceof HTMLHtmlElement) {
    const css = getValue(prefix);
    if (css) style = addStyle(css + none);
    return true;
  }
};

// Unblock a previously blocked element
const unblockElement = (latest) => {
  const css = getValue(prefix);
  if (enabled || !style || !css) return;

  const remove = () => {
    document.removeEventListener("click", clickHandler, false);
    document.removeEventListener("keyup", keyupHandler, false);
    enabled = false;
  };

  const clickHandler = (event) => {
    event.preventDefault();
    let currentCss = getValue(prefix);
    let newCss = delCss(currentCss, getCssRules(event.target, false));
    if (newCss === currentCss) newCss = delCss(currentCss, getCssRules(event.target, true));
    if (newCss !== currentCss) setValue(prefix, newCss);
    replaceStyle(style, newCss ? newCss + none : "");
    remove();
  };

  const keyupHandler = (event) => {
    if (event.keyCode === 27) {
      replaceStyle(style, getValue(prefix) ? getValue(prefix) + none : "");
      remove();
    }
  };

  if (latest) {
    const newCss = delCss(css);
    setValue(prefix, newCss);
    replaceStyle(style, newCss ? newCss + none : "");
  } else {
    enabled = true;
    replaceStyle(style, css + "{background-color: red !important; border: 2px solid #FF1111 !important; opacity: 0.7 !important;}");
    document.addEventListener("click", clickHandler, false);
    document.addEventListener("keyup", keyupHandler, false);
  }
};

// Block an element based on user interaction
const blockElement = (wide) => {
  if (enabled) return;

  let element = "", outline = "", border = "", bgColor = "", title = "";
  const reObjects = /^(iframe|object|embed)$/i;

  const remove = () => {
    document.removeEventListener("mouseover", mouseOverHandler, false);
    document.removeEventListener("mouseout", mouseOutHandler, false);
    document.removeEventListener("click", clickHandler, false);
    document.removeEventListener("keyup", keyupHandler, false);
    enabled = false;
  };

  const mouseOverHandler = (event) => {
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

  const mouseOutHandler = () => {
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

  const clickHandler = (event) => {
    if (element) {
      event.preventDefault();
      mouseOutHandler();
      remove();
      const css = getCssRules(element, wide || event.altKey);
      const tmpStyle = addStyle(`${css}{background-color: red !important; border: 1px solid #FF1111 !important; opacity: 0.7 !important;}`);
      const userCss = prompt(browser.i18n.getMessage("blockElementFromThePage"), css);
      if (userCss) {
        const oldCss = getValue(prefix);
        const newCss = clearCss(`${oldCss},${userCss}`);
        setValue(prefix, newCss);
        if (style) {
          replaceStyle(style, newCss + none);
        } else {
          style = addStyle(newCss + none);
        }
      }
      tmpStyle.remove();
    }
  };

  const keyupHandler = (event) => {
    if (event.keyCode === 27) {
      mouseOutHandler();
      remove();
    }
  };

  enabled = true;
  document.addEventListener("mouseover", mouseOverHandler, false);
  document.addEventListener("mouseout", mouseOutHandler, false);
  document.addEventListener("click", clickHandler, false);
  document.addEventListener("keyup", keyupHandler, false);
};

// Keyboard shortcuts to manage blocking and unblocking elements
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.shiftKey) {
    if (e.keyCode === 78) { // Alt + Shift + N
      blockElement();
    } else if (e.keyCode === 88) { // Alt + Shift + X
      unblockElement();
    } else if (e.keyCode === 77) { // Alt + Shift + M
      unblockElement(true);
    }
  }
}, false);