import { TextStyle } from "react-native";

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,

  h2: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    letterSpacing: -0.3,
  } as TextStyle,

  h3: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: 0,
  } as TextStyle,

  h4: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: 0.2,
  } as TextStyle,

  // Body text
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    letterSpacing: 0.3,
  } as TextStyle,

  bodyMedium: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: 0.3,
  } as TextStyle,

  bodySemibold: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0.3,
  } as TextStyle,

  bodyBold: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    letterSpacing: 0.3,
  } as TextStyle,

  // Small text / labels
  small: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: 0.25,
  } as TextStyle,

  smallMedium: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: 0.25,
  } as TextStyle,

  smallBold: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    letterSpacing: 0.25,
  } as TextStyle,

  // Caption / Extra small
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  captionMedium: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  // Tab labels
  tabLabel: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    letterSpacing: 0.3,
  } as TextStyle,

  // Button text
  button: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0.5,
  } as TextStyle,
};
