import { Big_Shoulders, Caveat_Brush, Manrope } from "next/font/google";

// Google Fonts now ships "Big Shoulders Display" as the "Big Shoulders" variable
// family with an optical-size axis; `.font-display` sets opsz 72 for the Display cut.
export const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
  variable: "--font-big-shoulders",
  // next/font has no metric overrides for this family, so name the fallback explicitly.
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "Impact", "sans-serif"],
});

export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const caveatBrush = Caveat_Brush({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-caveat-brush",
});

export const fontVariables = [bigShoulders.variable, manrope.variable, caveatBrush.variable].join(" ");
