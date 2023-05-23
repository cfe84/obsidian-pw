import * as React from "react";
import { StandardDependencies } from "./StandardDependencies";
import { TodoItem } from "src/domain/TodoItem";
import { TFile } from "obsidian";

export interface TodayComponentProps {
  deps: StandardDependencies,
  todos: TodoItem<TFile>[]
}

export function TodayComponent({deps, todos}: TodayComponentProps) {
  
}