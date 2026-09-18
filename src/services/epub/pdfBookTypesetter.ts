import jsPDF from 'jspdf';
import { zlibSync } from 'fflate';
import { EpubBook, EpubAsset, EpubChapter } from '../../types/epub';
import { resolvePath } from './pathUtils';

// Enable FlateEncode compression for jsPDF PNG images
if (typeof globalThis !== 'undefined' && !(globalThis as unknown as { zlibSync?: unknown }).zlibSync) {
  (globalThis as unknown as { zlibSync?: unknown }).zlibSync = zlibSync;
}

export interface PdfBookOptions {
  trimSize?: '6x9' | '5.5x8.5' | 'a4' | 'letter';
  fontFamily?: 'times' | 'helvetica';
  fontSize?: number;        // default 10.5 pt
  lineHeightRatio?: number; // default 1.48
  firstLineIndent?: boolean; // default true (18pt)
  runningHeaders?: boolean;  // default true
  pageNumbers?: boolean;     // default true
  includeCover?: boolean;    // default true
  includeChapterTitles?: boolean; // default true
  includeOrnament?: boolean;      // default true
  includePubDate?: boolean;       // default true
  tocPosition?: 'none' | 'start' | 'end'; // default 'none'
}

type BlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'p'
  | 'blockquote'
  | 'scene_break'
  | 'list_item'
  | 'image'
  | 'table';

export interface TableCell {
  text: string;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableBlockData {
  rows: TableRow[];
}

export interface ImageBlockData {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
}

interface TextBlock {
  type: BlockType;
  text?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  image?: ImageBlockData;
  table?: TableBlockData;
}

interface PageDimensions {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  contentWidth: number;
  contentHeight: number;
}

/**
 * Returns page dimensions in points (72 pt per inch)
 */
function getPageDimensions(trimSize: '6x9' | '5.5x8.5' | 'a4' | 'letter' = '6x9'): PageDimensions {
  let width: number;
  let height: number;
  let marginTop: number;
  let marginBottom: number;
  let marginLeft: number;
  let marginRight: number;

  switch (trimSize) {
    case '6x9': // Standard Amazon KDP Trade Paperback (6 in x 9 in)
      width = 432;
      height = 648;
      marginTop = 50;
      marginBottom = 50;
      marginLeft = 46;
      marginRight = 46;
      break;
    case '5.5x8.5': // Digest Paperback (5.5 in x 8.5 in)
      width = 396;
      height = 612;
      marginTop = 48;
      marginBottom = 48;
      marginLeft = 44;
      marginRight = 44;
      break;
    case 'letter': // US Letter (8.5 in x 11 in)
      width = 612;
      height = 792;
      marginTop = 58;
      marginBottom = 58;
      marginLeft = 54;
      marginRight = 54;
      break;
    case 'a4': // Standard A4 (210mm x 297mm)
    default:
      width = 595.28;
      height = 841.89;
      marginTop = 58;
      marginBottom = 58;
      marginLeft = 54;
      marginRight = 54;
      break;
  }

  return {
    width,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    contentWidth: width - (marginLeft + marginRight),
    contentHeight: height - (marginTop + marginBottom),
  };
}

/**
 * Extracts alignment from an HTML element
 */
function getElementAlignment(el: HTMLElement): 'left' | 'center' | 'right' | 'justify' | undefined {
  const rawAlign = (el.style?.textAlign || el.getAttribute('align') || '').toLowerCase();
  if (rawAlign === 'center' || rawAlign === 'right' || rawAlign === 'justify' || rawAlign === 'left') {
    return rawAlign as 'left' | 'center' | 'right' | 'justify';
  }
  return undefined;
}

/**
 * Parses an HTMLTableElement into clean structured rows and cells
 */
function parseTableElement(table: HTMLTableElement): TableBlockData {
  const rows: TableRow[] = [];
  const trs = table.querySelectorAll('tr');

  trs.forEach(tr => {
    const cells: TableCell[] = [];
    const thOrTds = tr.querySelectorAll('th, td');
    thOrTds.forEach(cell => {
      const isHeader = cell.tagName.toLowerCase() === 'th' || cell.closest('thead') !== null;
      
      // Preserve explicit line breaks from <br>
      const clone = cell.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
      const cellText = (clone.textContent || '')
        .split('\n')
        .map(s => s.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');

      const rawAlign = (cell.getAttribute('align') || (cell as HTMLElement).style?.textAlign || '').toLowerCase();
      let align: 'left' | 'center' | 'right' = isHeader ? 'center' : 'left';
      if (rawAlign === 'center' || rawAlign === 'right' || rawAlign === 'left') {
        align = rawAlign;
      }

      cells.push({
        text: cellText,
        isHeader,
        align,
      });
    });

    if (cells.length > 0) {
      rows.push({ cells });
    }
  });

  return { rows };
}

/**
 * Parses chapter HTML content into clean structural text, image, and table blocks
 */
function extractBlocksFromHtml(html: string): TextBlock[] {
  if (!html || !html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild as HTMLElement | null;
  if (!container) return [];

  const blocks: TextBlock[] = [];
  const processedElements = new Set<Element>();

  // Select all block candidates in document order
  const elements = container.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, p, blockquote, hr, ul, ol, li, table, figure, img, div'
  );

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (processedElements.has(el)) continue;

    // Skip if inside a table (table processes its own cells)
    if (el.closest('table')) continue;

    // Skip if inside a figure (figure processes its own image and caption)
    if (el.closest('figure')) continue;

    const tag = el.tagName.toLowerCase();

    // 1. TABLE
    if (tag === 'table') {
      processedElements.add(el);
      el.querySelectorAll('*').forEach(c => processedElements.add(c));

      const tableData = parseTableElement(el as HTMLTableElement);
      if (tableData.rows.length > 0) {
        blocks.push({
          type: 'table',
          table: tableData,
        });
      }
      continue;
    }

    // 2. FIGURE
    if (tag === 'figure') {
      processedElements.add(el);
      el.querySelectorAll('*').forEach(c => processedElements.add(c));

      const img = el.querySelector('img');
      const figcaption = el.querySelector('figcaption');
      const caption = figcaption?.textContent?.replace(/\s+/g, ' ').trim() || '';

      if (img) {
        const src = img.getAttribute('src') || img.getAttribute('data-original-src') || img.getAttribute('xlink:href') || '';
        const alt = img.getAttribute('alt') || '';
        const rawW = parseFloat(img.getAttribute('width') || img.style.width || '0');
        const rawH = parseFloat(img.getAttribute('height') || img.style.height || '0');

        if (src) {
          blocks.push({
            type: 'image',
            image: {
              src,
              alt,
              caption: caption || alt,
              width: rawW > 0 ? rawW : undefined,
              height: rawH > 0 ? rawH : undefined,
            },
          });
        }
      }
      continue;
    }

    // 3. STANDALONE IMG
    if (tag === 'img') {
      processedElements.add(el);
      const src = el.getAttribute('src') || el.getAttribute('data-original-src') || el.getAttribute('xlink:href') || '';
      const alt = el.getAttribute('alt') || '';
      const title = el.getAttribute('title') || '';
      const rawW = parseFloat(el.getAttribute('width') || (el as HTMLElement).style.width || '0');
      const rawH = parseFloat(el.getAttribute('height') || (el as HTMLElement).style.height || '0');

      if (src) {
        blocks.push({
          type: 'image',
          image: {
            src,
            alt,
            caption: title || alt,
            width: rawW > 0 ? rawW : undefined,
            height: rawH > 0 ? rawH : undefined,
          },
        });
      }
      continue;
    }

    // 4. SCENE BREAK (hr)
    if (tag === 'hr') {
      processedElements.add(el);
      blocks.push({ type: 'scene_break', text: '*   *   *' });
      continue;
    }

    // 5. LIST CONTAINER (skip container itself, let li be processed)
    if (tag === 'ul' || tag === 'ol') {
      continue;
    }

    // 6. LIST ITEM
    if (tag === 'li') {
      processedElements.add(el);
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) {
        blocks.push({ type: 'list_item', text });
      }
      continue;
    }

    // 7. BLOCKQUOTE
    if (tag === 'blockquote') {
      processedElements.add(el);
      el.querySelectorAll('*').forEach(c => processedElements.add(c));
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) {
        blocks.push({ type: 'blockquote', text, align: getElementAlignment(el as HTMLElement) });
      }
      continue;
    }

