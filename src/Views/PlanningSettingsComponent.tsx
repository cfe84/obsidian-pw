import * as React from "react";

export interface SearchParameters {
  searchPhrase: string,
  fuzzySearch: boolean,
}

export interface PlanningSettingsComponentProps {
  setSearchParameters: (searchParameters: SearchParameters) => void;
  setHideEmpty: (hideEmpty: boolean) => void;
  hideEmpty: boolean,
  searchParameters: SearchParameters,
}

export function PlanningSettingsComponent({setSearchParameters, setHideEmpty, hideEmpty, searchParameters}: PlanningSettingsComponentProps) {
  function onHideEmptyClicked(ev: React.ChangeEvent<HTMLInputElement>) {
    setHideEmpty(ev.target.checked);
  }

  function onFuzzyClicked(ev: React.ChangeEvent<HTMLInputElement>) {
    setSearchParameters({
      fuzzySearch: ev.target.checked,
      searchPhrase: searchParameters.searchPhrase,
    });
  }

  function onSearchChange(ev: React.ChangeEvent<HTMLInputElement>) {
    setSearchParameters({
      fuzzySearch: searchParameters.fuzzySearch,
      searchPhrase: ev.target.value,
    });
  }

  return <div className="pw-planning--settings">
    <div className="pw-planning--settings--hide-checkbox">
      <input type="checkbox"
        onChange={onHideEmptyClicked}
        checked={hideEmpty}
        ></input>
       hide empty containers
    </div>

    <div className="pw-planning--settings--search">
      Filter: 
      <input 
        onChange={onSearchChange}
        value={searchParameters.searchPhrase}
        ></input>
      <input type="checkbox"
        onChange={onFuzzyClicked}
        checked={searchParameters.fuzzySearch}></input>
      fuzzy search
    </div>
  </div>;
}