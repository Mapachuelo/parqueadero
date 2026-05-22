import ky from "ky";
import type {
  ApiResponse,
  AuthResponse,
  User,
  VehicleTransaction,
  Payment,
  RateStructure,
  Rate,
  FractionRate,
  Subscription,
  PrepaidCredit,
  Claim,
  CustodyTerms,
  LegalChecklist,
  ParkingSpace,
  OccupancyReport,
  RevenueReport,
  ComplianceReport,
} from "@/types";

const TOKEN_KEY = "parqueadero_token";

const api = ky.create({
  prefixUrl: "/api",
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = "/login";
        }
      },
    ],
  },
});

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post("auth/login", { json: { username, password } }).json<AuthResponse>(),

  logout: () => api.post("auth/logout").json<{ message: string }>(),

  session: () => api.get("auth/session").json<{ user: User | null }>(),

  register: (data: {
    username: string;
    password: string;
    full_name: string;
    email: string;
    phone?: string;
    role: string;
  }) => api.post("auth/register", { json: data }).json<ApiResponse<{ user: User }>>(),
};

export const transactionsApi = {
  entry: (data: {
    plate: string;
    category: string;
    customerName: string;
    customerPhone?: string;
    isInternational?: boolean;
    countryOrigin?: string;
    vehicleDescription?: string;
  }) => api.post("transactions/entry", { json: data }).json<ApiResponse<VehicleTransaction>>(),

  exit: (id: string, data?: { transactionId?: string; plate?: string }) =>
    api.post(`transactions/${id}/exit`, { json: data }).json<ApiResponse<VehicleTransaction>>(),

  active: (page = 1, limit = 20) =>
    api
      .get("transactions/active", { searchParams: { page, limit } })
      .json<ApiResponse<{ transactions: VehicleTransaction[]; total: number }>>(),

  getById: (id: string) =>
    api.get(`transactions/${id}`).json<ApiResponse<VehicleTransaction>>(),
};

export const paymentsApi = {
  process: (data: {
    transactionId: string;
    paymentMethod: string;
    amountPaid: number;
    prepaidUsed?: number;
  }) => api.post("payments", { json: data }).json<ApiResponse<Payment>>(),
};

export const ratesApi = {
  getStructures: () => api.get("rates/structures").json<ApiResponse<RateStructure[]>>(),

  createStructure: (data: {
    name: string;
    description?: string;
    effectiveDate?: string;
  }) => api.post("rates/structures", { json: data }).json<ApiResponse<RateStructure>>(),

  getStructure: (id: number) =>
    api.get(`rates/structures/${id}`).json<ApiResponse<RateStructure>>(),

  updateStructure: (id: number, data: Partial<RateStructure>) =>
    api.put(`rates/structures/${id}`, { json: data }).json<ApiResponse<RateStructure>>(),

  activateStructure: (id: number, effectiveDate?: string) =>
    api
      .post(`rates/structures/${id}/activate`, { json: { effectiveDate } })
      .json<ApiResponse<RateStructure>>(),

  getActive: () => api.get("rates/active").json<ApiResponse<Rate[]>>(),

  getHistory: (id: number) =>
    api.get(`rates/history/${id}`).json<ApiResponse<unknown[]>>(),

  createRate: (data: {
    structureId: number;
    category: string;
    pricePerHour: number;
    description?: string;
    validFrom?: string;
    validTo?: string;
  }) => api.post("rates/rates", { json: data }).json<ApiResponse<Rate>>(),

  createFraction: (data: {
    structureId: number;
    category: string;
    minutes15: number;
    minutes30: number;
    minutes45: number;
  }) => api.post("rates/fractions", { json: data }).json<ApiResponse<FractionRate>>(),

  getFractions: () => api.get("rates/fractions").json<ApiResponse<FractionRate[]>>(),

  createSubscription: (data: {
    plate: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    monthlyAmount: number;
    startDate?: string;
    autoRenew?: boolean;
    durationMonths?: number;
  }) =>
    api.post("rates/subscriptions", { json: data }).json<ApiResponse<Subscription>>(),

  getSubscriptions: (params?: Record<string, unknown>) =>
    api
      .get("rates/subscriptions", { searchParams: params as Record<string, string> })
      .json<ApiResponse<{ subscriptions: Subscription[] }>>(),

  renewSubscription: (id: number, months: number) =>
    api.put(`rates/subscriptions/${id}/renew`, { json: { months } }).json<ApiResponse<Subscription>>(),

  createCredit: (data: {
    plate: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    isHours?: boolean;
    expirationDate?: string;
  }) => api.post("rates/credits", { json: data }).json<ApiResponse<PrepaidCredit>>(),

  getCredits: (params?: Record<string, unknown>) =>
    api
      .get("rates/credits", { searchParams: params as Record<string, string> })
      .json<ApiResponse<{ credits: PrepaidCredit[] }>>(),

  rechargeCredit: (id: number, amount: number) =>
    api
      .post(`rates/credits/${id}/recharge`, { json: { amount } })
      .json<ApiResponse<PrepaidCredit>>(),
};