    // 8. PARAGRAPH OR DIV CONTAINING IMAGES
    if (tag === 'p' || tag === 'div') {
      const childImgs = el.querySelectorAll('img');
      if (childImgs.length > 0) {
        const textWithoutImgs = (el.textContent || '').replace(/\s+/g, ' ').trim();

        if (!textWithoutImgs) {
          // Pure image wrapper
          processedElements.add(el);
          childImgs.forEach(img => {
            processedElements.add(img);
            const src = img.getAttribute('src') || img.getAttribute('data-original-src') || img.getAttribute('xlink:href') || '';
            const alt = img.getAttribute('alt') || '';
            const title = img.getAttribute('title') || '';
            const rawW = parseFloat(img.getAttribute('width') || img.style.width || '0');
            const rawH = parseFloat(img.getAttribute('height') || img.style.height || '0');

            if (src) {
              blocks.push({
                type: 'image',
                image: {
                  src,
                  alt,
                  caption: title || alt,
                  width: rawW > 0 ? rawW : undefined,
                  height: rawH > 0 ? rawH : undefined,
                },
              });
            }
          });
          continue;
        } else {
          // Mixed text and images inside container
          processedElements.add(el);
          el.childNodes.forEach(childNode => {
            if (childNode.nodeType === Node.ELEMENT_NODE && (childNode as Element).tagName.toLowerCase() === 'img') {
              const img = childNode as HTMLImageElement;
              processedElements.add(img);
              const src = img.getAttribute('src') || img.getAttribute('data-original-src') || img.getAttribute('xlink:href') || '';
              const alt = img.getAttribute('alt') || '';
              const title = img.getAttribute('title') || '';
              const rawW = parseFloat(img.getAttribute('width') || img.style.width || '0');
              const rawH = parseFloat(img.getAttribute('height') || img.style.height || '0');

              if (src) {
                blocks.push({
                  type: 'image',
                  image: {
                    src,
                    alt,
                    caption: title || alt,
                    width: rawW > 0 ? rawW : undefined,
                    height: rawH > 0 ? rawH : undefined,
                  },
                });
              }
            } else {
              const childText = (childNode.textContent || '').replace(/\s+/g, ' ').trim();
              if (childText) {
                blocks.push({ type: 'p', text: childText, align: getElementAlignment(el as HTMLElement) });
              }
            }
          });
          continue;
        }
      }
    }

    // 9. DIV CONTAINER CHECK
    if (tag === 'div') {
      const hasBlockChildren = el.querySelector('h1, h2, h3, h4, h5, h6, p, blockquote, hr, ul, ol, table, figure, div');
      if (hasBlockChildren) {
        // Just a layout container, let child block elements be processed
        continue;
      }
    }

    // 10. TEXT BLOCKS (h1-h6, p, leaf divs)
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    if (tag === 'hr' || text === '* * *' || text === '***' || text === '###' || text === '---') {
      processedElements.add(el);
      blocks.push({ type: 'scene_break', text: '*   *   *' });
      continue;
    }

    processedElements.add(el);
    const align = getElementAlignment(el as HTMLElement);

    if (tag === 'h1') {
      blocks.push({ type: 'h1', text, align });
    } else if (tag === 'h2') {
      blocks.push({ type: 'h2', text, align });
    } else if (tag.startsWith('h')) {
      blocks.push({ type: 'h3', text, align });
    } else {
      blocks.push({ type: 'p', text, align });
    }
  }

  // Fallback if no structured blocks found
  if (blocks.length === 0) {
    const rawText = container.textContent || '';
    const rawParagraphs = rawText.split(/\n\s*\n/);
    for (const p of rawParagraphs) {
      const clean = p.replace(/\s+/g, ' ').trim();
      if (clean) blocks.push({ type: 'p', text: clean });
    }
  }

  return blocks;
}

