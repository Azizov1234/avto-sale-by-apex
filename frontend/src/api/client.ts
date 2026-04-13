const DEFAULT_API_URL =
  typeof window === 'undefined'
    ? 'http://localhost:3001'
    : `${window.location.protocol}//${window.location.hostname}:3001`;

const BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

const GENERIC_ERROR_PATTERNS = [
  'bad request',
  'bad request exception',
  'unauthorized',
  'forbidden',
  'internal server error',
  'not found',
  'invalid token',
  'token is missing',
  'token topilmadi',
];

const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
  400: "So'rovda xatolik bor. Ma'lumotlarni tekshirib qayta urinib ko'ring.",
  401: "Sessiya muddati tugagan. Qayta tizimga kiring.",
  403: "Bu amalni bajarishga sizda ruxsat yo'q.",
  404: "So'ralgan ma'lumot topilmadi.",
  409: "Bu ma'lumot allaqachon mavjud yoki ziddiyat bor.",
  422: "Yuborilgan ma'lumotlar noto'g'ri formatda.",
  500: "Serverda xatolik yuz berdi. Birozdan keyin yana urinib ko'ring.",
};

function isGenericErrorMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  return GENERIC_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function readPayloadMessage(payload: unknown) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (typeof record.message === 'string') {
      return record.message;
    }

    if (Array.isArray(record.message) && record.message.length > 0) {
      return String(record.message[0]);
    }

    if (typeof record.error === 'string') {
      return record.error;
    }
  }

  return undefined;
}

function extractErrorMessage(payload: unknown, statusCode: number) {
  const message = readPayloadMessage(payload);

  if (message && !isGenericErrorMessage(message)) {
    return message;
  }

  if (statusCode in STATUS_FALLBACK_MESSAGES) {
    return STATUS_FALLBACK_MESSAGES[statusCode];
  }

  return message || "Kutilmagan xatolik yuz berdi.";
}

function isAuthEndpoint(endpoint: string) {
  return endpoint.startsWith('/auth/');
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');

  if (window.location.pathname !== '/login') {
    const nextPath = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login?next=${encodeURIComponent(nextPath)}`);
  }
}

export function buildQueryString(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Server bilan bog'lanib bo'lmadi. API manzilini tekshiring.");
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const errorMessage = extractErrorMessage(payload, response.status);

    if (response.status === 401 && !isAuthEndpoint(endpoint)) {
      redirectToLogin();
      throw new Error("Sessiya muddati tugagan. Qayta tizimga kiring.");
    }

    throw new Error(errorMessage || response.statusText);
  }

  return payload as T;
}
