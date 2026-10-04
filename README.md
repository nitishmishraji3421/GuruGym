# Guru Gym PWA — v4

## Public gallery + owner media studio
- `index.html` — premium main website with a public Guru Gym Wall section
- `gallery.html` — standalone public gallery page
- `media-studio.html` — private owner media manager

### Owner Studio access
Default demo password: `GuruGym@2026!`
Change the SHA-256 hash in `media-studio.js` before production if you want a different front-end gate.

### Important production note
The owner gate is a front-end access layer only. It prevents normal visitors from using the upload/manage UI, but it is not a secure authentication system because the project is static. Uploaded files are stored in IndexedDB on the current browser/device. Public gallery items are readable by the public gallery on the same origin/device.

For true owner-only authentication and public multi-device publishing, connect the Media Studio to a backend/cloud storage service with authentication (e.g. Supabase, Firebase or a custom API).
