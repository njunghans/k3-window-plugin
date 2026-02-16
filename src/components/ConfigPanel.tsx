import { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Input,
} from "@mui/material";
import { useWindowContext } from "../useWindowContext.tsx";
import {
  PROFILE_LIBRARY,
  WINDOW_MIN_WIDTH,
  WINDOW_MAX_WIDTH,
  WINDOW_MIN_HEIGHT,
  WINDOW_MAX_HEIGHT,
} from "../constants";
import { OPENING_TYPES, MUNTIN_PATTERNS } from "../constants";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ConfigPanel = () => {
  const { config, dispatch } = useWindowContext();
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ Width: "100%", bgcolor: "background.paper" }}>
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        aria-label="window configuration tabs"
      >
        <Tab label="Basic" id="tab-0" aria-controls="tabpanel-0" />
        <Tab label="Materials" id="tab-1" aria-controls="tabpanel-1" />
        <Tab label="Profile" id="tab-2" aria-controls="tabpanel-2" />
        <Tab label="Muntins" id="tab-3" aria-controls="tabpanel-3" />
      </Tabs>

      {/* Basic Tab */}
      <TabPanel value={tabValue} index={0}>
        <Stack spacing={2}>
          <TextField
            label="Width (mm)"
            type="number"
            value={config.width}
            onChange={(e) =>
              dispatch({
                type: "SET_WIDTH",
                payload: parseFloat(e.target.value),
              })
            }
            inputProps={{
              min: WINDOW_MIN_WIDTH,
              max: WINDOW_MAX_WIDTH,
              step: 10,
            }}
            data-cy="width-input"
          />

          <TextField
            label="Height (mm)"
            type="number"
            value={config.height}
            onChange={(e) =>
              dispatch({
                type: "SET_HEIGHT",
                payload: parseFloat(e.target.value),
              })
            }
            inputProps={{
              min: WINDOW_MIN_HEIGHT,
              max: WINDOW_MAX_HEIGHT,
              step: 10,
            }}
            data-cy="height-input"
          />

          <TextField
            label="Frame Depth (mm)"
            type="number"
            value={config.depth}
            onChange={(e) =>
              dispatch({
                type: "SET_DEPTH",
                payload: parseFloat(e.target.value),
              })
            }
            data-cy="depth-input"
          />

          <FormControl>
            <InputLabel>Window Type</InputLabel>
            <Select
              value={config.type}
              label="Window Type"
              onChange={(e) =>
                dispatch({
                  type: "SET_WINDOW_TYPE",
                  payload: e.target.value as any,
                })
              }
              data-cy="window-type-select"
            >
              <MenuItem value="1-part">1-Part</MenuItem>
              <MenuItem value="2-part">2-Part</MenuItem>
              <MenuItem value="3-part">3-Part</MenuItem>
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Opening Type</InputLabel>
            <Select
              value={config.opening.type}
              label="Opening Type"
              onChange={(e) =>
                dispatch({
                  type: "SET_OPENING",
                  payload: {
                    ...config.opening,
                    type: e.target.value as any,
                  },
                })
              }
              data-cy="opening-type-select"
            >
              {Object.entries(OPENING_TYPES).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </TabPanel>

      {/* Materials Tab */}
      <TabPanel value={tabValue} index={1}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <label htmlFor="color-outside">Outside Color:</label>
            <Input
              id="color-outside"
              type="color"
              value={config.frame.colorOutside}
              onChange={(e) =>
                dispatch({
                  type: "SET_FRAME_OUTSIDE_COLOR",
                  payload: e.target.value,
                })
              }
              data-cy="color-outside-picker"
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <label htmlFor="color-inside">Inside Color:</label>
            <Input
              id="color-inside"
              type="color"
              value={config.frame.colorInside}
              onChange={(e) =>
                dispatch({
                  type: "SET_FRAME_INSIDE_COLOR",
                  payload: e.target.value,
                })
              }
              data-cy="color-inside-picker"
            />
          </Box>
        </Stack>
      </TabPanel>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={2}>
        <FormControl fullWidth>
          <InputLabel>Frame Profile</InputLabel>
          <Select
            value={config.profile.profileKey}
            label="Frame Profile"
            onChange={(e) =>
              dispatch({
                type: "SET_PROFILE",
                payload: PROFILE_LIBRARY[e.target.value as string],
              })
            }
            data-cy="profile-select"
          >
            {Object.entries(PROFILE_LIBRARY).map(([key, profile]) => (
              <MenuItem key={key} value={key}>
                {key} ({profile.width}mm)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </TabPanel>

      {/* Muntins Tab */}
      <TabPanel value={tabValue} index={3}>
        <Stack spacing={2}>
          <FormControl>
            <InputLabel>Pattern</InputLabel>
            <Select
              value={config.muntins.pattern}
              label="Pattern"
              onChange={(e) =>
                dispatch({
                  type: "SET_MUNTINS",
                  payload: {
                    ...config.muntins,
                    pattern: e.target.value as any,
                  },
                })
              }
              data-cy="muntin-pattern-select"
            >
              {Object.entries(MUNTIN_PATTERNS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {config.muntins.pattern === "grid" && (
            <>
              <TextField
                label="Rows"
                type="number"
                value={config.muntins.rows}
                onChange={(e) =>
                  dispatch({
                    type: "SET_MUNTINS",
                    payload: {
                      ...config.muntins,
                      rows: parseInt(e.target.value),
                    },
                  })
                }
                inputProps={{ min: 0, max: 5 }}
                data-cy="muntin-rows-input"
              />

              <TextField
                label="Columns"
                type="number"
                value={config.muntins.columns}
                onChange={(e) =>
                  dispatch({
                    type: "SET_MUNTINS",
                    payload: {
                      ...config.muntins,
                      columns: parseInt(e.target.value),
                    },
                  })
                }
                inputProps={{ min: 0, max: 5 }}
                data-cy="muntin-columns-input"
              />
            </>
          )}

          <TextField
            label="Muntin Width (mm)"
            type="number"
            value={config.muntins.width}
            onChange={(e) =>
              dispatch({
                type: "SET_MUNTINS",
                payload: {
                  ...config.muntins,
                  width: parseFloat(e.target.value),
                },
              })
            }
            inputProps={{ min: 5, max: 50, step: 5 }}
            data-cy="muntin-width-input"
          />
        </Stack>
      </TabPanel>
    </Box>
  );
};
