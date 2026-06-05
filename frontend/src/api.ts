import { StatusKey } from "./theme";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type Property = {
  id: string;
  type: "buy" | "rent";
  title: string;
  address: string;
  price: number | null;
  price_period: "total" | "month";
  rooms: string | null;
  size: string | null;
  broker_name: string;
  broker_phone: string;
  broker_email: string;
  listing_url: string;
  photos: string[];
  rating: number;
  notes: string;
  viewing_date: string | null;
  status: StatusKey;
  created_at: string;
  updated_at: string;
};

export type PropertyInput = Partial<Omit<Property, "id" | "created_at" | "updated_at">>;

async function handle(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  async list(type?: "buy" | "rent", status?: string): Promise<Property[]> {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return handle(await fetch(`${BASE}/api/properties${qs}`));
  },

  async get(id: string): Promise<Property> {
    return handle(await fetch(`${BASE}/api/properties/${id}`));
  },

  async create(data: PropertyInput): Promise<Property> {
    return handle(
      await fetch(`${BASE}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );
  },

  async update(id: string, data: PropertyInput): Promise<Property> {
    return handle(
      await fetch(`${BASE}/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );
  },

  async remove(id: string): Promise<{ success: boolean }> {
    return handle(
      await fetch(`${BASE}/api/properties/${id}`, { method: "DELETE" }),
    );
  },

  async parseLink(url: string): Promise<ParsedListing> {
    return handle(
      await fetch(`${BASE}/api/properties/parse-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }),
    );
  },
};

export type ParsedListing = {
  type: "buy" | "rent";
  title: string;
  address: string;
  price: number | null;
  price_period: "total" | "month";
  rooms: string;
  size: string;
  broker_name: string;
  broker_phone: string;
  broker_email: string;
  photos: string[];
  listing_url: string;
  source: string;
};
