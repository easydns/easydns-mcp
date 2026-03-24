export interface ApiResponse<T = unknown> {
  msg?: string;
  tm?: number;
  data: T;
  status: number;
  count?: number;
  total?: number;
  start?: number;
  max?: number;
}

export interface ApiError {
  msg: string;
  status: number;
}

export interface ApiError420 {
  error: {
    code: 420;
    message: string;
  };
}

export interface DomainInfoData {
  id: string;
  domain: string;
  exists: string;
  onsystem: string;
  expiry: string;
  next_due: string;
  cloned_to: string;
  service: number;
  sub_block: number;
}

export interface DomainListData {
  user: string;
  index: Array<{ name: string; link: string }>;
}

export interface ZoneRecord {
  id: number;
  domain: string;
  host: string;
  ttl: number;
  prio: number;
  geozone_id: number;
  type: string;
  rdata: string;
  last_mod: string;
}

export interface ParsedZoneRecord extends ZoneRecord {
  url?: string;
  orig_rdata?: string;
}

export interface ZoneSOA {
  domain: string;
  soa: number;
}

export interface NameserversData {
  domain: string;
  nameservers: string[];
}

export interface MailmapEntry {
  active: number;
  alias: string;
  destination: string;
  domain: string;
  host: string;
  last_modified: string;
  mailmap_id: number;
}

export interface MailmapListData {
  domain: string;
  mailmaps: MailmapEntry[];
}

export interface RegStatusEntry {
  reglock: boolean;
  renewal: string;
  auto_renew: boolean;
  auto_renew_card_id: string;
  let_expire: boolean;
  let_expire_failed: boolean;
  expiry: string;
  local_registrar: boolean;
  supports_reglock: boolean;
}

export interface GeoRegion {
  id: number;
  geo_code: string;
  location: string;
}

export interface ServiceDescription {
  service_id: number;
  name: string;
  period: number;
  enterprise: number;
  description: string;
}

export interface SubscriptionDescription extends ServiceDescription {
  subscription_id: number;
  size: number;
}

export interface PricingService {
  id: number;
  name: string;
  code: string;
  currency: string;
  price: number;
  isPremium: boolean;
  pricePeriod: number;
  pricePeriodName: string;
  tax1: number;
  tax2: number;
  tax3: number;
}

export interface PricingData {
  domain: string;
  avail: boolean;
  tld: string;
  services: PricingService[];
}

export interface MailmapCreateData {
  domain: string;
}

export interface MailmapDeleteData {
  domain: string;
  mailmap_id: number;
}
