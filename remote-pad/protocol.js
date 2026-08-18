/**
 * Remote Pad wire protocol (shared contract between Buddy server and mobile clients).
 * Keep message `type` values in sync with remote-desktop RemotePadProtocol.kt.
 */

/** @typedef {'auth'|'move'|'moveTo'|'click'|'clickAt'|'doubleClick'|'doubleClickAt'|'tripleClick'|'tripleClickAt'|'rightClick'|'rightClickAt'|'middleClick'|'middleClickAt'|'scroll'|'scrollAt'|'scrollH'|'scrollHAt'|'type'|'key'|'mouseDown'|'mouseDownAt'|'mouseUp'|'shellExec'|'listDir'|'agentStop'|'agentApprove'|'agentDeny'|'agentSendInput'|'ping'} ClientMessageType */
/** @typedef {'auth_ok'|'auth_fail'|'pong'|'error'|'status'|'shell_output'|'dir_list'|'agentSessionList'|'agentSessionUpdate'|'agentSessionRemove'|'agentPermissionRequest'|'agentPermissionResolved'|'agentStopResult'} ServerMessageType */

const CLIENT_MESSAGE_TYPES = Object.freeze({
  AUTH: 'auth',
  MOVE: 'move',
  MOVE_TO: 'moveTo',
  CLICK: 'click',
  CLICK_AT: 'clickAt',
  DOUBLE_CLICK: 'doubleClick',
  DOUBLE_CLICK_AT: 'doubleClickAt',
  TRIPLE_CLICK: 'tripleClick',
  TRIPLE_CLICK_AT: 'tripleClickAt',
  RIGHT_CLICK: 'rightClick',
  RIGHT_CLICK_AT: 'rightClickAt',
  MIDDLE_CLICK: 'middleClick',
  MIDDLE_CLICK_AT: 'middleClickAt',
  SCROLL: 'scroll',
  SCROLL_AT: 'scrollAt',
  SCROLL_H: 'scrollH',
  SCROLL_H_AT: 'scrollHAt',
  TYPE: 'type',
  KEY: 'key',
  MOUSE_DOWN: 'mouseDown',
  MOUSE_DOWN_AT: 'mouseDownAt',
  MOUSE_UP: 'mouseUp',
  SHELL_EXEC: 'shellExec',
  LIST_DIR: 'listDir',
  CLIPBOARD_SET: 'clipboardSet',
  CLIPBOARD_IMAGE_CHUNK: 'clipboardImageChunk',
  FILE_CHUNK: 'fileChunk',
  FILE_TO_PHONE_CHUNK: 'fileToPhoneChunk',
  FILE_TRANSFER_CANCEL: 'fileTransferCancel',
  SCREEN_SHARE: 'screenShare',
  WEBRTC_REQUEST: 'webrtc_request',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE: 'webrtc_ice',
  WEBRTC_HANGUP: 'webrtc_hangup',
  REMOTE_P2P_REQUEST: 'remote_p2p_request',
  REMOTE_P2P_ANSWER: 'remote_p2p_answer',
  REMOTE_P2P_ICE: 'remote_p2p_ice',
  REMOTE_P2P_HANGUP: 'remote_p2p_hangup',
  REMOTE_P2P_FALLBACK: 'remote_p2p_fallback',
  REQUEST_SCREENSHOT: 'requestScreenshot',
  AGENT_STOP: 'agentStop',
  AGENT_APPROVE: 'agentApprove',
  AGENT_DENY: 'agentDeny',
  AGENT_SEND_INPUT: 'agentSendInput',
  AGENT_SESSION_REFRESH: 'agentSessionRefresh',
  AGENT_SESSION_LOG: 'agentSessionLog',
  AGENT_CLI_LIST: 'agentCliList',
  AGENT_ADAPTER_LIST: 'agentAdapterList',
  AGENT_HOOK_INSTALL: 'agentHookInstall',
  AGENT_HOOK_UNINSTALL: 'agentHookUninstall',
  AGENT_LAUNCH: 'agentLaunch',
  INSERT_PIN: 'insertPin',
  PINS_LIST: 'pinsList',
  PING: 'ping',
  PHONE_CAM_OFFER: 'phone_cam_offer',
  PHONE_CAM_ICE: 'phone_cam_ice',
  PHONE_CAM_HANGUP: 'phone_cam_hangup',
});

