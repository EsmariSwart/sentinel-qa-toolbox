// Sentinel QA Toolbox - Content Script
// Injects overlay UI and handles ruler, typography, and element inspection

(function() {
  'use strict';

  // Create Shadow DOM to isolate our styles
  const shadowHost = document.createElement('div');
  shadowHost.id = 'sentinel-qa-host';
  document.body.appendChild(shadowHost);
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  // Inject styles into shadow DOM
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .sentinel-ruler-overlay {
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      border: 2px solid #03592a;
      background: rgba(3, 89, 42, 0.1);
      box-sizing: border-box;
    }
    .sentinel-ruler-info {
      position: fixed;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000000;
      white-space: pre-line;
      line-height: 1.4;
    }
    .sentinel-ruler-info strong {
      color: #03592a;
    }
    .sentinel-typography-highlight {
      outline: 2px solid #FF9800 !important;
      outline-offset: 2px;
      background: rgba(255, 152, 0, 0.1) !important;
    }
  `;
  shadowRoot.appendChild(styleSheet);

  // State
  let rulerEnabled = false;
  let typographyEnabled = false;
  let currentOverlay = null;
  let currentInfo = null;
  let highlightedElements = [];

  // Helper function to safely get className as string
  function getClassNameString(element) {
    if (!element.className) return '';
    
    // Handle SVG elements (SVGAnimatedString)
    if (typeof element.className === 'object' && element.className.baseVal !== undefined) {
      return element.className.baseVal || '';
    }
    
    // Handle DOMTokenList (classList)
    if (element.className instanceof DOMTokenList) {
      return Array.from(element.className).join(' ');
    }
    
    // Handle string
    if (typeof element.className === 'string') {
      return element.className;
    }
    
    return '';
  }

  // Load initial state
  chrome.storage.local.get(['rulerEnabled', 'typographyEnabled'], (result) => {
    rulerEnabled = result.rulerEnabled || false;
    typographyEnabled = result.typographyEnabled || false;
    if (rulerEnabled) enableRuler();
    if (typographyEnabled) enableTypography();
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleRuler') {
      rulerEnabled = request.enabled;
      if (rulerEnabled) {
        enableRuler();
      } else {
        disableRuler();
      }
      sendResponse({ success: true });
    } else if (request.action === 'toggleTypography') {
      typographyEnabled = request.enabled;
      if (typographyEnabled) {
        enableTypography();
      } else {
        disableTypography();
      }
      sendResponse({ success: true });
    }
    return true;
  });

  // Ruler functionality
  function enableRuler() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleElementClick);
  }

  function disableRuler() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleElementClick);
    removeOverlay();
  }

  function handleMouseMove(e) {
    if (!rulerEnabled) return;
    
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || element === shadowHost || shadowHost.contains(element)) return;

    const rect = element.getBoundingClientRect();
    showOverlay(rect, element);
  }

  function handleElementClick(e) {
    if (!rulerEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || element === shadowHost || shadowHost.contains(element)) return;

    captureElementInfo(element);
  }

  function showOverlay(rect, element) {
    removeOverlay();

    // Create overlay box
    currentOverlay = document.createElement('div');
    currentOverlay.className = 'sentinel-ruler-overlay';
    currentOverlay.style.left = rect.left + 'px';
    currentOverlay.style.top = rect.top + 'px';
    currentOverlay.style.width = rect.width + 'px';
    currentOverlay.style.height = rect.height + 'px';
    shadowRoot.appendChild(currentOverlay);

    // Get computed styles
    const styles = window.getComputedStyle(element);
    const margin = {
      top: parseInt(styles.marginTop) || 0,
      right: parseInt(styles.marginRight) || 0,
      bottom: parseInt(styles.marginBottom) || 0,
      left: parseInt(styles.marginLeft) || 0
    };
    const padding = {
      top: parseInt(styles.paddingTop) || 0,
      right: parseInt(styles.paddingRight) || 0,
      bottom: parseInt(styles.paddingBottom) || 0,
      left: parseInt(styles.paddingLeft) || 0
    };

    // Calculate distances to nearest siblings
    const distances = calculateDistances(element, rect);

    // Create info panel
    currentInfo = document.createElement('div');
    currentInfo.className = 'sentinel-ruler-info';
    currentInfo.style.left = (rect.right + 10) + 'px';
    currentInfo.style.top = rect.top + 'px';
    
    const classNameStr = getClassNameString(element);
    const classNameDisplay = classNameStr ? '.' + classNameStr.split(' ').filter(c => c).join('.') : '';
    const infoText = `
<strong>Element:</strong> ${element.tagName.toLowerCase()}${classNameDisplay}
<strong>Size:</strong> ${Math.round(rect.width)} x ${Math.round(rect.height)}px
<strong>Position:</strong> (${Math.round(rect.left)}, ${Math.round(rect.top)})
<strong>Margin:</strong> ${margin.top}/${margin.right}/${margin.bottom}/${margin.left}px
<strong>Padding:</strong> ${padding.top}/${padding.right}/${padding.bottom}/${padding.left}px
${distances.top !== null ? `<strong>Distance to top:</strong> ${distances.top}px` : ''}
${distances.bottom !== null ? `<strong>Distance to bottom:</strong> ${distances.bottom}px` : ''}
${distances.left !== null ? `<strong>Distance to left:</strong> ${distances.left}px` : ''}
${distances.right !== null ? `<strong>Distance to right:</strong> ${distances.right}px` : ''}
    `.trim();
    
    currentInfo.innerHTML = infoText.replace(/\n/g, '<br>');
    shadowRoot.appendChild(currentInfo);
  }

  function calculateDistances(element, rect) {
    const distances = { top: null, bottom: null, left: null, right: null };
    
    // Find nearest sibling elements
    const parent = element.parentElement;
    if (!parent) return distances;

    const siblings = Array.from(parent.children).filter(child => child !== element);
    
    siblings.forEach(sibling => {
      const siblingRect = sibling.getBoundingClientRect();
      
      // Top distance
      if (siblingRect.bottom <= rect.top) {
        const dist = rect.top - siblingRect.bottom;
        if (distances.top === null || dist < distances.top) {
          distances.top = Math.round(dist);
        }
      }
      
      // Bottom distance
      if (siblingRect.top >= rect.bottom) {
        const dist = siblingRect.top - rect.bottom;
        if (distances.bottom === null || dist < distances.bottom) {
          distances.bottom = Math.round(dist);
        }
      }
      
      // Left distance
      if (siblingRect.right <= rect.left) {
        const dist = rect.left - siblingRect.right;
        if (distances.left === null || dist < distances.left) {
          distances.left = Math.round(dist);
        }
      }
      
      // Right distance
      if (siblingRect.left >= rect.right) {
        const dist = siblingRect.left - rect.right;
        if (distances.right === null || dist < distances.right) {
          distances.right = Math.round(dist);
        }
      }
    });

    return distances;
  }

  function captureElementInfo(element) {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    const info = {
      url: window.location.href,
      selector: generateSelector(element),
      text: element.textContent.trim().substring(0, 100),
      boundingBox: {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      computedStyles: {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
        display: styles.display
      }
    };

    // Copy to clipboard
    const text = JSON.stringify(info, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      console.log('Element info copied to clipboard:', info);
    });

    // Show brief confirmation
    if (currentInfo) {
      const originalText = currentInfo.innerHTML;
      currentInfo.innerHTML = '<strong>Copied to clipboard!</strong>';
      setTimeout(() => {
        if (currentInfo) currentInfo.innerHTML = originalText;
      }, 1000);
    }
  }

  function generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    const classNameStr = getClassNameString(element);
    if (classNameStr) {
      const classes = classNameStr.split(' ').filter(c => c).join('.');
      if (classes) selector += '.' + classes;
    }
    
    // Add nth-child if needed for uniqueness
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element);
      if (siblings.filter(s => s.tagName === element.tagName).length > 1) {
        selector += `:nth-child(${index + 1})`;
      }
    }
    
    return selector;
  }

  function removeOverlay() {
    if (currentOverlay) {
      currentOverlay.remove();
      currentOverlay = null;
    }
    if (currentInfo) {
      currentInfo.remove();
      currentInfo = null;
    }
  }

  // Typography audit functionality
  function enableTypography() {
    analyzeTypography();
  }

  function disableTypography() {
    highlightedElements.forEach(el => {
      el.classList.remove('sentinel-typography-highlight');
    });
    highlightedElements = [];
  }

  function analyzeTypography() {
    // Find all text elements
    const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th, label, button'))
      .filter(el => {
        const text = el.textContent.trim();
        return text.length > 0 && window.getComputedStyle(el).display !== 'none';
      });

    if (textElements.length === 0) return;

    // Calculate dominant font properties
    const fontStats = {};
    textElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const key = `${styles.fontFamily}|${styles.fontSize}|${styles.fontWeight}`;
      fontStats[key] = (fontStats[key] || 0) + 1;
    });

    // Find the most common font
    const dominantFont = Object.entries(fontStats)
      .sort((a, b) => b[1] - a[1])[0][0];
    const [dominantFamily, dominantSize, dominantWeight] = dominantFont.split('|');

    // Highlight outliers
    textElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const size = parseFloat(styles.fontSize);
      const dominantSizeNum = parseFloat(dominantSize);
      
      // Highlight if font family, size (more than 20% different), or weight differs
      if (styles.fontFamily !== dominantFamily ||
          Math.abs(size - dominantSizeNum) / dominantSizeNum > 0.2 ||
          styles.fontWeight !== dominantWeight) {
        el.classList.add('sentinel-typography-highlight');
        highlightedElements.push(el);
        
        // Add click handler to show details
        el.addEventListener('click', (e) => {
          if (typographyEnabled) {
            e.preventDefault();
            e.stopPropagation();
            showTypographyDetails(el, styles, dominantFamily, dominantSize, dominantWeight);
          }
        }, { once: false });
      }
    });
  }

  function showTypographyDetails(element, styles, dominantFamily, dominantSize, dominantWeight) {
    removeOverlay();
    
    const rect = element.getBoundingClientRect();
    currentInfo = document.createElement('div');
    currentInfo.className = 'sentinel-ruler-info';
    currentInfo.style.left = (rect.right + 10) + 'px';
    currentInfo.style.top = rect.top + 'px';
    
    const infoText = `
<strong>Typography Details:</strong>
<strong>Font Family:</strong> ${styles.fontFamily}
${styles.fontFamily !== dominantFamily ? ' (differs from dominant)' : ''}
<strong>Font Size:</strong> ${styles.fontSize}
${parseFloat(styles.fontSize) !== parseFloat(dominantSize) ? ' (differs from dominant)' : ''}
<strong>Font Weight:</strong> ${styles.fontWeight}
${styles.fontWeight !== dominantWeight ? ' (differs from dominant)' : ''}
<strong>Line Height:</strong> ${styles.lineHeight}
<strong>Letter Spacing:</strong> ${styles.letterSpacing}
    `.trim();
    
    currentInfo.innerHTML = infoText.replace(/\n/g, '<br>');
    shadowRoot.appendChild(currentInfo);
  }

})();