export const reportsApi = {
  occupancy: (from?: string, to?: string) =>
    api
      .get("reports/occupancy", { searchParams: { from, to } as Record<string, string> })
      .json<ApiResponse<OccupancyReport>>(),

  revenue: (from?: string, to?: string) =>
    api
      .get("reports/revenue", { searchParams: { from, to } as Record<string, string> })
      .json<ApiResponse<RevenueReport>>(),

  transactions: (params?: Record<string, unknown>) =>
    api
      .get("reports/transactions", { searchParams: params as Record<string, string> })
      .json<ApiResponse<{ transactions: VehicleTransaction[]; total: number }>>(),

  users: (from?: string, to?: string) =>
    api
      .get("reports/users", { searchParams: { from, to } as Record<string, string> })
      .json<ApiResponse<unknown[]>>(),

  compliance: (from?: string, to?: string) =>
    api
      .get("reports/compliance", { searchParams: { from, to } as Record<string, string> })
      .json<ApiResponse<ComplianceReport>>(),
};

export const legalApi = {
  getCustodyTerms: () =>
    api.get("legal/custody-terms").json<ApiResponse<CustodyTerms[]>>(),

  createCustodyTerms: (data: { version: string; content: string }) =>
    api.post("legal/custody-terms", { json: data }).json<ApiResponse<CustodyTerms>>(),

  activateCustodyTerms: (id: number) =>
    api.put(`legal/custody-terms/${id}/activate`).json<ApiResponse<CustodyTerms>>(),

  getChecklists: () =>
    api.get("legal/checklist").json<ApiResponse<LegalChecklist[]>>(),

  createChecklist: (data: { name: string; description?: string }) =>
    api.post("legal/checklist", { json: data }).json<ApiResponse<LegalChecklist>>(),

  getChecklist: (id: number) =>
    api.get(`legal/checklist/${id}`).json<ApiResponse<LegalChecklist>>(),

  updateChecklistItem: (id: number, itemId: number, isChecked: boolean) =>
    api
      .put(`legal/checklist/${id}/items/${itemId}`, { json: { isChecked } })
      .json<ApiResponse<LegalChecklist>>(),

  completeChecklist: (id: number) =>
    api.post(`legal/checklist/${id}/complete`).json<ApiResponse<LegalChecklist>>(),

  getComplianceReport: () =>
    api.get("legal/compliance-report").json<ApiResponse<ComplianceReport>>(),
};

export const claimsApi = {
  create: (data: {
    transactionId?: string;
    category: string;
    description: string;
  }) => api.post("claims", { json: data }).json<ApiResponse<Claim>>(),

  list: (params?: Record<string, unknown>) =>
    api
      .get("claims", { searchParams: params as Record<string, string> })
      .json<ApiResponse<{ claims: Claim[]; total: number }>>(),

  get: (id: number) => api.get(`claims/${id}`).json<ApiResponse<Claim>>(),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`claims/${id}`, { json: data }).json<ApiResponse<Claim>>(),

  addEvidence: (id: number, data: { filePath: string; description?: string }) =>
    api.post(`claims/${id}/evidence`, { json: data }).json<ApiResponse<unknown>>(),

  addNote: (id: number, content: string) =>
    api.post(`claims/${id}/notes`, { json: { content } }).json<ApiResponse<unknown>>(),

  resolve: (id: number, data: { resolution: string; compensationAmount?: number }) =>
    api.put(`claims/${id}/resolve`, { json: data }).json<ApiResponse<Claim>>(),
};

export const spacesApi = {
  list: () => api.get("spaces").json<ApiResponse<ParkingSpace[]>>(),

  occupancy: () => api.get("spaces/occupancy").json<ApiResponse<{ occupied: number; free: number; total: number }>>(),

  release: (code: string) => api.put(`spaces/${code}`).json<ApiResponse<ParkingSpace>>(),
};

export const profileApi = {
  get: () => api.get("profile").json<ApiResponse<User>>(),

  update: (data: { fullName?: string; email?: string; phone?: string }) =>
    api.put("profile", { json: data }).json<ApiResponse<User>>(),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("profile/password", { json: data }).json<ApiResponse<{ message: string }>>(),

  getSessions: () => api.get("profile/sessions").json<ApiResponse<unknown[]>>(),

  deleteSession: (id: number) =>
    api.delete(`profile/sessions/${id}`).json<ApiResponse<{ message: string }>>(),

  deleteOtherSessions: () =>
    api.delete("profile/sessions").json<ApiResponse<{ message: string }>>(),

  getPreferences: () => api.get("profile/preferences").json<ApiResponse<Record<string, boolean>>>(),

  updatePreferences: (data: Record<string, boolean>) =>
    api.put("profile/preferences", { json: data }).json<ApiResponse<Record<string, boolean>>>(),

  exportData: () => api.get("profile/export").json<ApiResponse<unknown>>(),
};

export const clientApi = {
  auth: (data: {
    email?: string;
    password?: string;
    transactionId?: string;
    plateLast4?: string;
  }) => api.post("client/auth", { json: data }).json<ApiResponse<AuthResponse>>(),

  getTransactions: (params?: Record<string, unknown>) =>
    api
      .get("client/transactions", { searchParams: params as Record<string, string> })
      .json<ApiResponse<{ transactions: VehicleTransaction[] }>>(),

  getTransaction: (id: number) =>
    api.get(`client/transactions/${id}`).json<ApiResponse<VehicleTransaction>>(),
};
