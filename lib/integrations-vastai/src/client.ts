/**
 * vast.ai REST API client
 * Docs: https://vast.ai/docs/api
 */

const VAST_BASE_URL = "https://console.vast.ai/api/v0";

function getApiKey(): string {
  const key = process.env.VAST_AI_API_KEY;
  if (!key) throw new Error("VAST_AI_API_KEY env var is not set");
  return key;
}

async function vastFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${VAST_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`vast.ai API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Offers (GPU instances for rent) ─────────────────────────────────────────

export interface VastOffer {
  id: number;
  gpu_name: string;
  num_gpus: number;
  cpu_cores: number;
  cpu_ram: number;
  disk_space: number;
  dph_total: number; // dollars per hour
  rentable: boolean;
  geolocation: string;
  cuda_max_good: number;
  reliability2: number;
}

export async function searchOffers(params: {
  gpu_name?: string;
  num_gpus?: number;
  min_cuda?: number;
  max_dph?: number;
  order?: string;
  limit?: number;
}): Promise<VastOffer[]> {
  const q: Record<string, unknown> = { rentable: { eq: true }, rented: { eq: false } };
  if (params.gpu_name) q["gpu_name"] = { eq: params.gpu_name };
  if (params.num_gpus) q["num_gpus"] = { gte: params.num_gpus };
  if (params.min_cuda) q["cuda_max_good"] = { gte: params.min_cuda };
  if (params.max_dph) q["dph_total"] = { lte: params.max_dph };

  const body = {
    q,
    order: params.order ?? [["dph_total", "asc"]],
    limit: params.limit ?? 20,
  };

  const data = await vastFetch<{ offers: VastOffer[] }>("/bundles", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.offers;
}

// ─── Instances ────────────────────────────────────────────────────────────────

export interface VastInstance {
  id: number;
  status: string;
  gpu_name: string;
  num_gpus: number;
  dph_total: number;
  actual_status: string;
  ssh_host: string;
  ssh_port: number;
  start_date: number;
  image_uuid: string;
  label: string | null;
}

export async function listInstances(): Promise<VastInstance[]> {
  const data = await vastFetch<{ instances: VastInstance[] }>("/instances");
  return data.instances ?? [];
}

export async function getInstance(instanceId: number): Promise<VastInstance> {
  const data = await vastFetch<{ instances: VastInstance[] }>(
    `/instances/${instanceId}`
  );
  return data.instances[0]!;
}

export interface CreateInstanceOptions {
  /** Offer ID from searchOffers */
  offerId: number;
  /** Docker image to run */
  image: string;
  /** Disk space in GB */
  diskGb?: number;
  /** Shell command to run on startup */
  onstart?: string;
  /** Jupyter lab password (leave blank to disable) */
  jupyterPassword?: string;
  /** Optional label */
  label?: string;
  /** Extra env vars, e.g. ["KEY=val"] */
  env?: string[];
}

export async function createInstance(
  opts: CreateInstanceOptions
): Promise<{ new_contract: number }> {
  return vastFetch<{ new_contract: number }>("/asks/", {
    method: "PUT",
    body: JSON.stringify({
      client_id: "me",
      image: opts.image,
      disk: opts.diskGb ?? 10,
      onstart: opts.onstart,
      runtype: "ssh",
      label: opts.label,
      env: Object.fromEntries(
        (opts.env ?? []).map((e) => {
          const [k, ...v] = e.split("=");
          return [k, v.join("=")];
        })
      ),
      jupyter_password: opts.jupyterPassword ?? "",
      extra_env: {},
      id: opts.offerId,
    }),
  });
}

export async function destroyInstance(instanceId: number): Promise<void> {
  await vastFetch(`/instances/${instanceId}/`, { method: "DELETE" });
}

export async function stopInstance(instanceId: number): Promise<void> {
  await vastFetch(`/instances/${instanceId}/`, {
    method: "PUT",
    body: JSON.stringify({ state: "stopped" }),
  });
}

export async function startInstance(instanceId: number): Promise<void> {
  await vastFetch(`/instances/${instanceId}/`, {
    method: "PUT",
    body: JSON.stringify({ state: "running" }),
  });
}

// ─── Account ──────────────────────────────────────────────────────────────────

export interface VastAccount {
  username: string;
  email: string;
  balance: number;
  credit: number;
}

export async function getAccount(): Promise<VastAccount> {
  return vastFetch<VastAccount>("/users/current");
}