/**
 * Extracts raw SVG string from data URL, blob URL, or remote URL if applicable
 */
async function getSvgTextFromUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/svg+xml')) {
    if (url.includes(';base64,')) {
      const base64 = url.split(';base64,')[1];
      try {
        return atob(base64);
      } catch {
        return null;
      }
    }
    const commaIdx = url.indexOf(',');
    try {
      return decodeURIComponent(url.slice(commaIdx + 1));
    } catch {
      return null;
    }
  }

  const isLikelySvg = url.toLowerCase().includes('.svg') || url.startsWith('blob:') || url.startsWith('http');
  if (isLikelySvg) {
    try {
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image/svg+xml') || url.toLowerCase().includes('.svg') || url.startsWith('blob:')) {
        const text = await res.text();
        if (text.includes('<svg')) {
          return text;
        }
      }
    } catch {
      // Not fetchable or not text, fallback to raster
    }
  }
  return null;
}

/**
 * Renders an SVG string to a crisp, publication-grade JPEG Data URL at 300 DPI
 */
async function renderSvgToHighResDataUrl(
  svgContent: string,
  targetWidth = 1800,
  targetHeight = 2700,
  quality = 0.92
): Promise<{ dataUrl: string; format: 'JPEG'; width: number; height: number } | null> {
  try {
    let cleanSvg = svgContent.trim();
    const svgStart = cleanSvg.indexOf('<svg');
    if (svgStart !== -1) {
      cleanSvg = cleanSvg.slice(svgStart);
    }

    // Determine aspect ratio from viewBox if present
    const vbMatch = cleanSvg.match(/viewBox=["']\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*["']/i);
    const rasterW = targetWidth;
    let rasterH = targetHeight;

    if (vbMatch) {
      const vbW = parseFloat(vbMatch[3]);
      const vbH = parseFloat(vbMatch[4]);
      if (vbW > 0 && vbH > 0) {
        const aspect = vbW / vbH;
        rasterH = Math.round(rasterW / aspect);
      }
    }

    // Ensure explicit pixel width and height on root <svg> so browser Image renders at 300 DPI
    const svgTagMatch = cleanSvg.match(/<svg\b([^>]*)>/i);
    if (svgTagMatch) {
      let attrs = svgTagMatch[1];
      attrs = attrs.replace(/\bwidth=["'][^"']*["']/gi, '');
      attrs = attrs.replace(/\bheight=["'][^"']*["']/gi, '');
      const newSvgTag = `<svg width="${rasterW}" height="${rasterH}" ${attrs}>`;
      cleanSvg = cleanSvg.replace(svgTagMatch[0], newSvgTag);
    }

    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = blobUrl;
    });

    URL.revokeObjectURL(blobUrl);

    const canvas = document.createElement('canvas');
    canvas.width = rasterW;
    canvas.height = rasterH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // White background for cover and vector art
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rasterW, rasterH);
    ctx.drawImage(img, 0, 0, rasterW, rasterH);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return { dataUrl, format: 'JPEG', width: rasterW, height: rasterH };
  } catch (err) {
    console.warn('High-res SVG rasterization failed, falling back to standard loader:', err);
    return null;
  }
}

/**
 * Checks if a canvas context contains transparent or semi-transparent pixels
 */
function hasAlphaChannel(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const totalPixels = width * height;
    const step = Math.max(1, Math.floor(totalPixels / 15000));
    for (let i = 0; i < totalPixels; i += step) {
      if (data[i * 4 + 3] < 250) {
        return true;
      }
    }
  } catch {
    // Cross-origin fallback: assume opaque
  }
  return false;
}

/**
 * Loads image from data URL, blob URL, or SVG safely and compresses for publication PDF
 */
async function loadImageDataUrl(
  url: string,
  targetW?: number,
  targetH?: number,
  isCover?: boolean
): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG'; width: number; height: number } | null> {
  try {
    // 1. Check if source is SVG for high-resolution vector rendering
    const svgText = await getSvgTextFromUrl(url);
    if (svgText) {
      const defaultW = isCover ? 1800 : 1600;
      const defaultH = isCover ? 2700 : 2400;
      const res = await renderSvgToHighResDataUrl(
        svgText,
        targetW || defaultW,
        targetH || defaultH,
        isCover ? 0.92 : 0.88
      );
      if (res) return res;
    }

    // 2. Standard raster image loading (JPEG, PNG, WebP)
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    let w = img.naturalWidth || img.width || 400;
    let h = img.naturalHeight || img.height || 300;
    if (w <= 0 || h <= 0) return null;

    // Cap excessive dimensions (max 2400px preserves 300+ DPI while preventing multi-hundred MB PDFs)
    const MAX_DIMENSION = 2400;
    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // For book covers or opaque images, draw with white backdrop
    if (isCover) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(img, 0, 0, w, h);

    // Book covers and opaque illustrations are encoded as JPEG for high visual fidelity and 95% smaller file size
    const isTransparent = !isCover && hasAlphaChannel(ctx, w, h);
    if (isTransparent) {
      const dataUrl = canvas.toDataURL('image/png');
      return { dataUrl, format: 'PNG', width: w, height: h };
    } else {
      const quality = isCover ? 0.92 : 0.88;
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      return { dataUrl, format: 'JPEG', width: w, height: h };
    }
  } catch (err) {
    console.warn('PDF Image loading failed:', err);
    return null;
  }
}

/**
 * Resolves an image source (blob URL, data URL, remote URL, or relative asset path) into a compressed DataURL
 */
