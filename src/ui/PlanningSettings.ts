export interface SearchParameters {
  searchPhrase: string,
  fuzzySearch: boolean,
}

export interface PlanningSettings {
  searchParameters: SearchParameters,
  hideEmpty: boolean,
}

export const defaultSettings: PlanningSettings = {
  searchParameters: {
    fuzzySearch: false,
    searchPhrase: ""
  },
  hideEmpty: true,
}