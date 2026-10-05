/**
 * QR Studio - Smart QR Code Generator
 * Handles UI animations, QR code rendering, and high-quality JPG export.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const qrForm = document.getElementById('qrForm');
  const urlInput = document.getElementById('urlInput');
  const clearBtn = document.getElementById('clearBtn');
  const generateBtn = document.getElementById('generateBtn');
  const qrcodeContainer = document.getElementById('qrcode');
  const qrCodeWrapper = document.getElementById('qrCodeWrapper');
  const qrDisplayContainer = document.getElementById('qrDisplayContainer');
  const targetUrlText = document.getElementById('targetUrlText');
  const downloadJpgBtn = document.getElementById('downloadJpgBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const resetBtn = document.getElementById('resetBtn');
  const logoContainer = document.getElementById('logoContainer');
  const sampleChips = document.querySelectorAll('.sample-chip');
  const toastContainer = document.getElementById('toastContainer');

  let currentQrCodeInstance = null;
  let currentTargetUrl = '';

  // 1. Input Change Listener (Show/Hide Clear Button)
  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim().length > 0) {
      clearBtn.style.display = 'flex';
    } else {
      clearBtn.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.style.display = 'none';
    urlInput.focus();
  });

  // 2. Sample Chips Click Handler
  sampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleUrl = chip.getAttribute('data-url');
      urlInput.value = sampleUrl;
      clearBtn.style.display = 'flex';
      handleGenerateQR();
    });
  });

  // 3. Form Submit / Generate Button
  qrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGenerateQR();
  });

  function normalizeUrl(input) {
    let trimmed = input.trim();
    if (!trimmed) return '';
    
    // Check if starts with protocol or mailto/tel
    if (!/^[a-zA-Z]+:\/\//.test(trimmed) && !trimmed.startsWith('mailto:') && !trimmed.startsWith('tel:')) {
      // If it looks like a domain or text, default to https://
      if (trimmed.includes('.') && !trimmed.includes(' ')) {
        return 'https://' + trimmed;
      }
    }
    return trimmed;
  }

  // 4. Generate QR Code
  function handleGenerateQR() {
    const rawValue = urlInput.value.trim();
    if (!rawValue) {
      showToast('변환할 URL 또는 텍스트를 입력해 주세요.', 'error');
      urlInput.focus();
      return;
    }

    const processedUrl = normalizeUrl(rawValue);
    currentTargetUrl = processedUrl;

    // Clear previous QR code
    qrcodeContainer.innerHTML = '';

    try {
      // Create QR Code with qrcode.js
      currentQrCodeInstance = new QRCode(qrcodeContainer, {
        text: processedUrl,
        width: 220,
        height: 220,
        colorDark: "#090d16",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });

      // Update UI state
      targetUrlText.textContent = processedUrl;
      body.classList.add('has-qr');

      // Scroll smoothly to keep view balanced if needed
      window.scrollTo({ top: 0, behavior: 'smooth' });

      showToast('QR 코드가 성공적으로 생성되었습니다! 🎉', 'success');
    } catch (err) {
      console.error('QR Code Generation Error:', err);
      showToast('QR 코드 생성 중 오류가 발생했습니다.', 'error');
    }
  }

  // 5. Download QR Code as JPG
  function downloadQrAsJpg() {
    if (!body.classList.contains('has-qr')) return;

    // Find the canvas or img inside the #qrcode container
    const qrCanvas = qrcodeContainer.querySelector('canvas');
    const qrImg = qrcodeContainer.querySelector('img');

    if (!qrCanvas && !qrImg) {
      showToast('다운로드할 QR 코드를 찾을 수 없습니다.', 'error');
      return;
    }

    // Create high-resolution export canvas (800x800 with white padding & optional watermark/border)
    const exportCanvas = document.createElement('canvas');
    const exportSize = 800;
    const padding = 100;
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;

    const ctx = exportCanvas.getContext('2d');

    // Fill clean white background (essential for JPG format)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    function drawAndSave(sourceElement) {
      // Draw QR Code centered with high quality
      ctx.imageSmoothingEnabled = false; // Sharp pixel edges for QR
      ctx.drawImage(
        sourceElement,
        padding,
        padding,
        exportSize - (padding * 2),
        exportSize - (padding * 2)
      );

      // Subtle bottom text with domain or target
      ctx.fillStyle = '#64748b';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      
      let displayText = currentTargetUrl;
      if (displayText.length > 42) {
        displayText = displayText.substring(0, 39) + '...';
      }
      ctx.fillText(displayText, exportSize / 2, exportSize - 40);

      // Convert to JPG Data URL with high quality 0.95
      const jpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);

      // Format clean filename
      let fileName = 'qrcode';
      try {
        const urlObj = new URL(currentTargetUrl);
        const host = urlObj.hostname.replace(/www\./, '').replace(/[^a-zA-Z0-9]/g, '_');
        if (host) fileName = `qrcode_${host}`;
      } catch (e) {
        fileName = 'qrcode_' + Date.now();
      }
      fileName += '.jpg';

      // Trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = jpgDataUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast(`'${fileName}' JPG 다운로드가 완료되었습니다! 🚀`, 'success');
    }

    if (qrCanvas) {
      drawAndSave(qrCanvas);
    } else if (qrImg) {
      if (qrImg.complete && qrImg.naturalWidth !== 0) {
        drawAndSave(qrImg);
      } else {
        qrImg.onload = () => drawAndSave(qrImg);
      }
    }
  }

  // QR Code Area Click -> Direct Download
  qrCodeWrapper.addEventListener('click', (e) => {
    downloadQrAsJpg();
  });

  // Action Button: Download JPG
  downloadJpgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadQrAsJpg();
  });

  // Action Button: Copy Link
  copyLinkBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentTargetUrl) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentTargetUrl);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = currentTargetUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('링크가 클립보드에 복사되었습니다! 📋', 'info');
    } catch (err) {
      showToast('링크 복사에 실패했습니다.', 'error');
    }
  });

  // Reset to initial state
  function resetApp() {
    body.classList.remove('has-qr');
    urlInput.value = '';
    clearBtn.style.display = 'none';
    qrcodeContainer.innerHTML = '';
    currentTargetUrl = '';
    urlInput.focus();
  }

  resetBtn.addEventListener('click', resetApp);
  logoContainer.addEventListener('click', resetApp);

  // 6. Toast Notification Helper
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="${iconClass} toast-icon"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove after 3.5s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 400);
    }, 3500);
  }

  // URL Query Parameter Auto-Load (e.g. ?url=https://...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get('url');
    if (paramUrl) {
      urlInput.value = paramUrl;
      clearBtn.style.display = 'flex';
      handleGenerateQR();
    } else {
      urlInput.focus();
    }
  } catch (e) {
    urlInput.focus();
  }
});
