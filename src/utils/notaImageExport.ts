import html2canvas from 'html2canvas';

export interface NotaExportOptions {
  scale?: number;
  backgroundColor?: string;
}

/**
 * Mengonversi elemen nota pembayaran menjadi file gambar asli PNG (image/png)
 * berkualitas tinggi dengan resolusi tajam (scale: 3 / scale: 4), latar belakang putih solid (#ffffff),
 * dan tangkapan utuh tanpa terpotong scroll/overflow HP.
 * 
 * Pemicu unduhan dijalankan via elemen <a> dengan atribut download,
 * disisipkan ke document.body.appendChild, diklik, lalu dihapus dari DOM.
 */
export async function downloadNotaPNG(
  elementOrId: HTMLElement | string,
  fileName: string = 'Nota_Pembayaran.png',
  options?: NotaExportOptions
): Promise<{ success: boolean; dataUrl: string; blob: Blob | null }> {
  const targetElement = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!targetElement) {
    throw new Error('Elemen nota pembayaran tidak ditemukan di halaman.');
  }

  // Pastikan nama file berakhiran .png
  const safeFileName = fileName.toLowerCase().endsWith('.png')
    ? fileName
    : `${fileName}.png`;

  // Resolusi tajam anti buram (default scale: 4 untuk ketajaman retina/ultra HD)
  const scale = options?.scale ?? 4;

  // Latar belakang putih solid (#ffffff) agar tidak hitam pekat saat dark mode di galeri HP
  const backgroundColor = options?.backgroundColor ?? '#ffffff';

  // Tunggu semua web font siap dirender agar teks nota proporsional
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  // Tangkap penuh seluruh isi nota (dari kop hingga tanda tangan paling bawah)
  const canvas = await html2canvas(targetElement, {
    scale: scale,
    backgroundColor: backgroundColor,
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: document.documentElement.offsetWidth,
    windowHeight: document.documentElement.offsetHeight,
    onclone: (clonedDoc) => {
      // Dapatkan elemen nota pada DOM hasil kloning
      const clonedElement = typeof elementOrId === 'string'
        ? clonedDoc.getElementById(elementOrId)
        : (targetElement.id ? clonedDoc.getElementById(targetElement.id) : null);

      if (clonedElement) {
        // Pastikan tidak ada overflow atau batasan tinggi yang memotong nota
        clonedElement.style.transform = 'none';
        clonedElement.style.maxHeight = 'none';
        clonedElement.style.height = 'auto';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.backgroundColor = '#ffffff';

        // Buka seluruh pembungkus induk di DOM klon agar tidak ada container yang memotong
        let parentNode: HTMLElement | null = clonedElement.parentElement;
        while (parentNode && parentNode !== clonedDoc.body) {
          parentNode.style.overflow = 'visible';
          parentNode.style.maxHeight = 'none';
          parentNode.style.height = 'auto';
          parentNode = parentNode.parentElement;
        }
      }
    }
  });

  // Konversi ke format gambar asli PNG murni ('image/png')
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  // Ambil blob PNG murni dan trigger unduhan
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      try {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          
          // Buat elemen <a> dengan atribut download
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = safeFileName;
          link.style.display = 'none';
          
          // Sisipkan ke document.body.appendChild
          document.body.appendChild(link);
          
          // Panggil link.click()
          link.click();
          
          // Hapus dari body setelah selesai dipanggil
          setTimeout(() => {
            try {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
              URL.revokeObjectURL(blobUrl);
            } catch {}
          }, 4000);

          resolve({ success: true, dataUrl, blob });
        } else {
          // Fallback menggunakan Data URL jika toBlob tidak menghasilkan blob
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = safeFileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            try {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
            } catch {}
          }, 3000);

          resolve({ success: true, dataUrl, blob: null });
        }
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

/**
 * Menghasilkan pratinjau dataUrl PNG murni ('image/png') dengan background #ffffff solid
 */
export async function renderNotaPreviewPNG(
  elementOrId: HTMLElement | string,
  options?: { scale?: number }
): Promise<{ dataUrl: string; blob: Blob | null }> {
  const targetElement = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!targetElement) {
    throw new Error('Elemen nota tidak ditemukan.');
  }

  const scale = options?.scale ?? 3;

  const canvas = await html2canvas(targetElement, {
    scale: scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: document.documentElement.offsetWidth,
    windowHeight: document.documentElement.offsetHeight,
    onclone: (clonedDoc) => {
      const clonedElement = typeof elementOrId === 'string'
        ? clonedDoc.getElementById(elementOrId)
        : (targetElement.id ? clonedDoc.getElementById(targetElement.id) : null);

      if (clonedElement) {
        clonedElement.style.transform = 'none';
        clonedElement.style.maxHeight = 'none';
        clonedElement.style.height = 'auto';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.backgroundColor = '#ffffff';

        let parentNode: HTMLElement | null = clonedElement.parentElement;
        while (parentNode && parentNode !== clonedDoc.body) {
          parentNode.style.overflow = 'visible';
          parentNode.style.maxHeight = 'none';
          parentNode.style.height = 'auto';
          parentNode = parentNode.parentElement;
        }
      }
    }
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({ dataUrl, blob });
    }, 'image/png');
  });
}
