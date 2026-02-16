import { createContext, useContext, useReducer, ReactNode, useMemo } from "react";
import type { WindowConfiguration, WindowAction, UIState, WindowContextValue } from "./types";
import { DEFAULT_WINDOW_CONFIG } from "./constants";
import { clampWidth, clampHeight, clampDepth } from "./utils";

// Create the context
const WindowContext = createContext<WindowContextValue | undefined>(undefined);

// ============================================================================
// Reducer
// ============================================================================

const initialUIState: UIState = {
  activeTab: "basic",
  selectedProfile: DEFAULT_WINDOW_CONFIG.profile,
};

function windowReducer(state: WindowConfiguration, action: WindowAction): WindowConfiguration {
  switch (action.type) {
    // Dimensions
    case "SET_DIMENSIONS":
      return {
        ...state,
        width: clampWidth(action.payload.width),
        height: clampHeight(action.payload.height),
        depth: clampDepth(action.payload.depth),
      };

    case "SET_WIDTH":
      return {
        ...state,
        width: clampWidth(action.payload),
      };

    case "SET_HEIGHT":
      return {
        ...state,
        height: clampHeight(action.payload),
      };

    case "SET_DEPTH":
      return {
        ...state,
        depth: clampDepth(action.payload),
      };

    // Window Type
    case "SET_WINDOW_TYPE":
      return {
        ...state,
        type: action.payload,
      };

    // Frame Material
    case "SET_FRAME_MATERIAL":
      return {
        ...state,
        frame: action.payload,
      };

    case "SET_FRAME_OUTSIDE_COLOR":
      return {
        ...state,
        frame: {
          ...state.frame,
          colorOutside: action.payload,
        },
      };

    case "SET_FRAME_INSIDE_COLOR":
      return {
        ...state,
        frame: {
          ...state.frame,
          colorInside: action.payload,
        },
      };

    // Profile
    case "SET_PROFILE":
      return {
        ...state,
        profile: action.payload,
      };

    // Muntins
    case "SET_MUNTINS":
      return {
        ...state,
        muntins: action.payload,
      };

    case "DISABLE_MUNTINS":
      return {
        ...state,
        muntins: {
          ...state.muntins,
          enabled: false,
        },
      };

    // Handles
    case "ADD_HANDLE":
      return {
        ...state,
        handles: [...state.handles, action.payload],
      };

    case "REMOVE_HANDLE":
      return {
        ...state,
        handles: state.handles.filter((h) => h.id !== action.payload),
      };

    case "UPDATE_HANDLE":
      return {
        ...state,
        handles: state.handles.map((h) =>
          h.id === action.payload.id ? { ...h, ...action.payload.config } : h
        ),
      };

    // Opening
    case "SET_OPENING":
      return {
        ...state,
        opening: action.payload,
      };

    // Optional Features
    case "ENABLE_TRANSOM":
      return {
        ...state,
        transom: action.payload,
      };

    case "DISABLE_TRANSOM":
      return {
        ...state,
        transom: undefined,
      };

    case "ENABLE_FALIGHT":
      return {
        ...state,
        falight: action.payload,
      };

    case "DISABLE_FALIGHT":
      return {
        ...state,
        falight: undefined,
      };

    case "ENABLE_SHUTTERS":
      return {
        ...state,
        shutters: action.payload,
      };

    case "DISABLE_SHUTTERS":
      return {
        ...state,
        shutters: undefined,
      };

    case "ENABLE_INSECT_SCREEN":
      return {
        ...state,
        insectScreen: action.payload,
      };

    case "DISABLE_INSECT_SCREEN":
      return {
        ...state,
        insectScreen: undefined,
      };

    // Batch Operations
    case "SET_CONFIG":
      return action.payload;

    case "RESET_TO_DEFAULTS":
      return DEFAULT_WINDOW_CONFIG;

    default:
      return state;
  }
}

// ============================================================================
// Provider Component
// ============================================================================

interface WindowContextProviderProps {
  children: ReactNode;
  initialConfig?: WindowConfiguration;
}

export function WindowContextProvider({
  children,
  initialConfig = DEFAULT_WINDOW_CONFIG,
}: WindowContextProviderProps) {
  const [config, dispatch] = useReducer(windowReducer, initialConfig);
  const [ui] = useReducer((state: UIState) => state, initialUIState);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<WindowContextValue>(
    () => ({
      config,
      dispatch,
      ui,
    }),
    [config, ui]
  );

  return <WindowContext.Provider value={value}>{children}</WindowContext.Provider>;
}

// ============================================================================
// Hook to use the context
// ============================================================================

export function useWindowContext(): WindowContextValue {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error("useWindowContext must be used within WindowContextProvider");
  }
  return context;
}
