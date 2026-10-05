/**
 * LinkHub - Smart URL Shortener Engine
 * Implements real-time input validation, OpenAPI shortening with resilient fallbacks,
 * clipboard copying with native alert and UI feedback, and cross-linking to QR generator.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const shortenForm = document.getElementById('shortenForm');
  const urlInput = document.getElementById('urlInput');
  const clearBtn = document.getElementById('clearBtn');
  const shortenBtn = document.getElementById('shortenBtn');
  const resultSection = document.getElementById('resultSection');
  const shortenedOutput = document.getElementById('shortenedOutput');
  const copyBtn = document.getElementById('copyBtn');
  const copyIcon = document.getElementById('copyIcon');
  const copyBtnText = document.getElementById('copyBtnText');
  const openLinkBtn = document.getElementById('openLinkBtn');
  const makeQrBtn = document.getElementById('makeQrBtn');
  const newShortenBtn = document.getElementById('newShortenBtn');
  const toastContainer = document.getElementById('toastContainer');
  const sampleChips = document.querySelectorAll('.sample-chip');
  const logoContainer = document.getElementById('logoContainer');

  let currentShortUrl = '';

  // 1. Requirement 3-2: Disable button if input is empty, enable when input has text
  function updateButtonState() {
    const value = urlInput.value.trim();
    if (value.length > 0) {
      shortenBtn.disabled = false;
      clearBtn.style.display = 'flex';
    } else {
      shortenBtn.disabled = true;
      clearBtn.style.display = 'none';
    }
  }

  // Listen to various input events
  urlInput.addEventListener('input', updateButtonState);
  urlInput.addEventListener('keyup', updateButtonState);
  urlInput.addEventListener('change', updateButtonState);

  // Clear button click
  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    updateButtonState();
    urlInput.focus();
  });

  // Sample Chips
  sampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const url = chip.getAttribute('data-url');
      urlInput.value = url;
      updateButtonState();
      handleShorten();
    });
  });

  // 2. Normalize and validate URL
  function normalizeUrl(input) {
    let trimmed = input.trim();
    if (!trimmed) return '';

    // If starts with http:// or https://
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // If it looks like a domain name
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return 'https://' + trimmed;
    }

    return 'https://' + trimmed;
  }

  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  // 3. Requirement 3-3: Request URL Shortening to OpenAPI with Multi-Engine Fallback
  async function fetchWithTimeout(url, options = {}, timeoutMs = 3500) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function callShortenApi(targetUrl) {
    const encoded = encodeURIComponent(targetUrl);

    // List of resilient OpenAPI endpoints (CORS friendly & robust fallback chain)
    const apiEndpoints = [
      // Engine 1: spoo.me (Official CORS support & Fast)
      async () => {
        const formData = new URLSearchParams();
        formData.append('url', targetUrl);
        const res = await fetchWithTimeout('https://spoo.me/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: formData.toString()
        }, 3000);
        if (!res.ok) throw new Error(`spoo.me status ${res.status}`);
        const data = await res.json();
        if (data && data.short_url && data.short_url.startsWith('http')) {
          return data.short_url.trim();
        }
        throw new Error('Invalid spoo.me output');
      },

      // Engine 2: cleanuri (Clean URI API)
      async () => {
        const formData = new URLSearchParams();
        formData.append('url', targetUrl);
        const res = await fetchWithTimeout('https://cleanuri.com/api/v1/shorten', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        }, 3000);
        if (!res.ok) throw new Error(`cleanuri status ${res.status}`);
        const data = await res.json();
        if (data && data.result_url && data.result_url.startsWith('http')) {
          return data.result_url.trim();
        }
        throw new Error('Invalid cleanuri output');
      },

      // Engine 3: da.gd (CORS Friendly)
      async () => {
        const res = await fetchWithTimeout(`https://da.gd/s?url=${encoded}`, {}, 3000);
        if (!res.ok) throw new Error(`da.gd status ${res.status}`);
        const text = (await res.text()).trim();
        if (text && text.startsWith('http')) {
          return text;
        }
        throw new Error(`da.gd returned error: ${text}`);
      },

      // Engine 4: TinyURL OpenAPI
      async () => {
        const res = await fetchWithTimeout(`https://tinyurl.com/api-create.php?url=${encoded}`, {}, 3000);
        if (!res.ok) throw new Error(`TinyURL status ${res.status}`);
        const text = (await res.text()).trim();
        if (text && text.startsWith('http')) {
          return text;
        }
        throw new Error(`Invalid TinyURL: ${text}`);
      },

      // Engine 5: is.gd (Safe text mode with validation)
      async () => {
        const res = await fetchWithTimeout(`https://is.gd/create.php?format=simple&url=${encoded}`, {}, 3000);
        if (!res.ok) throw new Error(`is.gd status ${res.status}`);
        const text = (await res.text()).trim();
        if (text && text.startsWith('http') && !text.toLowerCase().includes('error')) {
          return text;
        }
        throw new Error(`is.gd error: ${text}`);
      },

      // Engine 6: v.gd (Safe text mode with validation)
      async () => {
        const res = await fetchWithTimeout(`https://v.gd/create.php?format=simple&url=${encoded}`, {}, 3000);
        if (!res.ok) throw new Error(`v.gd status ${res.status}`);
        const text = (await res.text()).trim();
        if (text && text.startsWith('http') && !text.toLowerCase().includes('error')) {
          return text;
        }
        throw new Error(`v.gd error: ${text}`);
      }
    ];

    let lastError = null;
    for (let i = 0; i < apiEndpoints.length; i++) {
      try {
        const result = await apiEndpoints[i]();
        if (result && (result.startsWith('http://') || result.startsWith('https://'))) {
          return result;
        }
      } catch (err) {
        console.warn(`[Shortener Engine ${i + 1}] failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error('모든 단축 API 서버 연결에 실패했습니다.');
  }

  // Handle Form Submission
  async function handleShorten() {
    const rawInput = urlInput.value.trim();
    if (!rawInput) {
      showToast('단축할 URL을 입력해 주세요.', 'error');
      urlInput.focus();
      return;
    }

    const processedUrl = normalizeUrl(rawInput);
    if (!isValidUrl(processedUrl)) {
      showToast('유효한 웹 URL 형식을 입력해 주세요.', 'error');
      urlInput.focus();
      return;
    }

    // Set Loading State
    shortenBtn.disabled = true;
    shortenBtn.classList.add('loading');
    
    try {
      showToast('OpenAPI로 단축 URL 생성 중...', 'info');
      const shortUrl = await callShortenApi(processedUrl);
      
      currentShortUrl = shortUrl;

      // Update Read-only Output Box
      shortenedOutput.value = shortUrl;
      openLinkBtn.href = shortUrl;
      
      // Show Result section
      resultSection.classList.add('show');

      // Smooth scroll to result
      setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);

      showToast('단축 URL이 성공적으로 생성되었습니다! 🚀', 'success');
    } catch (error) {
      console.error('Shorten Error:', error);
      showToast('URL 단축 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    } finally {
      shortenBtn.classList.remove('loading');
      updateButtonState();
    }
  }

  shortenForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!shortenBtn.disabled) {
      handleShorten();
    }
  });

  // 4. Requirement 3-4: Copy button copies automatically and shows '복사하였습니다' alert
  async function handleCopy() {
    const textToCopy = shortenedOutput.value.trim();
    if (!textToCopy) {
      showToast('복사할 단축 URL이 없습니다.', 'error');
      return;
    }

    let copySuccess = false;

    // Try modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        copySuccess = true;
      } catch (err) {
        console.warn('navigator.clipboard failed, using execCommand fallback', err);
      }
    }

    // Fallback if needed
    if (!copySuccess) {
      try {
        shortenedOutput.select();
        shortenedOutput.setSelectionRange(0, 99999);
        copySuccess = document.execCommand('copy');
      } catch (err) {
        console.error('Copy fallback failed', err);
      }
    }

    if (copySuccess) {
      // UI button feedback
      copyBtn.classList.add('copied');
      copyIcon.className = 'fa-solid fa-check';
      copyBtnText.textContent = '복사됨!';

      // Toast notification
      showToast('클립보드에 복사되었습니다! 📋', 'success');

      // Requirement 3-4: Alert modal popup '복사하였습니다'
      setTimeout(() => {
        alert('복사하였습니다');
      }, 50);

      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyIcon.className = 'fa-regular fa-copy';
        copyBtnText.textContent = '복사';
      }, 2500);
    } else {
      showToast('클립보드 복사에 실패했습니다. 수동으로 복사해 주세요.', 'error');
    }
  }

  copyBtn.addEventListener('click', handleCopy);

  // 5. Connect with QR Code generator (Transfer URL via query param)
  makeQrBtn.addEventListener('click', () => {
    if (!currentShortUrl) return;
    const qrUrl = `../url2qr/index.html?url=${encodeURIComponent(currentShortUrl)}`;
    window.location.href = qrUrl;
  });

  // New Shorten
  newShortenBtn.addEventListener('click', () => {
    urlInput.value = '';
    updateButtonState();
    resultSection.classList.remove('show');
    shortenedOutput.value = '';
    currentShortUrl = '';
    urlInput.focus();
  });

  logoContainer.addEventListener('click', () => {
    urlInput.value = '';
    updateButtonState();
    resultSection.classList.remove('show');
    shortenedOutput.value = '';
    currentShortUrl = '';
    urlInput.focus();
  });

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

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 400);
    }, 3500);
  }

  // Initial State Setup
  updateButtonState();
  urlInput.focus();
});
