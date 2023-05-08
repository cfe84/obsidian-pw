import * as React from "react";
import { PlanningSettings, SearchParameters } from "./PlanningSettings";
import { Checkbox, Group, Label, Pane, SearchInput, Small, Switch, Text, TextInput, majorScale, minorScale } from "evergreen-ui";

export interface PlanningSettingsComponentProps {
  setPlanningSettings: (settings: PlanningSettings) => void;
  planningSettings: PlanningSettings,
}

export function PlanningSettingsComponent({setPlanningSettings, planningSettings}: PlanningSettingsComponentProps) {

  let {hideEmpty, searchParameters, wipLimit} = planningSettings;
  let {searchPhrase, fuzzySearch} = searchParameters;
  let {dailyLimit, isLimited} = wipLimit;

  function saveSettings() {
    setPlanningSettings({
      hideEmpty,
      searchParameters: {
        fuzzySearch,
        searchPhrase,
      },
      wipLimit: {
        dailyLimit,
        isLimited,
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

  function onWipLimitActivatedChange(ev: React.ChangeEvent<HTMLInputElement>) {
    isLimited = ev.target.checked;
    console.log(`Saving settings`)
    saveSettings();
  }

  function onDailyWipLimitChanged(ev: React.ChangeEvent<HTMLInputElement>) {
    dailyLimit = Number.parseInt(ev.target.value);
    saveSettings();
  }

  return <div className="pw-planning--settings">
    <Pane display="flex" alignItems="center" marginX={majorScale(2)}>
      <TextInput placeholder="Filter" onChange={onSearchChange} value={searchPhrase}/>
      <Checkbox label="Fuzzy search" checked={fuzzySearch} onChange={onFuzzyClicked} />
    </Pane>
    <Pane>
      <Checkbox label="Hide empty containers" checked={hideEmpty} onChange={onHideEmptyClicked} />
    </Pane>
    <Pane display="flex" alignItems="center">
      <Checkbox label="WIP limit" checked={isLimited} onChange={onWipLimitActivatedChange} marginRight={minorScale(2)} marginBottom={0} marginTop={0}/>
      <TextInput onChange={onDailyWipLimitChanged} value={dailyLimit} disabled={!isLimited} width="60px" marginRight={minorScale(2)}/>
      <Text fontSize="12px" marginRight={minorScale(2)}>tasks / day</Text>
    </Pane>
  </div>;
}