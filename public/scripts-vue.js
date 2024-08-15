const orgHostName = "https://vuejs.org";

window.addEventListener("load", () => {
  console.log("DOM loaded");

  //add Trademark Symbol after load page
  modifyTextNodes(document.body);

  const config = { subtree: true, childList: true };
  const observerBody = new MutationObserver(callback);

  const targetNode = document.body;
  observerBody.observe(targetNode, config);
});

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

let mutationTimeout;
const callback = function (mutationsList, observer) {
  clearTimeout(mutationTimeout);

  mutationTimeout = setTimeout(() => {
    // console.log("All DOM changes are completed.");
    modifyTextNodes(document.body);
  }, 1500);
};
