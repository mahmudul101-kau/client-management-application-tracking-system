// One-time execution to reset the local setup state if requested.
// This clears the local setup flag, active session, saved Google Sheets URL, and locally cached clients.
// It sets a permanent local marker so it NEVER runs again on future startups.
// It does NOT touch any remote Google Sheet.
(function runOneTimeFreshReset() {
  if (typeof window === 'undefined') return;
  const RESET_MARKER = 'fresh_reset_completed_v1';
  try {
    // If the one-time reset has already been executed, DO NOT run it again.
    if (localStorage.getItem(RESET_MARKER) === 'true') {
      return;
    }

    // First launch before fresh setup: Clear old local configuration and flags
    localStorage.removeItem('app_first_time_setup_completed_v1');
    sessionStorage.removeItem('dashboard_session_active');
    localStorage.removeItem('client_tracking_sheets_config_v1');
    localStorage.removeItem('client_tracking_sheets_db_v2');
    localStorage.removeItem('client_tracking_sheets_db_v1');

    // Store the one-time marker permanently so all future startups skip this reset
    localStorage.setItem(RESET_MARKER, 'true');
  } catch (e) {
    console.error('Error performing fresh start reset:', e);
  }
})();

