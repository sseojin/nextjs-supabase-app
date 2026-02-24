/**
 * Supabase Auth 에러 메시지를 한국어로 변환하는 유틸리티
 *
 * 목적:
 * - Supabase Auth의 영어 에러 메시지를 사용자 친화적인 한국어로 변환
 * - 에러 코드 기반 식별 (Supabase 공식 권장 방식)
 * - 중복 이메일 등 주요 에러 케이스를 명확하게 처리
 */

import { AuthError } from "@supabase/supabase-js";

// 한국어 에러 메시지 매핑 객체
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // 이메일 중복 관련 에러
  email_exists: "이미 사용 중인 이메일입니다. 다른 이메일을 사용하거나 로그인을 시도해주세요.",
  user_already_exists: "이미 등록된 계정입니다. 로그인을 시도해주세요.",

  // 비밀번호 관련 에러
  weak_password: "비밀번호가 너무 약합니다. 8자 이상의 강력한 비밀번호를 사용해주세요.",

  // 유효성 검증 에러
  validation_failed: "입력하신 정보가 올바르지 않습니다. 다시 확인해주세요.",

  // 이메일 형식 오류
  invalid_email: "유효하지 않은 이메일 형식입니다.",

  // 이메일 전송 제한
  over_email_send_rate_limit: "이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.",

  // OAuth 관련 에러
  oauth_provider_error: "로그인 제공자 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
  oauth_callback_error: "로그인 처리 중 오류가 발생했습니다.",
  access_denied: "로그인 권한이 거부되었습니다.",
  invalid_request: "잘못된 요청입니다. 다시 시도해주세요.",
};

/**
 * Supabase Auth 에러를 한국어 메시지로 변환
 *
 * 변환 우선순위:
 * 1. AuthError 타입일 경우 error.code로 메시지 조회
 * 2. 매핑이 없으면 error.message에서 키워드 검색
 * 3. 최종적으로 일반 에러 메시지 반환
 *
 * @param error - Supabase에서 발생한 에러 객체
 * @returns 한국어로 변환된 에러 메시지
 */
export function translateAuthError(error: unknown): string {
  // 에러가 없는 경우
  if (!error) {
    return "알 수 없는 오류가 발생했습니다.";
  }

  // 1단계: AuthError 타입 체크 (Supabase의 표준 에러)
  if (error instanceof Error && "code" in error) {
    const authError = error as AuthError;
    const errorCode = authError.code;

    // 에러 코드로 한국어 메시지 조회
    if (errorCode && AUTH_ERROR_MESSAGES[errorCode]) {
      return AUTH_ERROR_MESSAGES[errorCode];
    }
  }

  // 2단계: 에러 메시지 문자열에서 중복 이메일 키워드 감지
  // (보안 정책에 따라 Supabase가 에러 코드 없이 메시지만 반환하는 경우 대비)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // 이메일 중복 관련 키워드 검색
    if (
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("email already") ||
      message.includes("duplicate")
    ) {
      return "이미 사용 중인 이메일입니다. 다른 이메일을 사용하거나 로그인을 시도해주세요.";
    }

    // 비밀번호 강도 관련
    if (
      message.includes("password") &&
      (message.includes("weak") || message.includes("short") || message.includes("least"))
    ) {
      return "비밀번호가 너무 약합니다. 8자 이상의 강력한 비밀번호를 사용해주세요.";
    }

    // 이메일 형식 관련
    if (message.includes("invalid") && message.includes("email")) {
      return "유효하지 않은 이메일 형식입니다.";
    }

    // OAuth 관련 에러
    if (message.includes("oauth") || message.includes("provider") || message.includes("callback")) {
      return "소셜 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }

    // 권한 거부 에러
    if (message.includes("access_denied") || message.includes("denied")) {
      return "로그인 권한이 거부되었습니다.";
    }

    // 네트워크 에러 관련
    if (message.includes("network") || message.includes("timeout") || message.includes("fetch")) {
      return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
    }

    // 원본 메시지 반환 (이미 한국어거나 특수한 경우)
    return error.message;
  }

  // 3단계: 예상치 못한 에러 타입
  return "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

/**
 * 이메일 중복 에러인지 확인하는 헬퍼 함수
 *
 * @param error - 확인할 에러 객체
 * @returns 이메일 중복 에러 여부
 *
 * 사용 예시:
 * if (isEmailDuplicateError(error)) {
 *   // 로그인 페이지로 리다이렉트 등의 추가 처리
 * }
 */
export function isEmailDuplicateError(error: unknown): boolean {
  if (!error) return false;

  // 에러 코드 확인
  if (error instanceof Error && "code" in error) {
    const code = (error as AuthError).code;
    if (code === "email_exists" || code === "user_already_exists") {
      return true;
    }
  }

  // 에러 메시지 확인
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("email already") ||
      message.includes("duplicate")
    );
  }

  return false;
}
