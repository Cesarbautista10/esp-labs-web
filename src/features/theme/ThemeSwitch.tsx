import { THEMES, themeStore, useTheme } from "@/lib/theme";
import { ChoiceGroup } from "@/ui/ChoiceGroup";

const LABEL = { system: "Auto", light: "Light", dark: "Dark" } as const;

/** Auto follows the OS; Light and Dark pin a theme for this browser. */
export function ThemeSwitch() {
  const theme = useTheme();
  return (
    <ChoiceGroup
      label="Colour theme"
      value={theme}
      onChange={themeStore.set}
      choices={THEMES.map((t) => ({ key: t, label: LABEL[t] }))}
    />
  );
}
