/**
 * SMS/Zalo API integration interfaces
 */

export interface SmsProviderConfig {
  apiKey: string;
  apiUrl: string;
  fromNumber?: string;
}

export interface ZaloProviderConfig {
  accessToken: string;
  apiUrl: string;
}

export interface SendSmsRequest {
  to: string; // Phone number in E.164 format
  message: string;
}

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendZaloRequest {
  phoneNumber: string;
  message: string;
}

export interface SendZaloResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