async function resolveImageToDataUrl(
  src: string,
  chapterFullPath: string,
  assets: EpubAsset[] = [],
  targetW?: number,
  targetH?: number,
  isCover?: boolean
): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG'; width: number; height: number } | null> {
  if (!src) return null;

  // 1. Direct data URL
  if (src.startsWith('data:image/')) {
    return await loadImageDataUrl(src, targetW, targetH, isCover);
  }

  // 2. Direct blob URL or remote URL
  if (src.startsWith('blob:') || src.startsWith('http://') || src.startsWith('https://')) {
    const directResult = await loadImageDataUrl(src, targetW, targetH, isCover);
    if (directResult) return directResult;
  }

  // 3. Asset lookup (for relative paths e.g. "images/pic.png", "../images/pic.png")
  const cleanSrc = src.split('?')[0].split('#')[0];
  const resolvedPath = resolvePath(chapterFullPath || '', cleanSrc);

  const matchedAsset = assets.find(a => {
    if (a.fullPath === resolvedPath || a.href === cleanSrc || a.id === cleanSrc) return true;
    if (a.blobUrl && a.blobUrl === src) return true;
    if (a.href.endsWith(cleanSrc) || a.fullPath.endsWith(cleanSrc)) return true;
    const filename = cleanSrc.split('/').pop() || '';
    if (filename && (a.href.endsWith(filename) || a.fullPath.endsWith(filename) || a.id === filename)) return true;
    return false;
  });

  if (matchedAsset) {
    // If SVG asset with raw text data, render directly at high resolution
    const isSvg = matchedAsset.mediaType === 'image/svg+xml' || cleanSrc.toLowerCase().endsWith('.svg');
    if (isSvg && matchedAsset.data && matchedAsset.data.length > 0) {
      try {
        const svgString = new TextDecoder().decode(matchedAsset.data);
        const res = await renderSvgToHighResDataUrl(
          svgString,
          targetW || (isCover ? 1800 : 1600),
          targetH || (isCover ? 2700 : 2400),
          isCover ? 0.92 : 0.88
        );
        if (res) return res;
      } catch (err) {
        console.warn('Direct SVG asset decoding failed:', err);
      }
    }

    if (matchedAsset.blobUrl) {
      const res = await loadImageDataUrl(matchedAsset.blobUrl, targetW, targetH, isCover);
      if (res) return res;
    }

    if (matchedAsset.data && matchedAsset.data.length > 0) {
      const mime = matchedAsset.mediaType || 'image/png';
      const blob = new Blob([matchedAsset.data as unknown as BlobPart], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      try {
        const res = await loadImageDataUrl(blobUrl, targetW, targetH, isCover);
        return res;
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    }
  }

  return null;
}

/**
 * Wraps text considering first line indent
 */
function wrapParagraphLines(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  indent: number
): Array<{ line: string; xOffset: number }> {
  if (indent <= 0) {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    return lines.map((line: string) => ({ line, xOffset: 0 }));
  }

  const words = text.split(' ');
  const firstLineWords: string[] = [];
  let remainingWords: string[] = [];
  let testStr = '';

  for (let i = 0; i < words.length; i++) {
    const nextTest = testStr ? `${testStr} ${words[i]}` : words[i];
    if (doc.getTextWidth(nextTest) <= maxWidth - indent) {
      testStr = nextTest;
      firstLineWords.push(words[i]);
    } else {
      remainingWords = words.slice(i);
      break;
    }
  }

  if (firstLineWords.length === 0 && words.length > 0) {
    firstLineWords.push(words[0]);
    remainingWords = words.slice(1);
  }

  const result: Array<{ line: string; xOffset: number }> = [
    { line: firstLineWords.join(' '), xOffset: indent },
  ];

  if (remainingWords.length > 0) {
    const restText = remainingWords.join(' ');
    const restLines = doc.splitTextToSize(restText, maxWidth) as string[];
    for (const l of restLines) {
      result.push({ line: l, xOffset: 0 });
    }
  }

  return result;
}

/**
 * Formats clean keyword title for running headers
 */
function getHeaderTitle(title: string): string {
  const clean = title.replace(/[^a-zA-Z0-9\s'-]/g, '').trim();
  const words = clean.split(/\s+/).slice(0, 6).join(' ');
  return words || 'Book';
}

/**
 * Typesets publication-accurate Table of Contents pages
 */
function renderTocPages(
  doc: jsPDF,
  dims: PageDimensions,
  fontFamily: 'times' | 'helvetica',
  chapters: EpubChapter[],
  chapterDisplayPages: number[],
  includeOrnament: boolean,
  startAtPage: number,
  isAtEnd: boolean
): number {
  let activeTocPage = startAtPage;
  doc.setPage(activeTocPage);

  let currentY = dims.marginTop + 45;

  // Title
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('TABLE OF CONTENTS', dims.width / 2, currentY, { align: 'center' });
  currentY += 20;

  if (includeOrnament) {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150, 160, 175);
    doc.text('~ • ~', dims.width / 2, currentY, { align: 'center' });
    currentY += 26;
  } else {
    currentY += 14;
  }

  const lineHeight = 19;

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const chTitle = ch.title || `Chapter ${i + 1}`;
    const pageNum = chapterDisplayPages[i] || (i + 1);

    if (currentY + lineHeight > dims.height - dims.marginBottom) {
      if (isAtEnd) {
        doc.addPage([dims.width, dims.height]);
        activeTocPage = doc.getNumberOfPages();
      } else {
        activeTocPage++;
        doc.setPage(activeTocPage);
      }
      currentY = dims.marginTop + 35;
    }

    const pageNumStr = `${pageNum}`;
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(10);
    const numWidth = doc.getTextWidth(pageNumStr);

    const maxTitleW = dims.contentWidth - numWidth - 28;
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(10);

    let displayTitle = chTitle;
    while (displayTitle.length > 5 && doc.getTextWidth(displayTitle) > maxTitleW) {
      displayTitle = displayTitle.slice(0, -4).trim() + '...';
    }
    const titleWidth = doc.getTextWidth(displayTitle);

    // Draw title
    doc.setTextColor(20, 25, 35);
    doc.text(displayTitle, dims.marginLeft, currentY);

    // Draw leader dots
    const dotStart = dims.marginLeft + titleWidth + 6;
    const dotEnd = dims.width - dims.marginRight - numWidth - 6;
    if (dotEnd > dotStart) {
      doc.setTextColor(170, 180, 195);
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9);
      const dotUnit = '. ';
      const unitW = doc.getTextWidth(dotUnit);
      const count = Math.floor((dotEnd - dotStart) / unitW);
      if (count > 0) {
        doc.text(dotUnit.repeat(count), dotStart, currentY);
      }
    }

    // Draw page number
    doc.setTextColor(30, 41, 59);
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(10);
    doc.text(pageNumStr, dims.width - dims.marginRight, currentY, { align: 'right' });

    currentY += lineHeight;
  }

  return activeTocPage;
}

