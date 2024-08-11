const hostName = "http://localhost:3000";
const orgHostName = "https://docs.nestjs.com";

window.addEventListener("load", () => {
  console.log("DOM loaded");

  //handle change host-name to proxy host-name on get search result
  watchSearchModalState();

  //change all hostname on page
  const links = document.querySelectorAll("a");
  modifyHostname(links, false);

  //add Trademark Symbol after load page
  modifyTextNodes(document.body);

  let previousUrl = "";
  const observer = new MutationObserver(function (mutations) {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      modifyTextNodes(document.body);
    }
  });
  const config = { subtree: true, childList: true };
  observer.observe(document, config);
});

function watchSearchModalState() {
  // Set up a MutationObserver to watch for class changes on the body
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        if (document.body.className === "DocSearch--active") {
          addOnInputListeners();
        } else {
          // console.log("modal closed");
        }
      }
    });
  });

  observer.observe(document.body, {
    attributes: true, // Watch for attribute changes
    attributeFilter: ["class"], // Only watch for class attribute changes
  });
}

function addOnInputListeners() {
  setTimeout(() => {
    const searchInput = document.getElementById("docsearch-input");
    const resetInput = document.querySelector(".DocSearch-Reset");

    if (searchInput) {
      searchInput.addEventListener("input", debounce(handeSearchOnInput, 1000));
    }

    if (resetInput) {
      resetInput.addEventListener("click", debounce(handeSearchOnInput, 1000));
    }

    //some times - will be resent list
    handeSearchOnInput();
  }, 0);
}

function debounce(callback, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
}

function handeSearchOnInput() {
  setTimeout(() => {
    const parentElement = document.getElementById("docsearch-list");
    const links = document.querySelectorAll("#docsearch-list a");
    const modalContent = document.querySelector(".DocSearch-Modal");

    if (parentElement) {
      modifyHostname(links);
    }

    if (modalContent) {
      modifyTextNodes(modalContent);
    }
  }, 0);
}

function modifyHostname(links, changeWithParams = true) {
  links.forEach((link) => {
    const url = new URL(link.href);

    if (changeWithParams) {
      link.href = url.pathname + url.search + url.hash;
    } else {
      if (url.origin === orgHostName) {
        link.href = hostName + url.pathname + url.search + url.hash;
      }
    }
  });
}

function addTrademarkSymbolTo6LetterWords(text) {
  return text.replace(/\b\w{6}\b/g, "$&™");
}

function modifyTextNodes(rootElement) {
  rootElement.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (
        node.parentNode.nodeName !== "SCRIPT" &&
        node.parentNode.nodeName !== "STYLE"
      ) {
        processTextNodes(node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      modifyTextNodes(node);
    }
  });
}

function processTextNodes(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const trimmedText = node.textContent.trim();
    if (!trimmedText.includes("™")) {
      node.textContent = addTrademarkSymbolTo6LetterWords(node.textContent);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    node.childNodes.forEach(processTextNodes);
  }
}
