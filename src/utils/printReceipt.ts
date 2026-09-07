/**
 * Dedicated Thermal Receipt Print Utility
 * Provides a reliable printing flow for 58mm POS/Thermal and Desktop printers
 * across both Laptop and Mobile (Android/iOS) devices.
 */

export async function printReceiptThermal(elementId: string = 'printable-nota'): Promise<boolean> {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }

  // Ensure any previous print frame is removed
  const existingFrame = document.getElementById('thermal-print-frame');
  if (existingFrame && existingFrame.parentNode) {
    existingFrame.parentNode.removeChild(existingFrame);
  }

  try {
    const iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '58mm';
    iframe.style.height = '100px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc || !iframe.contentWindow) {
      window.print();
      return true;
    }

    // Clone receipt element
    const receiptClone = sourceEl.cloneNode(true) as HTMLElement;
    receiptClone.style.margin = '0 auto';
    receiptClone.style.border = 'none';
    receiptClone.style.boxShadow = 'none';
    receiptClone.style.width = '100%';
    receiptClone.style.maxWidth = '58mm';

    // Thermal Receipt 58mm Specific Print Stylesheet
    const printStyles = `
      @page {
        size: 58mm auto;
        margin: 0mm;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html, body {
        width: 58mm;
        max-width: 58mm;
        margin: 0 auto;
        padding: 2mm 1.5mm 4mm 1.5mm;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
        font-size: 11px;
        line-height: 1.25;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .border-dashed {
        border-style: dashed !important;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: bold; }
      .font-extrabold { font-weight: 800; }
      .font-black { font-weight: 900; }
      .font-mono { font-family: monospace, Courier, sans-serif; }
      .uppercase { text-transform: uppercase; }
      .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .grid { display: grid; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .gap-1 { gap: 4px; }
      .gap-2 { gap: 8px; }
      .my-2 { margin-top: 8px; margin-bottom: 8px; }
      .my-2\\.5 { margin-top: 10px; margin-bottom: 10px; }
      .pt-1 { padding-top: 4px; }
      .pt-1\\.5 { padding-top: 6px; }
      .pb-1 { padding-bottom: 4px; }
      .space-y-1 > * + * { margin-top: 4px; }
      .space-y-0\\.5 > * + * { margin-top: 2px; }
      .text-\\[9px\\] { font-size: 9px; }
      .text-\\[10px\\] { font-size: 10px; }
      .text-\\[11px\\] { font-size: 11px; }
      .text-xs { font-size: 12px; }
      .text-sm { font-size: 13px; }
      .text-base { font-size: 15px; }
    `;

    // Collect linked stylesheets from main document
    const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Struk_58mm_MTK_Sidogiri</title>
          <style>${printStyles}</style>
          ${linkTags}
        </head>
        <body>
          <div style="width: 58mm; max-width: 58mm; margin: 0 auto; background: #ffffff;">
            ${receiptClone.outerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    // Small delay to ensure browser layout and fonts are rendered
    await new Promise(resolve => setTimeout(resolve, 250));

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    // Clean up
    setTimeout(() => {
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch {}
    }, 4000);

    return true;
  } catch (err) {
    console.warn('Iframe print failed, falling back to direct window.print():', err);
    try {
      window.print();
      return true;
    } catch (winErr) {
      console.error('Direct window.print() failed:', winErr);
      return false;
    }
  }
}
