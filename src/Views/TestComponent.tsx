import * as React from "react";
import * as ReactDom from "react-dom";

export function TestComponent() {
  return <>
    <div>Yes</div>
  </>
}

export function MountTestComponent(onElement: HTMLElement) {
  ReactDom.render(
    <TestComponent></TestComponent>,
    onElement);
}