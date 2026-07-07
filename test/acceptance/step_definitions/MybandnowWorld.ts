import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import supertest from 'supertest';
import { TestApplication } from '../config/TestApplication.js';
import { DataUtil } from '../utils/DataUtil.js';

// Leemos las variables de entorno para ambos modos
const E2E_MODE = process.env.E2E_MODE || 'local';
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || '4008';

export class MybandnowWorld extends World {
  public request: ReturnType<typeof supertest>;
  public response!: supertest.Response;
  public authToken?: string;
  public authHeaderName?: string;
  public dataUtil: DataUtil;

  constructor(options: IWorldOptions) {
    super(options);

    if (E2E_MODE === 'remote') {
      // Modo CI/CD: Apuntamos a un servidor externo
      const baseURL = `http://${API_HOST}:${API_PORT}`;
      this.request = supertest(baseURL);
    } else {
      // Modo Local (TDD): Usamos la instancia de la app en memoria
      this.request = supertest(TestApplication.getHttpServer());
    }

    this.dataUtil = new DataUtil();
  }

  setAuthToken(token: string, headerName = 'Authorization') {
    this.authToken = token;
    this.authHeaderName = headerName;
  }
}

setWorldConstructor(MybandnowWorld);
