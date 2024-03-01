export type AttestationResponse = {
  validated: boolean;
  issuerName: string;
  issuerSlugName: string;
  issuerDescription: string;
  issuerWebsiteUrl: string;
  issuerLogoUrl: string;
  group: number;
};

export type PohAttestationResponse = {
  poh: boolean;
  attestations: AttestationResponse[];
};
