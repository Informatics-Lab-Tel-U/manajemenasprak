export function normalizeTiptapContent(doc: any) {
  if (!doc || typeof doc !== 'object') return doc;

  const cloned = JSON.parse(JSON.stringify(doc));

  function traverse(node: any) {
    if (node.marks && Array.isArray(node.marks)) {
      node.marks.forEach((mark: any) => {
        if (mark.type === 'link') {
          if (!mark.attrs) mark.attrs = {};
          let href = mark.attrs.href || (node.text ? node.text.trim() : '');
          if (href) {
            if (
              !href.startsWith('http://') &&
              !href.startsWith('https://') &&
              !href.startsWith('/') &&
              !href.startsWith('#') &&
              !href.startsWith('mailto:')
            ) {
              href = `https://${href}`;
            }
            mark.attrs.href = href;
          } else {
            mark.attrs.href = '#';
          }
        }
      });
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(cloned);
  return cloned;
}
