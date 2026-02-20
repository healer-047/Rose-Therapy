/* =========================================================
   Rose Therapy — main.js
   Shared helpers: nav toggle, reveal on scroll, year, WhatsApp forms
   ========================================================= */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '447466024400';
  const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

  /** URL-encode message text for WhatsApp deep links */
  function encodeWhatsAppText(text) {
    return encodeURIComponent(text).replace(/%20/g, '%20');
  }

  /** Create a WhatsApp deep link with prefilled text */
  function makeWhatsAppLink(messageText) {
    const encoded = encodeWhatsAppText(messageText);
    return `${WHATSAPP_BASE}?text=${encoded}`;
  }

  /** Safe query selector */
  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  /** Set current year in footer */
  function setYear() {
    document.querySelectorAll('[data-year]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  /** Mobile nav toggle */
  function initNavToggle() {
    const toggle = $('.nav-toggle');
    const nav = $('#site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close nav when clicking a link (mobile)
    nav.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.tagName === 'A' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close nav on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /** Reveal elements on scroll */
  function initReveal() {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => io.observe(el));
  }

  /** Generic WhatsApp form handler for contact page (data-whatsapp-form) */
  function initWhatsAppForms() {
    const forms = Array.from(document.querySelectorAll('form[data-whatsapp-form]'));
    if (!forms.length) return;

    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic validation
        const nameInput = $('#cName', form);
        const countryInput = $('#cCountry', form);
        const msgInput = $('#cMessage', form);

        const errName = document.querySelector('[data-error-for="cName"]');
        const errCountry = document.querySelector('[data-error-for="cCountry"]');
        const errMsg = document.querySelector('[data-error-for="cMessage"]');

        const name = nameInput?.value?.trim() || '';
        const country = countryInput?.value?.trim() || '';
        const message = msgInput?.value?.trim() || '';

        let ok = true;

        if (!name) { ok = false; if (errName) errName.textContent = 'Please enter your name.'; }
        else if (errName) errName.textContent = '';

        if (!country) { ok = false; if (errCountry) errCountry.textContent = 'Please enter your country.'; }
        else if (errCountry) errCountry.textContent = '';

        if (!message) { ok = false; if (errMsg) errMsg.textContent = 'Please add a short message.'; }
        else if (errMsg) errMsg.textContent = '';

        if (!ok) return;

        const email = ($('#cEmail', form)?.value || '').trim();
        const preferred = ($('#cPreferred', form)?.value || '').trim();
        const consent = $('#cConsent', form)?.checked ? 'Yes' : 'Not specified';

        const msgText =
`Hi Rose Therapy, I'd like to get in touch.

Name: ${name}
Country: ${country}
Preferred date/time: ${preferred || 'Not specified'}
Email: ${email || 'Not provided'}
Consent to WhatsApp contact: ${consent}

Message: ${message}
`;

        const link = makeWhatsAppLink(msgText);

        // Open WhatsApp
        window.open(link, '_blank', 'noopener');

        // Show preview on page (optional UI)
        const previewWrap = document.getElementById('contactPreview');
        const previewPre = document.getElementById('contactMessagePreview');
        const openAgain = document.getElementById('contactOpenAgain');
        const copyBtn = document.getElementById('contactCopy');
        const copyStatus = document.getElementById('contactCopyStatus');

        if (previewWrap && previewPre && openAgain) {
          previewWrap.hidden = false;
          previewPre.textContent = msgText;
          openAgain.setAttribute('href', link);

          if (copyBtn && copyStatus) {
            copyBtn.onclick = async () => {
              try {
                await navigator.clipboard.writeText(msgText);
                copyStatus.textContent = 'Copied to clipboard.';
              } catch {
                copyStatus.textContent = 'Copy failed. Please select and copy manually.';
              }
            };
          }
        }
      });
    });
  }

  // Replace any .js-wa-link href that contains placeholder, if needed.
  // (Currently pages include full links already; this stays for robustness.)
  function initWhatsAppLinks() {
    const waLinks = Array.from(document.querySelectorAll('a.js-wa-link'));
    waLinks.forEach(a => {
      // If link points to base only, add a generic message
      const href = a.getAttribute('href') || '';
      if (href === WHATSAPP_BASE) {
        const msg = `Hi Rose Therapy, I'd like to book an online session.

Name:
Country:
Preferred date/time:
Type of session: Online (English)
`;
        a.setAttribute('href', makeWhatsAppLink(msg));
      }
    });
  }

  setYear();
  initNavToggle();
  initReveal();
  initWhatsAppForms();
  initWhatsAppLinks();

  // Expose a small namespace for booking.js (optional)
  window.RoseTherapy = window.RoseTherapy || {};
  window.RoseTherapy.makeWhatsAppLink = makeWhatsAppLink;

})();
