import { BeforeAll, AfterAll } from '@cucumber/cucumber';
import { TestApplication } from '../config/TestApplication.js';

// Leemos la variable de entorno. Si no existe, por defecto será 'local'.
const E2E_MODE = process.env.E2E_MODE || 'local';

BeforeAll(async () => {
  // Solo arrancamos la aplicación si estamos en modo local
  if (E2E_MODE === 'local') {
    await TestApplication.start();
  }
});

AfterAll(async () => {
  // Solo detenemos la aplicación si estamos en modo local
  if (E2E_MODE === 'local') {
    await TestApplication.stop();
  }
});
