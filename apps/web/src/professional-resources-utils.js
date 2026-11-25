export const PROFESSIONAL_RESOURCE_REGIONS = [
  'Todas',
  'Nacional',
  'Madrid',
  'Barcelona',
];

export function normalizeProfessionalResourceFilters(filters = {}) {
  return {
    region: typeof filters.region === 'string' ? filters.region.trim() : 'Todas',
    modality: typeof filters.modality === 'string' ? filters.modality.trim() : 'todas',
    cost: typeof filters.cost === 'string' ? filters.cost.trim() : '',
  };
}

export function filterProfessionalResources(resources = [], filters = {}) {
  const normalized = normalizeProfessionalResourceFilters(filters);
  const region = normalized.region.toLowerCase();
  const modality = normalized.modality.toLowerCase();

  return resources.filter((resource) => {
    const resourceRegion = String(resource.region || '').toLowerCase();
    const regionMatches =
      region === 'todas' ||
      resourceRegion === 'nacional' ||
      resourceRegion === 'todas' ||
      resourceRegion === region;
    const modalityMatches =
      !modality ||
      modality === 'todas' ||
      String(resource.modalidad || '').toLowerCase() === modality;
    const costMatches =
      !normalized.cost ||
      String(resource.coste || '').toLowerCase().includes(normalized.cost.toLowerCase());
    return regionMatches && modalityMatches && costMatches;
  });
}
