import * as React from "react";
import { PlanningSettings, SearchParameters } from "./PlanningSettings";

export interface PlanningSettingsComponentProps {
  setPlanningSettings: (settings: PlanningSettings) => void;
  planningSettings: PlanningSettings,
}

export function PlanningSettingsComponent({setPlanningSettings, planningSettings}: PlanningSettingsComponentProps) {

  let {hideEmpty, searchParameters} = planningSettings;
  let {searchPhrase, fuzzySearch} = searchParameters;

  function saveSettings() {
    setPlanningSettings({
      hideEmpty,
      searchParameters: {
        fuzzySearch,
        searchPhrase,
      }
    });
  }

  function onHideEmptyClicked(ev: React.ChangeEvent<HTMLInputElement>) {
    hideEmpty = ev.target.checked;
    saveSettings();
  }

  function onFuzzyClicked(ev: React.ChangeEvent<HTMLInputElement>) {
    fuzzySearch = ev.target.checked;
    saveSettings();
  }

  function onSearchChange(ev: React.ChangeEvent<HTMLInputElement>) {
    searchPhrase = ev.target.value;
    saveSettings();
  }

  return <div className="pw-planning--settings">
    <div className="pw-planning--settings--hide-checkbox">
      <input type="checkbox"
        onChange={onHideEmptyClicked}
        checked={hideEmpty}
        ></input>
      <label>hide empty containers</label>
    </div>

    <div className="pw-planning--settings--search">
      Filter: 
      <input 
        onChange={onSearchChange}
        value={searchPhrase}
        ></input> &nbsp;
      <input type="checkbox"
        onChange={onFuzzyClicked}
        checked={fuzzySearch}></input>
      fuzzy search
    </div>
  </div>;
}