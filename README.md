# 🎪 Melange '26 - College Fest Mobile UI Portal

> **Pixel-Perfect Implementation of the Melange Event Management UI (Figma Design)**  
> **Built Pure Client-Side ("Without Data" Mode & "Sample Data" Preview)**

---

## 📱 What Was Built

The application replicates all **5 design boards (20 distinct smartphone screens)** uploaded in the design mockups:

1. **Board 1: Mobile-First AI Authentication Design**
   * **Splash Screen**: Deep violet gradient, golden Melange cursive logo with firework spark, loading spinner ring, *"Where Celebrations Begin"*.
   * **Login Screen**: Soft backdrop, username/college ID input, password input with show/hide toggle, purple button, *"Forgot password?"*.
   * **Role Based Login**: *"Choose Your Role"* cards for **Admin Login** & **College GS Login**.
   * **Password Reset Screen**: Email input, Send Reset Link, and green recovery link toast notification banner.

2. **Board 2: Mobile-First Admin Management UI**
   * **Dashboard Home**: Top bar with Admin badge, notification bell with red badge, *"Hello, Admin!"*, 4 colorful 2x2 stat cards (Total Colleges, Total Participants, Total Events, Pending Actions), Quick Actions (*Announce*, *Add Event*).
   * **Colleges Management**: Search bar, college cards (St. Xavier's, IIT Bombay, etc.) with active badges, GS names, participant count, and View/Edit/Manage buttons.
   * **Events Management (Admin)**: Add New button, Battle of the Bands and Fashion Show cards with categories, dates, Open/Closed status, and Edit/Delete buttons.
   * **Registration Overview**: Filter tabs (All / Pending / Approved), candidate cards with avatars, and Approve / Reject / View buttons.

3. **Board 3: Mobile-First College GS Portal UI**
   * **GS Dashboard Home**: Scoped header (*"GS: St. Xavier's College - GS can only see their own college data"*), *"Hello, GS Rahul!"*, blue college badge, Quick Stats with circular SVG progress gauge, touch-friendly recent activity cards.
   * **Participant Management**: Search input with filter button, enrolled participant cards with department, year, event, and View/Edit/Delete actions.
   * **Add New Participant (Full Form)**: Full Name, Department dropdown, Year pill selectors (1st, 2nd, 3rd, 4th Yr), Phone, Email, Event selection, and Save Participant button.
   * **Events & Reports**: Available slot cards with "+ Add Participant" gold buttons, and College Summary report card with one-click **"Download Participant List (PDF/Excel)"** CSV export.

4. **Board 4: Events & Categories Management**
   * **Events List**: Search bar, filter toggle switch (*"Filter by event categories"*), category icons (Music, Fashion, Drama, Gaming), Open/Full/Closed badges, and Floating Action Button (+).
   * **Create New Event Form**: Event Name, Description, Rules, Category & Time, Venue, Participant Limit stepper `[- 0 +]`, Deadline, and Create button.
   * **Event Categories**: List of categories with event counts, edit & delete buttons, and "+ Add Category" button.
   * **Delete Event Modal**: Bottom sheet confirmation dialog (*"Delete Event? Are you sure you want to delete 'Battle of the Bands'? This action cannot be undone."*).

5. **Board 5: Registrations Management, Filter Modal & Empty State**
   * **Registrations (List View)**: Active filter tags (*"Pending ✕"*, *"All Colleges ✕"*), student cards with status badges, and quick Approve / Reject actions.
   * **Filter & Sort Bottom Sheet Modal**: Filter by College, Event, Year, and Status pills.
   * **Registration Details Screen**: Avatar circle (AM), Student ID, Event Registration, Contact info, Academic info, Status, and Approve / Reject buttons.
   * **Empty State Screen**: Magnifying glass document vector illustration, *"No pending registrations found"*, *"Try adjusting your filters or search query"*, and *"Clear Filters"* button.

---

## ⚡ "Without Data" Mode & Key Features

* **Zero Backend Requirement**: Runs 100% inside any browser without Node.js, Express, or MongoDB.
* **Mode: Without Data (Clean)**: Starts completely clean with 0 stats, empty lists, blank forms, and clean empty state illustrations ready for real college fest data.
* **Mode: With Sample Data**: One-click toggle in the top bar to populate the exact mock data from the uploaded Figma screenshots.
* **Interactive Smartphone Simulator**: Displays inside a mobile smartphone bezel (360px–430px) on desktop, or expands to full screen on real mobile phones.
* **Gallery Mode**: Displays all 5 boards side-by-side like Figma design artboards.
* **Screen Jumper**: Instantly navigate to any of the 20 screens from the top dropdown menu.
* **Real CSV Export**: Tapping *"Download Participant List (PDF/Excel)"* generates a real `.csv` file download.

---

## 🚀 How to Run

The default `index.html` opens the **GS Portal login**. The previous event-management app is kept separately as `app.html` (or `public/app.html`).

For GitHub Pages, publish the `main` branch from the repository root. The build script generates matching entry points for the repository root and the `public` folder, so the default route works with either Pages source.

To rebuild the static entry points, run `node build_webapp.js` from this folder.

For local use, **double-click** either:
* [`open.bat`](open.bat)
* [`run.bat`](run.bat)
* Or double-click [`index.html`](index.html) directly!

Admin and GS sign-ins use the Node authentication API. First-time GS users can select a registered college and create their own username and password from the GS login screen; the account is stored in `data/melange_db.json` with a server-generated password hash, and they must sign in afterward. Login history is stored in the same database. Start the Node server for registration and database-backed login. GitHub Pages alone cannot run the API or write to this database.
