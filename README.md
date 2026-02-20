# Rose Therapy — Static Website (HTML/CSS/JS)

This is a lightweight, premium-looking static website for **Rose Therapy**.

## Pages
- `index.html` — homepage
- `booking.html` — booking form + UK-time calendar + WhatsApp message generation
- `services.html` — services overview
- `about.html` — about page (placeholders for credentials)
- `pricing.html` — pricing (shows £400 → £200)
- `faq.html` — FAQ accordion
- `contact.html` — contact form that routes to WhatsApp
- `privacy.html`, `terms.html`, `disclaimer.html` — legal templates

## Quick start
Open `index.html` in a browser (double-click), or run a local server:

### Option A: VS Code Live Server
1. Open the folder in VS Code
2. Right-click `index.html` → “Open with Live Server”

### Option B: Python (macOS/Linux)
```bash
python3 -m http.server 8080
```
Then open http://localhost:8080

### Option C: Python (Windows)
```bash
py -m http.server 8080
```

## Customise
- WhatsApp number: search for `447466024400` in the project.
- Replace testimonial placeholders in `index.html` before publishing.
- Replace placeholders in `about.html` and `privacy/terms` pages with real details.

## Notes
- Booking time slots are displayed in **UK time (Europe/London)**.
- A preview shows both UK and the visitor's local timezone.
- This project avoids external dependencies and frameworks.