/**
 * Core Book Typesetting Engine
 * Generates a publication-grade vector text PDF using direct jsPDF text operators.
 */
export async function generateVectorPdf(
  book: EpubBook,
  options: PdfBookOptions = {}
): Promise<jsPDF> {
  const meta = book.metadata;
  const trimSize = options.trimSize || '6x9';
  const fontFamily = options.fontFamily || 'times';
  const fontSize = options.fontSize || (trimSize === 'a4' || trimSize === 'letter' ? 11 : 10.5);
  const lineHeightRatio = options.lineHeightRatio || 1.48;
  const bodyLineHeight = fontSize * lineHeightRatio;
  const useIndent = options.firstLineIndent !== false;
  const indentSize = useIndent ? 18 : 0;
  const includeRunningHeaders = options.runningHeaders !== false;
  const includePageNumbers = options.pageNumbers !== false;
  const includeCover = options.includeCover !== false;
  const includeChapterTitles = options.includeChapterTitles !== false;
  const includeOrnament = options.includeOrnament !== false;
  const includePubDate = options.includePubDate !== false;
  const tocPosition = options.tocPosition || 'none';

  const dims = getPageDimensions(trimSize);

  // Initialize jsPDF document with exact page dimensions and stream compression
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [dims.width, dims.height],
    compress: true,
  });

  const bookTitle = meta.title || 'Untitled Book';
  const authorName = meta.creator || 'Unknown Author';
  const shortBookTitle = getHeaderTitle(bookTitle);

  // Track pages that are chapter openings or title/cover pages where running headers should be omitted
  const headerSuppressedPages = new Set<number>();
  // Track chapter titles for running headers on odd pages
  const pageChapterMap = new Map<number, string>();

  let currentPage = 1;

  // -------------------------------------------------------------
  // 1. FRONT COVER PAGE (Optional)
  // -------------------------------------------------------------
  if (includeCover && book.coverImageUrl) {
    // 300 DPI target resolution for the trim size (300 / 72 = 4.166 px/pt)
    const targetCoverW = Math.round(dims.width * (300 / 72));
    const targetCoverH = Math.round(dims.height * (300 / 72));

    const coverData = await loadImageDataUrl(book.coverImageUrl, targetCoverW, targetCoverH, true);
    if (coverData) {
      headerSuppressedPages.add(currentPage);

      const maxCoverWidth = dims.contentWidth * 0.92;
      const maxCoverHeight = dims.contentHeight * 0.85;

      const imgAspect = coverData.width / coverData.height;
      let drawW = maxCoverWidth;
      let drawH = drawW / imgAspect;

      if (drawH > maxCoverHeight) {
        drawH = maxCoverHeight;
        drawW = drawH * imgAspect;
      }

      const drawX = (dims.width - drawW) / 2;
      const drawY = (dims.height - drawH) / 2;

      doc.addImage(coverData.dataUrl, coverData.format, drawX, drawY, drawW, drawH, undefined, 'FAST');

      doc.addPage([dims.width, dims.height]);
      currentPage++;
    }
  }

  // -------------------------------------------------------------
  // 2. TITLE PAGE (Half-Title / Full Title)
  // -------------------------------------------------------------
  headerSuppressedPages.add(currentPage);

  const titlePageY = dims.height * 0.32;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(20, 24, 33);

  // Split title if long
  const titleLines = doc.splitTextToSize(bookTitle, dims.contentWidth - 40);
  doc.text(titleLines, dims.width / 2, titlePageY, { align: 'center' });

  const authorY = titlePageY + titleLines.length * 28 + 24;
  doc.setFont(fontFamily, 'italic');
  doc.setFontSize(13);
  doc.setTextColor(70, 80, 95);
  doc.text(`by ${authorName}`, dims.width / 2, authorY, { align: 'center' });

  // Optional decorative rule
  const ruleY = authorY + 28;
  doc.setDrawColor(210, 215, 225);
  doc.setLineWidth(0.75);
  doc.line(dims.width / 2 - 35, ruleY, dims.width / 2 + 35, ruleY);

  // Publisher / date near bottom
  if (includePubDate && (meta.publisher || meta.pubdate)) {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(140, 150, 165);
    const pubText = [meta.publisher, meta.pubdate].filter(Boolean).join(' • ');
    doc.text(pubText.toUpperCase(), dims.width / 2, dims.height - dims.marginBottom - 20, {
      align: 'center',
    });
  }

  // -------------------------------------------------------------
  // 3. TABLE OF CONTENTS IN FRONT MATTER (Optional)
  // -------------------------------------------------------------
  const chapters = book.chapters || [];
  let tocStartReservedPage = -1;
  let tocPageCount = 0;

  if (tocPosition === 'start' && chapters.length > 0) {
    tocPageCount = Math.max(1, Math.ceil(chapters.length / 22));
    tocStartReservedPage = currentPage + 1;
    for (let tp = 0; tp < tocPageCount; tp++) {
      doc.addPage([dims.width, dims.height]);
      currentPage++;
      headerSuppressedPages.add(currentPage);
    }
  }

  // Track the physical starting page for each chapter
  const chapterStartPages = new Map<number, number>();

  // -------------------------------------------------------------
  // 4. CHAPTERS TYPESETTING
  // -------------------------------------------------------------
  for (let chIndex = 0; chIndex < chapters.length; chIndex++) {
    const chapter = chapters[chIndex];
    const chapterTitle = chapter.title || `Chapter ${chIndex + 1}`;
    const shortChTitle = getHeaderTitle(chapterTitle);

    // Each chapter begins on a fresh new page
    doc.addPage([dims.width, dims.height]);
    currentPage++;
    headerSuppressedPages.add(currentPage);
    pageChapterMap.set(currentPage, shortChTitle);
    chapterStartPages.set(chIndex, currentPage);

    // Chapter Header with traditional book top-drop (~90pt or ~45pt if no title)
    let currentY = dims.marginTop + (includeChapterTitles ? 65 : 25);

    // Chapter Title
    if (includeChapterTitles) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(17);
      doc.setTextColor(15, 23, 42);

      const chTitleLines = doc.splitTextToSize(chapterTitle, dims.contentWidth);
      doc.text(chTitleLines, dims.width / 2, currentY, { align: 'center' });
      currentY += chTitleLines.length * 22 + 18;
    }

    // Small decorative ornament below chapter title
    if (includeOrnament) {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(150, 160, 175);
      doc.text('~ • ~', dims.width / 2, currentY, { align: 'center' });
      currentY += 28;
    }

    // Extract blocks for this chapter
    const blocks = extractBlocksFromHtml(chapter.content);

    // State to track first paragraph after heading or break (no indent convention)
    let isFirstParaAfterBreak = true;

    for (let bIndex = 0; bIndex < blocks.length; bIndex++) {
      const block = blocks[bIndex];

      switch (block.type) {
        case 'h1':
        case 'h2': {
          // Subheading orphan protection: requires room for heading + 2 lines of text
          const headingFontSize = block.type === 'h1' ? 14 : 12.5;
          const headingLeading = headingFontSize * 1.4;
          const spaceBefore = 22;
          const spaceAfter = 10;
          const requiredHeight = spaceBefore + headingLeading + spaceAfter + bodyLineHeight * 2;

          if (currentY + requiredHeight > dims.height - dims.marginBottom) {
            doc.addPage([dims.width, dims.height]);
            currentPage++;
            pageChapterMap.set(currentPage, shortChTitle);
            currentY = dims.marginTop + 20;
          } else {
            currentY += spaceBefore;
          }

          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(headingFontSize);
          doc.setTextColor(20, 25, 35);

          const hLines = doc.splitTextToSize(block.text || '', dims.contentWidth);
          if (block.align === 'center') {
            doc.text(hLines, dims.marginLeft + dims.contentWidth / 2, currentY, { align: 'center' });
          } else if (block.align === 'right') {
            doc.text(hLines, dims.marginLeft + dims.contentWidth, currentY, { align: 'right' });
          } else {
            doc.text(hLines, dims.marginLeft, currentY);
          }
          currentY += hLines.length * headingLeading + spaceAfter;

          isFirstParaAfterBreak = true;
          break;
        }

        case 'h3': {
          const headingFontSize = 11;
          const headingLeading = 15;
          const spaceBefore = 16;
          const spaceAfter = 8;
          const requiredHeight = spaceBefore + headingLeading + spaceAfter + bodyLineHeight * 2;

          if (currentY + requiredHeight > dims.height - dims.marginBottom) {
            doc.addPage([dims.width, dims.height]);
            currentPage++;
            pageChapterMap.set(currentPage, shortChTitle);
            currentY = dims.marginTop + 20;
          } else {
            currentY += spaceBefore;
          }

          doc.setFont(fontFamily, 'bolditalic');
          doc.setFontSize(headingFontSize);
          doc.setTextColor(30, 41, 59);

          const hLines = doc.splitTextToSize(block.text || '', dims.contentWidth);
          if (block.align === 'center') {
            doc.text(hLines, dims.marginLeft + dims.contentWidth / 2, currentY, { align: 'center' });
          } else if (block.align === 'right') {
            doc.text(hLines, dims.marginLeft + dims.contentWidth, currentY, { align: 'right' });
          } else {
            doc.text(hLines, dims.marginLeft, currentY);
          }
          currentY += hLines.length * headingLeading + spaceAfter;

          isFirstParaAfterBreak = true;
          break;
        }

        case 'scene_break': {
          currentY += 14;
          if (currentY + 28 > dims.height - dims.marginBottom) {
            doc.addPage([dims.width, dims.height]);
            currentPage++;
            pageChapterMap.set(currentPage, shortChTitle);
            currentY = dims.marginTop + 20;
          }

          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(10);
          doc.setTextColor(100, 115, 130);
          doc.text('*   *   *', dims.width / 2, currentY, { align: 'center' });
          currentY += 20;

          isFirstParaAfterBreak = true;
          break;
        }

        case 'blockquote': {
          currentY += 8;
          const bqFontSize = fontSize - 0.5;
          const bqLeading = bqFontSize * 1.45;
          const bqIndentLeft = 20;
          const bqIndentRight = 16;
          const bqWidth = dims.contentWidth - (bqIndentLeft + bqIndentRight);

          doc.setFont(fontFamily, 'italic');
          doc.setFontSize(bqFontSize);
          doc.setTextColor(51, 65, 85);

          const bqLines = doc.splitTextToSize(block.text || '', bqWidth);

          for (const line of bqLines) {
            if (currentY + bqLeading > dims.height - dims.marginBottom) {
              doc.addPage([dims.width, dims.height]);
              currentPage++;
              pageChapterMap.set(currentPage, shortChTitle);
              currentY = dims.marginTop + 20;
            }
            doc.text(line, dims.marginLeft + bqIndentLeft, currentY);
            currentY += bqLeading;
          }

          currentY += 8;
          isFirstParaAfterBreak = false;
          break;
        }

        case 'list_item': {
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(30, 41, 59);

          const bulletIndent = 16;
          const itemWidth = dims.contentWidth - bulletIndent;
          const itemLines = doc.splitTextToSize(block.text || '', itemWidth);

          for (let i = 0; i < itemLines.length; i++) {
            if (currentY + bodyLineHeight > dims.height - dims.marginBottom) {
              doc.addPage([dims.width, dims.height]);
              currentPage++;
              pageChapterMap.set(currentPage, shortChTitle);
              currentY = dims.marginTop + 20;
            }

            if (i === 0) {
              doc.text('•', dims.marginLeft + 4, currentY);
            }
            doc.text(itemLines[i], dims.marginLeft + bulletIndent, currentY);
            currentY += bodyLineHeight;
          }

          currentY += 4;
          isFirstParaAfterBreak = false;
          break;
        }

        case 'image': {
          if (!block.image || !block.image.src) break;

          const resolved = await resolveImageToDataUrl(
            block.image.src,
            chapter.fullPath,
            book.assets
          );

          if (!resolved) {
            console.warn('Skipping unresolvable image in PDF:', block.image.src);
            break;
          }

          const { dataUrl, format, width: naturalW, height: naturalH } = resolved;
          const imgAspect = naturalW / naturalH;

          // Max bounds within page content area
          const maxImgW = dims.contentWidth;
          const maxImgH = dims.contentHeight * 0.70;

          // Respect author's dimensions if specified, otherwise scale to content width or natural width
          let drawW = maxImgW;
          if (block.image.width && block.image.width > 0 && block.image.width < maxImgW) {
            drawW = block.image.width;
          } else if (naturalW < maxImgW && naturalW > 60) {
            drawW = naturalW;
          }

          let drawH = drawW / imgAspect;
          if (drawH > maxImgH) {
            drawH = maxImgH;
            drawW = drawH * imgAspect;
          }

          const captionFontSize = Math.max(8, fontSize - 2);
          const captionLines = block.image.caption
            ? (doc.splitTextToSize(block.image.caption, dims.contentWidth * 0.9) as string[])
            : [];
          const captionHeight = captionLines.length > 0 ? captionLines.length * (captionFontSize * 1.35) + 6 : 0;
          const totalBlockHeight = 12 + drawH + captionHeight + 14;

          // Page break if overflowing
          if (currentY + totalBlockHeight > dims.height - dims.marginBottom) {
            doc.addPage([dims.width, dims.height]);
            currentPage++;
            pageChapterMap.set(currentPage, shortChTitle);
            currentY = dims.marginTop + 20;
          } else {
            currentY += 12;
          }

          // Center image horizontally
          const drawX = dims.marginLeft + (dims.contentWidth - drawW) / 2;
          doc.addImage(dataUrl, format, drawX, currentY, drawW, drawH, undefined, 'FAST');
          currentY += drawH;

          // Optional caption
          if (captionLines.length > 0) {
            currentY += 6;
            doc.setFont(fontFamily, 'italic');
            doc.setFontSize(captionFontSize);
            doc.setTextColor(100, 115, 130);
            doc.text(captionLines, dims.width / 2, currentY, { align: 'center' });
            currentY += captionLines.length * (captionFontSize * 1.35);
          }

          currentY += 14;
          isFirstParaAfterBreak = true;
          break;
        }

        case 'table': {
          if (!block.table || block.table.rows.length === 0) break;

          const table = block.table;
          const numCols = Math.max(...table.rows.map(r => r.cells.length));
          if (numCols <= 0) break;

          // Measure maximum character length per column
          const maxColChars: number[] = new Array(numCols).fill(1);
          table.rows.forEach(row => {
            row.cells.forEach((cell, cIdx) => {
              const charLen = (cell.text || '').length;
              if (charLen > maxColChars[cIdx]) {
                maxColChars[cIdx] = charLen;
              }
            });
          });

          // Proportional column widths with minimum bound
          const minColW = Math.min(45, dims.contentWidth / numCols);
          const charWeights = maxColChars.map(c => Math.max(c, 4));
          const totalWeight = charWeights.reduce((a, b) => a + b, 0);

          let colWidths = charWeights.map(w => (w / totalWeight) * dims.contentWidth);
          colWidths = colWidths.map(w => Math.max(minColW, w));
          const totalAllocatedW = colWidths.reduce((a, b) => a + b, 0);
          colWidths = colWidths.map(w => (w / totalAllocatedW) * dims.contentWidth);

          const cellFontSize = Math.max(8, fontSize - 1.5);
          const cellLineHeight = cellFontSize * 1.35;
          const cellPaddingX = 6;
          const cellPaddingY = 5;

          const hasHeaderRow = table.rows[0]?.cells.some(c => c.isHeader);
          const headerRow = hasHeaderRow ? table.rows[0] : null;

          // Helper to draw a single table row
          const drawRow = (row: TableRow, isHeader: boolean, rowIndex: number) => {
            const cellLinesList: string[][] = [];
            let maxLines = 1;

            for (let c = 0; c < numCols; c++) {
              const cell = row.cells[c];
              const text = cell ? cell.text : '';
              const availableW = Math.max(15, colWidths[c] - cellPaddingX * 2);

              doc.setFont(fontFamily, isHeader || cell?.isHeader ? 'bold' : 'normal');
              doc.setFontSize(cellFontSize);

              const lines = doc.splitTextToSize(text, availableW) as string[];
              cellLinesList.push(lines.length > 0 ? lines : [' ']);
              if (lines.length > maxLines) {
                maxLines = lines.length;
              }
            }

            const rowHeight = maxLines * cellLineHeight + cellPaddingY * 2;

            // Page break check
            if (currentY + rowHeight > dims.height - dims.marginBottom) {
              doc.addPage([dims.width, dims.height]);
              currentPage++;
              pageChapterMap.set(currentPage, shortChTitle);
              currentY = dims.marginTop + 20;

              // Re-render header on the newly created page for readability
              if (!isHeader && headerRow) {
                drawRow(headerRow, true, -1);
              }
            }

            let cellX = dims.marginLeft;
            for (let c = 0; c < numCols; c++) {
              const cell = row.cells[c];
              const colW = colWidths[c];
              const cellIsHeader = isHeader || cell?.isHeader;

              // Background fill
              if (cellIsHeader) {
                doc.setFillColor(241, 245, 249); // slate-100
                doc.rect(cellX, currentY, colW, rowHeight, 'F');
              } else if (rowIndex % 2 === 1) {
                doc.setFillColor(248, 250, 252); // slate-50 zebra stripe
                doc.rect(cellX, currentY, colW, rowHeight, 'F');
              }

              // Subtle cell border
              doc.setDrawColor(215, 222, 232);
              doc.setLineWidth(0.4);
              doc.rect(cellX, currentY, colW, rowHeight, 'S');

              // Text content
              doc.setTextColor(cellIsHeader ? 15 : 30, cellIsHeader ? 23 : 41, cellIsHeader ? 42 : 59);
              doc.setFont(fontFamily, cellIsHeader ? 'bold' : 'normal');
              doc.setFontSize(cellFontSize);

              const lines = cellLinesList[c];
              const align = cell?.align || (cellIsHeader ? 'center' : 'left');

              for (let l = 0; l < lines.length; l++) {
                const line = lines[l];
                const textY = currentY + cellPaddingY + l * cellLineHeight + cellFontSize * 0.85;

                if (align === 'center') {
                  doc.text(line, cellX + colW / 2, textY, { align: 'center' });
                } else if (align === 'right') {
                  doc.text(line, cellX + colW - cellPaddingX, textY, { align: 'right' });
                } else {
                  doc.text(line, cellX + cellPaddingX, textY);
                }
              }

              cellX += colW;
            }

            currentY += rowHeight;
          };

          currentY += 10;

          // Render header row or first row
          const startIdx = hasHeaderRow ? 1 : 0;
          if (hasHeaderRow && headerRow) {
            drawRow(headerRow, true, 0);
          }

          // Render data rows
          for (let r = startIdx; r < table.rows.length; r++) {
            drawRow(table.rows[r], false, r);
          }

          currentY += 14;
          isFirstParaAfterBreak = true;
          break;
        }

        case 'p':
        default: {
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(24, 30, 42);

          const isCentered = block.align === 'center';
          const isRight = block.align === 'right';
          const indent = (isFirstParaAfterBreak || isCentered || isRight) ? 0 : indentSize;
          const lines = wrapParagraphLines(doc, block.text || '', dims.contentWidth, indent);

          for (const item of lines) {
            if (currentY + bodyLineHeight > dims.height - dims.marginBottom) {
              doc.addPage([dims.width, dims.height]);
              currentPage++;
              pageChapterMap.set(currentPage, shortChTitle);
              currentY = dims.marginTop + 20;
            }

            if (isCentered) {
              doc.text(item.line, dims.marginLeft + dims.contentWidth / 2, currentY, { align: 'center' });
            } else if (isRight) {
              doc.text(item.line, dims.marginLeft + dims.contentWidth, currentY, { align: 'right' });
            } else {
              doc.text(item.line, dims.marginLeft + item.xOffset, currentY);
            }
            currentY += bodyLineHeight;
          }

          // If not indented, add slight paragraph spacing
          if (!useIndent || isCentered || isRight) {
            currentY += bodyLineHeight * 0.45;
          }

          isFirstParaAfterBreak = false;
          break;
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 5. TABLE OF CONTENTS POST-PROCESSING
  // -------------------------------------------------------------
  const totalPagesBeforeEndToc = doc.getNumberOfPages();

  // Find the first chapter page to determine page 1 of book content
  let bookStartPage = 1;
  while (bookStartPage <= totalPagesBeforeEndToc && headerSuppressedPages.has(bookStartPage) && !pageChapterMap.has(bookStartPage)) {
    bookStartPage++;
  }

  // Calculate publication display page numbers for each chapter (1-indexed starting at bookStartPage)
  const chapterDisplayPages: number[] = chapters.map((_, i) => {
    const rawPage = chapterStartPages.get(i) || bookStartPage;
    return Math.max(1, rawPage - bookStartPage + 1);
  });

  // Render Table of Contents if configured
  if (tocPosition === 'start' && tocStartReservedPage > 0) {
    renderTocPages(
      doc,
      dims,
      fontFamily,
      chapters,
      chapterDisplayPages,
      includeOrnament,
      tocStartReservedPage,
      false
    );
  } else if (tocPosition === 'end' && chapters.length > 0) {
    doc.addPage([dims.width, dims.height]);
    currentPage++;
    const endTocPage = doc.getNumberOfPages();
    headerSuppressedPages.add(endTocPage);
    const lastPage = renderTocPages(
      doc,
      dims,
      fontFamily,
      chapters,
      chapterDisplayPages,
      includeOrnament,
      endTocPage,
      true
    );
    for (let ep = endTocPage; ep <= lastPage; ep++) {
      headerSuppressedPages.add(ep);
    }
  }

  // -------------------------------------------------------------
  // 6. RUNNING HEADERS & PAGE NUMBERS POST-PASS
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    const isSuppressed = headerSuppressedPages.has(p);
    const isOdd = p % 2 !== 0;

    // Running Header (suppressed on cover, title page, and chapter opening pages)
    if (includeRunningHeaders && !isSuppressed && p >= bookStartPage) {
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 120, 135);

      const headerY = dims.marginTop - 18;

      if (isOdd) {
        // Right-hand page: Chapter Title
        const chTitle = pageChapterMap.get(p) || shortBookTitle;
        doc.text(chTitle, dims.width - dims.marginRight, headerY, { align: 'right' });
      } else {
        // Left-hand page: Book Title
        doc.text(shortBookTitle, dims.marginLeft, headerY, { align: 'left' });
      }

      // Subtle hairline below running header
      doc.setDrawColor(225, 230, 238);
      doc.setLineWidth(0.4);
      doc.line(dims.marginLeft, headerY + 6, dims.width - dims.marginRight, headerY + 6);
    }

    // Running Footer / Page Number
    if (includePageNumbers && p >= bookStartPage) {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 110, 125);

      const footerY = dims.height - dims.marginBottom + 26;
      const pageNumText = `${p - bookStartPage + 1}`;

      doc.text(pageNumText, dims.width / 2, footerY, { align: 'center' });
    }
  }

  return doc;
}

/**
 * Convenience method to generate and trigger download of publication-ready vector PDF
 */
export async function exportBookToVectorPdf(
  book: EpubBook,
  options: PdfBookOptions = {}
): Promise<void> {
  const meta = book.metadata;
  const cleanTitle = (meta.title || 'book').replace(/[^a-zA-Z0-9_-]/g, '_');
  const doc = await generateVectorPdf(book, options);
  doc.save(`${cleanTitle}.pdf`);
}
