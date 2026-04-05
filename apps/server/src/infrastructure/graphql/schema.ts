import { builder } from './builder.js';

// Import all modules to register their types/resolvers on the builder
import '../../modules/task/index.js';

export const schema = builder.toSchema();
