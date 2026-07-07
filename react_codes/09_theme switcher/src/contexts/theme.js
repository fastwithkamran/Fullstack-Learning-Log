import { createContext, useContext } from "react";

// creates a React Context, which is a tool used to share data across multiple components without manually passing props down through every level of your component tree.
export const ThemeContext = createContext({
  themeMode: "light",
  darkTheme: () => {},
  LightTheme: () => {},
});

export const ThemeProvider = ThemeContext.Provider

export default function useTheme(){
    return useContext(ThemeContext);
}