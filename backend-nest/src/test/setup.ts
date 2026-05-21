/* =============================================================================
   Integration Test Setup
   Carga .env.test antes de ejecutar los tests de integración
   ============================================================================= */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
