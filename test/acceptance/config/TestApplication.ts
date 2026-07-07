import { Server } from 'http';
import { MybandnowBackendApp } from '../../../src/apps/mybandnow/backend/MybandnowBackendApp.js';

/**
 * Esta clase gestiona una única instancia de la aplicación para los tests locales.
 * Sigue un patrón Singleton para asegurar que la app se inicia y detiene una sola vez.
 */
export class TestApplication {
  private static mybandnowBackendApp: MybandnowBackendApp;
  private static server: Server;

  static async start(): Promise<void> {
    if (this.mybandnowBackendApp) {
      return;
    }
    this.mybandnowBackendApp = new MybandnowBackendApp();
    await this.mybandnowBackendApp.start();
    // Asumimos que tu MybandnowBackendApp tiene un método para devolver el servidor HTTP.
    // Si no lo tiene, deberás añadirlo.
    this.server = this.mybandnowBackendApp.httpServer!;
  }

  static async stop(): Promise<void> {
    if (this.server) {
      await this.mybandnowBackendApp.stop();
    }
  }

  static getHttpServer(): Server {
    if (!this.server) {
      throw new Error('Application not started for local testing. Call TestApplication.start() first.');
    }
    return this.server;
  }
}
