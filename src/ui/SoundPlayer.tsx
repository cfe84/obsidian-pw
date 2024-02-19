import * as React from "react";
import { PwEvent } from "../events/PwEvent";
import { ILogger } from "../domain/ILogger";
// import checked from "./sounds/checked.wav";

export type Sound = "checked";

export interface SoundPlayerDeps {
  logger: ILogger
}

export interface SoundPlayerProps {
  playSound: PwEvent<Sound>
  deps: SoundPlayerDeps
}

export function SoundPlayer({playSound, deps}: SoundPlayerProps) {
  const id = React.useMemo(() => `audio-${Math.round(Math.random() * 1000000000)}`, []);

  React.useEffect(() => {
    playSound.listen(async (sound) => {
      deps.logger.debug(`Playing ${sound}`);
      if (sound === "checked") {
        const checkedAudio = document.getElementById(id) as HTMLAudioElement;
        checkedAudio.play();
      } else {
        deps.logger.error(`Unknown sound: ${sound}`);
      }
    })
  }, [playSound]);

  return <>
    <audio id={id}>
      {/* <source src={checked}></source> */}
    </audio>
  </>
}