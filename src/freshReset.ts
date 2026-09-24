/**
 * freshReset.ts
 * 
 * NOTE: Automated reset on deployment is permanently disabled.
 * A frontend deployment/update must NEVER clear setup state or browser storage.
 * 
 * Preserves:
 * - app_first_time_setup_completed_v1
 * - dashboard_session_active
 * - client_tracking_sheets_config_v1
 * - client_tracking_sheets_db_v2
 * - client_tracking_sheets_db_v1
 */

export function manualResetOnly(): void {
  // Manual reset function placeholder if explicitly invoked by administrative tools
  console.info('Automated reset is permanently disabled to protect production deployments.');
}


