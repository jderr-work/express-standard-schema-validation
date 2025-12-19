import { ContainerTypes } from './types.js';

/**
 * Container configuration interface
 */
interface ContainerConfig {
  storageProperty: string;
}

/**
 * Storage properties for each container type.
 * The original (pre-validation) values are stored in these properties.
 */
export const containers: Record<ContainerTypes, ContainerConfig> = {
  [ContainerTypes.Query]: {
    storageProperty: 'originalQuery',
  },
  [ContainerTypes.Body]: {
    storageProperty: 'originalBody',
  },
  [ContainerTypes.Headers]: {
    storageProperty: 'originalHeaders',
  },
  [ContainerTypes.Params]: {
    storageProperty: 'originalParams',
  },
  [ContainerTypes.Fields]: {
    storageProperty: 'originalFields',
  },
};
