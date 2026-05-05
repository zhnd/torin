export interface TapdCredentialStatus {
  configured: boolean;
  tapdNick: string | null;
}

export interface TapdSettingsData {
  tapdCredentialStatus: TapdCredentialStatus;
}
