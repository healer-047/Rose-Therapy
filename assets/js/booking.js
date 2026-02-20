/* =========================================================
   Rose Therapy — booking.js
   - Renders a lightweight date picker
   - Renders timeslots in UK time (Europe/London) 09:00–18:00
   - Shows selected slot in UK + user's local time
   - Validates form and opens WhatsApp with a prefilled message
   ========================================================= */

(function () {
  'use strict';

  const UK_TZ = 'Europe/London';
  const WHATSAPP_NUMBER = '447466024400';
  const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

  // Elements
  const form = document.getElementById('booking-form');
  const calendarEl = document.getElementById('calendar');
  const timeslotsEl = document.getElementById('timeslots');
  const timeHelperEl = document.getElementById('timeHelper');
  const selectedSlotEl = document.getElementById('selectedSlot');

  const preferredDateInput = document.getElementById('preferredDate');
  const preferredTimeInput = document.getElementById('preferredTime');

  const waPreview = document.getElementById('waPreview');
  const waMessagePreview = document.getElementById('waMessagePreview');
  const waOpenAgain = document.getElementById('waOpenAgain');
  const copyMessageBtn = document.getElementById('copyMessage');
  const copyStatus = document.getElementById('copyStatus');
  const summaryBox = document.getElementById('summaryBox');

  // Form fields
  const fullName = document.getElementById('fullName');
  const email = document.getElementById('email');
  const phone = document.getElementById('phone');
  const country = document.getElementById('country');
  const timezone = document.getElementById('timezone');
  const topic = document.getElementById('topic');
  const sessionType = document.getElementById('sessionType');
  const notes = document.getElementById('notes');
  const consentWhatsApp = document.getElementById('consentWhatsApp');

  // Calendar state
  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-11
  let selectedDateISO = ''; // YYYY-MM-DD
  let selectedTimeUK = ''; // HH:MM (UK)
  const TIME_SLOTS = buildTimeSlots('09:00', '18:00', 60); // hourly

  // Init timezone input with user's local timezone
  if (timezone) {
    timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  function encode(text) {
    return encodeURIComponent(text);
  }

  function makeWaLink(message) {
    return `${WHATSAPP_BASE}?text=${encode(message)}`;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatISODate(y, m, d) {
    return `${y}-${pad2(m + 1)}-${pad2(d)}`;
  }

  function getDaysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }

  function startDayIndex(y, m) {
    // 0 = Sunday ... 6 = Saturday
    return new Date(y, m, 1).getDay();
  }

  function monthLabel(y, m) {
    const dt = new Date(y, m, 1);
    return dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  function buildTimeSlots(start, end, stepMinutes) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    const slots = [];
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    for (let t = startMin; t <= endMin; t += stepMinutes) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      slots.push(`${pad2(h)}:${pad2(m)}`);
    }
    return slots;
  }

  function isPastDateISO(dateISO) {
    // Compare in local time by converting to Date
    const [y, m, d] = dateISO.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    // allow today
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dt < startOfToday;
  }

  function clearErrors() {
    document.querySelectorAll('.error[data-error-for]').forEach(p => p.textContent = '');
  }

  function setError(fieldId, msg) {
    const el = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (el) el.textContent = msg;
  }

  function validEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  function renderCalendar() {
    if (!calendarEl) return;

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const startIdx = startDayIndex(viewYear, viewMonth);

    const head = document.createElement('div');
    head.className = 'cal-head';

    const title = document.createElement('h3');
    title.textContent = monthLabel(viewYear, viewMonth);

    const nav = document.createElement('div');
    nav.className = 'cal-nav';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'icon-btn';
    prev.setAttribute('aria-label', 'Previous month');
    prev.innerHTML = '&#x2039;';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'icon-btn';
    next.setAttribute('aria-label', 'Next month');
    next.innerHTML = '&#x203A;';

    prev.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      renderCalendar();
      // reset selection
      selectDate('');
    });

    next.addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      renderCalendar();
      // reset selection
      selectDate('');
    });

    nav.append(prev, next);
    head.append(title, nav);

    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    dows.forEach(d => {
      const dow = document.createElement('div');
      dow.className = 'cal-dow';
      dow.textContent = d;
      grid.appendChild(dow);
    });

    // Empty placeholders
    for (let i = 0; i < startIdx; i++) {
      const empty = document.createElement('div');
      empty.setAttribute('aria-hidden', 'true');
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = formatISODate(viewYear, viewMonth, day);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-btn';
      btn.textContent = String(day);
      btn.setAttribute('aria-label', `Select ${dateISO}`);

      if (dateISO === formatISODate(today.getFullYear(), today.getMonth(), today.getDate())) {
        btn.classList.add('is-today');
      }

      if (isPastDateISO(dateISO)) {
        btn.disabled = true;
      }

      if (dateISO === selectedDateISO) {
        btn.classList.add('is-selected');
      }

      btn.addEventListener('click', () => {
        selectDate(dateISO);
      });

      grid.appendChild(btn);
    }

    calendarEl.innerHTML = '';
    calendarEl.append(head, grid);
  }

  function renderTimeSlots() {
    if (!timeslotsEl) return;
    timeslotsEl.innerHTML = '';

    TIME_SLOTS.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'timeslot';
      btn.textContent = t;
      btn.setAttribute('role', 'listitem');

      if (!selectedDateISO) {
        btn.disabled = true;
        btn.style.opacity = '0.55';
        btn.style.cursor = 'not-allowed';
      }

      if (t === selectedTimeUK) btn.classList.add('is-selected');

      btn.addEventListener('click', () => {
        selectTime(t);
      });

      timeslotsEl.appendChild(btn);
    });
  }

  function selectDate(dateISO) {
    selectedDateISO = dateISO || '';
    preferredDateInput.value = selectedDateISO;
    // reset time selection when changing date
    selectedTimeUK = '';
    preferredTimeInput.value = '';
    updateSelectedSlotUI();
    renderCalendar();
    renderTimeSlots();
    updateTimeHelper();
  }

  function selectTime(timeUK) {
    if (!selectedDateISO) return;
    selectedTimeUK = timeUK;
    preferredTimeInput.value = selectedTimeUK;
    updateSelectedSlotUI();
    renderTimeSlots();
    updateTimeHelper();
  }

  function updateSelectedSlotUI() {
    if (!selectedSlotEl) return;

    if (!selectedDateISO || !selectedTimeUK) {
      selectedSlotEl.innerHTML = '<span class="muted">Select a date and time on the right.</span>';
      return;
    }

    const localTZ = timezone?.value?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const ukDisplay = formatDateTimeForTZ(selectedDateISO, selectedTimeUK, UK_TZ, 'en-GB');
    const localDisplay = formatDateTimeForTZ(selectedDateISO, selectedTimeUK, localTZ, 'en-GB');

    selectedSlotEl.innerHTML = `
      <div>
        <div><strong>UK time:</strong> ${ukDisplay}</div>
        <div class="tiny muted"><strong>Your time (${escapeHtml(localTZ)}):</strong> ${localDisplay}</div>
      </div>
    `;
  }

  function updateTimeHelper() {
    if (!timeHelperEl) return;

    if (!selectedDateISO) {
      timeHelperEl.innerHTML = '<span class="muted">Choose a date to enable time slots.</span>';
      return;
    }

    if (!selectedTimeUK) {
      const localTZ = timezone?.value?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const sample = formatDateTimeForTZ(selectedDateISO, TIME_SLOTS[0], localTZ, 'en-GB');
      timeHelperEl.innerHTML = `Selected date: <strong>${selectedDateISO}</strong>. Pick a time (UK).<br><span class="tiny muted">Example local time for ${TIME_SLOTS[0]} UK: ${sample}</span>`;
      return;
    }

    const localTZ = timezone?.value?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const ukDisplay = formatDateTimeForTZ(selectedDateISO, selectedTimeUK, UK_TZ, 'en-GB');
    const localDisplay = formatDateTimeForTZ(selectedDateISO, selectedTimeUK, localTZ, 'en-GB');

    timeHelperEl.innerHTML = `
      <strong>UK (Europe/London):</strong> ${ukDisplay}<br>
      <span class="tiny muted"><strong>Your time (${escapeHtml(localTZ)}):</strong> ${localDisplay}</span>
    `;
  }

  /**
   * Convert a selected UK date/time into a formatted string for a given timezone.
   * We interpret the chosen time as a "UK wall-clock time" on that date,
   * then show it in the user's timezone for convenience.
   *
   * Implementation approach:
   * - Create a Date in UTC that corresponds to the UK date/time by using
   *   Intl with timeZone=Europe/London to compute offset implicitly.
   *
   * Note: Handling DST exactly without dependencies is tricky; we use a robust
   * method by constructing a date from parts using Intl.
   */
  function formatDateTimeForTZ(dateISO, timeHHMM, targetTZ, locale) {
    const dt = makeDateFromUKWallTime(dateISO, timeHHMM);
    return new Intl.DateTimeFormat(locale || 'en-GB', {
      timeZone: targetTZ,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dt);
  }

  /**
   * Build a Date object representing the instant corresponding to the given
   * UK wall-clock date + time.
   *
   * Strategy:
   * 1) Start with a naive UTC Date from the components.
   * 2) Format that date in UK timezone to see what UK time it would be.
   * 3) Adjust by the difference between desired UK time and formatted UK time.
   *
   * This yields a close approximation even across DST changes.
   */
  function makeDateFromUKWallTime(dateISO, timeHHMM) {
    const [y, m, d] = dateISO.split('-').map(Number);
    const [hh, mm] = timeHHMM.split(':').map(Number);

    // Start with a UTC date that matches the components
    let dt = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));

    // Find what time that instant corresponds to in UK (may differ due to offset)
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: UK_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(dt);

    const gotH = Number(parts.find(p => p.type === 'hour')?.value || '0');
    const gotM = Number(parts.find(p => p.type === 'minute')?.value || '0');

    const desired = hh * 60 + mm;
    const got = gotH * 60 + gotM;
    const diffMinutes = desired - got;

    dt = new Date(dt.getTime() + diffMinutes * 60000);
    return dt;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }

  function buildWhatsAppMessage() {
    const nameVal = fullName.value.trim();
    const emailVal = email.value.trim();
    const phoneVal = phone.value.trim();
    const countryVal = country.value.trim();
    const tzVal = (timezone.value || '').trim() || 'UTC';
    const topicVal = (topic.value || '').trim();
    const sessionVal = (sessionType.value || '').trim();
    const notesVal = (notes.value || '').trim();
    const consentVal = consentWhatsApp.checked ? 'Yes' : 'Not specified';

    const ukDisplay = selectedDateISO && selectedTimeUK
      ? formatDateTimeForTZ(selectedDateISO, selectedTimeUK, UK_TZ, 'en-GB')
      : 'Not selected';

    const localDisplay = selectedDateISO && selectedTimeUK
      ? formatDateTimeForTZ(selectedDateISO, selectedTimeUK, tzVal, 'en-GB')
      : 'Not selected';

    const msg =
`Hi Rose Therapy, I'd like to book a session.

Name: ${nameVal}
Email: ${emailVal}
Phone (optional): ${phoneVal || 'Not provided'}
Country: ${countryVal}
Timezone: ${tzVal}

Topic/issue: ${topicVal}
Type of session: ${sessionVal}

Preferred date/time (UK): ${ukDisplay}
Preferred date/time (my local time): ${localDisplay}

Notes: ${notesVal || 'None'}

Consent to being contacted on WhatsApp: ${consentVal}
`;
    return msg;
  }

  function renderSummary() {
    if (!summaryBox) return;

    const tzVal = (timezone.value || '').trim() || 'UTC';

    const rows = [
      ['Name', fullName.value.trim()],
      ['Country', country.value.trim()],
      ['Topic', topic.value],
      ['Session', sessionType.value],
      ['Preferred (UK)', selectedDateISO && selectedTimeUK ? formatDateTimeForTZ(selectedDateISO, selectedTimeUK, UK_TZ, 'en-GB') : 'Not selected'],
      [`Preferred (${tzVal})`, selectedDateISO && selectedTimeUK ? formatDateTimeForTZ(selectedDateISO, selectedTimeUK, tzVal, 'en-GB') : 'Not selected'],
      ['Consent (WhatsApp)', consentWhatsApp.checked ? 'Yes' : 'Not specified'],
    ];

    summaryBox.innerHTML = rows.map(([k, v]) => `
      <div class="row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v || '')}</span></div>
    `).join('');
  }

  function validate() {
    clearErrors();

    let ok = true;

    const nameVal = fullName.value.trim();
    const emailVal = email.value.trim();
    const countryVal = country.value.trim();
    const tzVal = timezone.value.trim();

    if (!nameVal) { ok = false; setError('fullName', 'Please enter your full name.'); }
    if (!emailVal) { ok = false; setError('email', 'Please enter your email.'); }
    else if (!validEmail(emailVal)) { ok = false; setError('email', 'Please enter a valid email address.'); }

    if (!countryVal) { ok = false; setError('country', 'Please enter your country.'); }
    if (!tzVal) { ok = false; setError('timezone', 'Please enter your timezone.'); }
    if (!topic.value) { ok = false; setError('topic', 'Please select a topic.'); }

    if (!preferredDateInput.value) { ok = false; setError('preferredDate', 'Please select a date.'); }
    if (!preferredTimeInput.value) { ok = false; setError('preferredTime', 'Please select a time slot.'); }

    return ok;
  }

  function init() {
    if (!calendarEl || !timeslotsEl || !form) return;

    // Default select today (if not past) to reduce friction
    const todayISO = formatISODate(today.getFullYear(), today.getMonth(), today.getDate());
    if (!isPastDateISO(todayISO)) {
      selectDate(todayISO);
    } else {
      renderCalendar();
      renderTimeSlots();
      updateTimeHelper();
    }

    // When user edits timezone, refresh helper and selected slot preview
    timezone.addEventListener('input', () => {
      updateSelectedSlotUI();
      updateTimeHelper();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validate()) {
        // Scroll to first error message for accessibility
        const firstError = document.querySelector('.error[data-error-for]:not(:empty)');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const msg = buildWhatsAppMessage();
      const link = makeWaLink(msg);

      // Open WhatsApp in new tab
      window.open(link, '_blank', 'noopener');

      // Show preview
      if (waPreview && waMessagePreview && waOpenAgain) {
        waPreview.hidden = false;
        waMessagePreview.textContent = msg;
        waOpenAgain.setAttribute('href', link);

        renderSummary();

        if (copyMessageBtn && copyStatus) {
          copyMessageBtn.onclick = async () => {
            try {
              await navigator.clipboard.writeText(msg);
              copyStatus.textContent = 'Copied to clipboard.';
            } catch {
              copyStatus.textContent = 'Copy failed. Please select and copy manually.';
            }
          };
        }

        waPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  init();

})();