const SERVER_MESSAGE_TYPES = Object.freeze({
  AUTH_OK: 'auth_ok',
  AUTH_FAIL: 'auth_fail',
  PONG: 'pong',
  ERROR: 'error',
  STATUS: 'status',
  SHELL_OUTPUT: 'shell_output',
  DIR_LIST: 'dir_list',
  FILE_SAVED: 'file_saved',
  FILE_TRANSFER_PROGRESS: 'fileTransferProgress',
  FILE_TRANSFER_CANCELLED: 'fileTransferCancelled',
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ICE: 'webrtc_ice',
  WEBRTC_CLOSED: 'webrtc_closed',
  REMOTE_P2P_OFFER: 'remote_p2p_offer',
  REMOTE_P2P_ICE: 'remote_p2p_ice',
  REMOTE_P2P_CONNECTED: 'remote_p2p_connected',
  REMOTE_P2P_FAILED: 'remote_p2p_failed',
  SCREENSHOT_SENT: 'screenshot_sent',
  SCREENSHOT_FAILED: 'screenshot_failed',
  AGENT_SESSION_LIST: 'agentSessionList',
  AGENT_SESSION_UPDATE: 'agentSessionUpdate',
  AGENT_SESSION_REMOVE: 'agentSessionRemove',
  AGENT_SESSION_OUTPUT: 'agentSessionOutput',
  AGENT_SESSION_LOG: 'agentSessionLog',
  AGENT_PERMISSION_REQUEST: 'agentPermissionRequest',
  AGENT_PERMISSION_RESOLVED: 'agentPermissionResolved',
  AGENT_STOP_RESULT: 'agentStopResult',
  AGENT_CLI_LIST: 'agentCliList',
  AGENT_ADAPTER_LIST: 'agentAdapterList',
  AGENT_HOOK_INSTALL_RESULT: 'agentHookInstallResult',
  AGENT_HOOK_UNINSTALL_RESULT: 'agentHookUninstallResult',
  AGENT_LAUNCH_RESULT: 'agentLaunchResult',
  INSERT_PIN_RESULT: 'insertPinResult',
  PINS_LIST: 'pinsList',
  CLIPBOARD_SYNC: 'clipboardSync',
  PHONE_CAM_REQUEST: 'phone_cam_request',
  PHONE_CAM_ANSWER: 'phone_cam_answer',
  PHONE_CAM_ICE: 'phone_cam_ice',
  PHONE_CAM_CLOSED: 'phone_cam_closed',
});

/** Client message types handled by agent session service (not input-handler). */
const AGENT_CLIENT_TYPES = new Set([
  CLIENT_MESSAGE_TYPES.AGENT_STOP,
  CLIENT_MESSAGE_TYPES.AGENT_APPROVE,
  CLIENT_MESSAGE_TYPES.AGENT_DENY,
  CLIENT_MESSAGE_TYPES.AGENT_SEND_INPUT,
  CLIENT_MESSAGE_TYPES.AGENT_SESSION_REFRESH,
  CLIENT_MESSAGE_TYPES.AGENT_SESSION_LOG,
  CLIENT_MESSAGE_TYPES.AGENT_CLI_LIST,
  CLIENT_MESSAGE_TYPES.AGENT_ADAPTER_LIST,
  CLIENT_MESSAGE_TYPES.AGENT_HOOK_INSTALL,
  CLIENT_MESSAGE_TYPES.AGENT_HOOK_UNINSTALL,
  CLIENT_MESSAGE_TYPES.AGENT_LAUNCH,
]);

/** Client message types handled by LAN P2P signaling (not input-handler). */
const LAN_P2P_CLIENT_TYPES = new Set([
  CLIENT_MESSAGE_TYPES.SCREEN_SHARE,
  CLIENT_MESSAGE_TYPES.WEBRTC_REQUEST,
  CLIENT_MESSAGE_TYPES.WEBRTC_ANSWER,
  CLIENT_MESSAGE_TYPES.WEBRTC_ICE,
  CLIENT_MESSAGE_TYPES.WEBRTC_HANGUP,
]);

/** Phone → PC WebRTC signaling for using the phone camera as a Buddy webcam. */
const PHONE_CAM_CLIENT_TYPES = new Set([
  CLIENT_MESSAGE_TYPES.PHONE_CAM_OFFER,
  CLIENT_MESSAGE_TYPES.PHONE_CAM_ICE,
  CLIENT_MESSAGE_TYPES.PHONE_CAM_HANGUP,
]);

const DEFAULT_PORT = 8765;
/** HTTP port offset for free LAN stream + file upload (8766 when WS is 8765). */
const LAN_HTTP_PORT_OFFSET = 1;
const PROTOCOL_VERSION = 1;

module.exports = {
  CLIENT_MESSAGE_TYPES,
  SERVER_MESSAGE_TYPES,
  LAN_P2P_CLIENT_TYPES,
  PHONE_CAM_CLIENT_TYPES,
  AGENT_CLIENT_TYPES,
  DEFAULT_PORT,
  LAN_HTTP_PORT_OFFSET,
  PROTOCOL_VERSION,
};
